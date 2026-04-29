// ============================================================
//  Air Quality Sensor Node — Serial Monitor
//  Sensors : BME280 + HM3301 (PM2.5) + MQ-135 (multi-gas)
//  Board   : ESP32 FireBeetle
//  MQ-135  : Estimates CO2, NOx, VOCs, Alcohol ppm
//            using datasheet sensitivity curves
// ============================================================

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include "Seeed_HM330X.h"
#include <math.h>

// ─────────────────────────────────────────────────────────────
//  Pin & hardware config
// ─────────────────────────────────────────────────────────────
#define SDA_PIN        21
#define SCL_PIN        22
#define MQ135_PIN      34       // Analog input (input-only GPIO)
#define SEA_LEVEL_HPA  1013.25f

// ─────────────────────────────────────────────────────────────
//  MQ-135 calibration constants
//
//  Each gas curve is defined by two parameters from the
//  MQ-135 datasheet log-log sensitivity graph:
//
//    ppm = a * (Rs/Ro) ^ b
//
//  where:
//    Rs  = sensor resistance at current gas concentration
//    Ro  = sensor resistance in clean air (calibrated)
//    a,b = curve constants per gas (derived from datasheet)
//
//  RZERO: resistance in clean air (kOhm).
//  Default 76.63 is a typical value. After 24-48 h warm-up,
//  uncomment calibrateRo() in setup() and replace this value.
// ─────────────────────────────────────────────────────────────
#define MQ135_RZERO       76.63f   // Clean air resistance (kOhm) — calibrate!
#define MQ135_RLOAD       10.0f    // Load resistor on module (kOhm), usually 10k
#define MQ135_VREF        3.3f     // ESP32 ADC reference voltage
#define MQ135_ADC_MAX     4095.0f  // 12-bit ADC

// Gas curve constants { a, b }  =>  ppm = a * pow(Rs/Ro, b)
// Derived from MQ-135 datasheet sensitivity characteristic curves
struct GasCurve { float a; float b; };

const GasCurve CURVE_CO2     = { 116.60f, -2.769f };
const GasCurve CURVE_NOX     = {   1.07f, -2.018f };
const GasCurve CURVE_VOC     = {  56.34f, -3.267f };  // Benzene / general VOC
const GasCurve CURVE_ALCOHOL = {  77.26f, -3.180f };  // Ethanol

// ─────────────────────────────────────────────────────────────
//  Sensor objects
// ─────────────────────────────────────────────────────────────
Adafruit_BME280 bme;
HM330X          hm3301;
uint8_t         hm3301Buf[30];

// ─────────────────────────────────────────────────────────────
//  MQ-135 core math
// ─────────────────────────────────────────────────────────────

// Average 10 ADC samples to reduce noise
int readMQ135Raw() {
    long sum = 0;
    for (int i = 0; i < 10; i++) {
        sum += analogRead(MQ135_PIN);
        delay(5);
    }
    return (int)(sum / 10);
}

// Convert raw ADC reading to sensor resistance Rs (kOhm)
// Formula: Rs = Rload * (Vref - Vout) / Vout
float getRs(int raw) {
    float voltage = (raw / MQ135_ADC_MAX) * MQ135_VREF;
    if (voltage < 0.001f) voltage = 0.001f;  // prevent divide-by-zero
    return MQ135_RLOAD * (MQ135_VREF - voltage) / voltage;
}

// Calculate ppm using sensitivity curve: ppm = a * (Rs/Ro)^b
float getPPM(float rs, const GasCurve& curve) {
    float ratio = rs / MQ135_RZERO;
    if (ratio <= 0) return 0.0f;
    float ppm = curve.a * pow(ratio, curve.b);
    return max(0.0f, ppm);
}

// ─────────────────────────────────────────────────────────────
//  Ro calibration — run ONLY after 24-48 h warm-up in clean air
//  Rs/Ro in clean air = 3.6 (MQ-135 datasheet, Fig.2)
// ─────────────────────────────────────────────────────────────
float calibrateRo() {
    long sum = 0;
    for (int i = 0; i < 50; i++) {
        sum += analogRead(MQ135_PIN);
        delay(20);
    }
    float rs = getRs((int)(sum / 50));
    return rs / 3.60f;
}

// ─────────────────────────────────────────────────────────────
//  Air quality label helpers
// ─────────────────────────────────────────────────────────────
const char* co2Label(float ppm) {
    if (ppm < 400)  return "Excellent (fresh outdoor air)";
    if (ppm < 1000) return "Good (normal indoor)";
    if (ppm < 2000) return "Moderate (ventilate soon)";
    if (ppm < 5000) return "Poor (poorly ventilated)";
    return                 "Hazardous";
}

const char* noxLabel(float ppm) {
    if (ppm < 0.05f) return "Good";
    if (ppm < 0.1f)  return "Moderate";
    if (ppm < 0.6f)  return "Unhealthy";
    return                  "Hazardous";
}

const char* vocLabel(float ppm) {
    if (ppm < 0.05f) return "Excellent";
    if (ppm < 0.2f)  return "Good";
    if (ppm < 1.0f)  return "Moderate";
    if (ppm < 5.0f)  return "Poor";
    return                  "Hazardous";
}

const char* alcoholLabel(float ppm) {
    if (ppm < 10)  return "None detected";
    if (ppm < 50)  return "Trace levels";
    if (ppm < 200) return "Moderate";
    return                "High";
}

// ─────────────────────────────────────────────────────────────
//  Print helpers
// ─────────────────────────────────────────────────────────────
void printDivider(char c = '-', int len = 52) {
    for (int i = 0; i < len; i++) Serial.print(c);
    Serial.println();
}

void printBME280() {
    float temp     = bme.readTemperature();
    float humidity = bme.readHumidity();
    float pressure = bme.readPressure() / 100.0f;
    float altitude = bme.readAltitude(SEA_LEVEL_HPA);

    Serial.println("  [BME280] Environmental");
    Serial.printf("    Temperature : %.2f degC\n",  temp);
    Serial.printf("    Humidity    : %.2f %%\n",    humidity);
    Serial.printf("    Pressure    : %.2f hPa\n",   pressure);
    Serial.printf("    Altitude    : %.2f m\n",     altitude);
}

void printHM3301() {
    uint16_t pm1_std  = (hm3301Buf[2]  << 8) | hm3301Buf[3];
    uint16_t pm25_std = (hm3301Buf[4]  << 8) | hm3301Buf[5];
    uint16_t pm10_std = (hm3301Buf[6]  << 8) | hm3301Buf[7];
    uint16_t pm1_atm  = (hm3301Buf[8]  << 8) | hm3301Buf[9];
    uint16_t pm25_atm = (hm3301Buf[10] << 8) | hm3301Buf[11];
    uint16_t pm10_atm = (hm3301Buf[12] << 8) | hm3301Buf[13];

    Serial.println("  [HM3301] Particulate Matter");
    Serial.printf("    PM1.0  (std) : %4u ug/m3\n", pm1_std);
    Serial.printf("    PM2.5  (std) : %4u ug/m3\n", pm25_std);
    Serial.printf("    PM10   (std) : %4u ug/m3\n", pm10_std);
    Serial.printf("    PM1.0  (atm) : %4u ug/m3\n", pm1_atm);
    Serial.printf("    PM2.5  (atm) : %4u ug/m3\n", pm25_atm);
    Serial.printf("    PM10   (atm) : %4u ug/m3\n", pm10_atm);

    Serial.print("    PM2.5 level  : ");
    if      (pm25_atm <= 12)  Serial.println("Good");
    else if (pm25_atm <= 35)  Serial.println("Moderate");
    else if (pm25_atm <= 55)  Serial.println("Unhealthy (sensitive groups)");
    else if (pm25_atm <= 150) Serial.println("Unhealthy");
    else if (pm25_atm <= 250) Serial.println("Very Unhealthy");
    else                      Serial.println("Hazardous");
}

void printMQ135() {
    int   raw     = readMQ135Raw();
    float voltage = (raw / MQ135_ADC_MAX) * MQ135_VREF;
    float rs      = getRs(raw);
    float ratio   = rs / MQ135_RZERO;

    float co2_ppm     = getPPM(rs, CURVE_CO2);
    float nox_ppm     = getPPM(rs, CURVE_NOX);
    float voc_ppm     = getPPM(rs, CURVE_VOC);
    float alcohol_ppm = getPPM(rs, CURVE_ALCOHOL);

    Serial.println("  [MQ-135] Gas Concentrations (estimated ppm)");
    Serial.printf("    Raw ADC  : %d / 4095\n", raw);
    Serial.printf("    Voltage  : %.3f V\n",    voltage);
    Serial.printf("    Rs       : %.2f kOhm\n", rs);
    Serial.printf("    Rs/Ro    : %.3f\n",       ratio);
    Serial.println("    ----------------------------------------");
    Serial.printf("    CO2      : %8.1f ppm  | %s\n", co2_ppm,     co2Label(co2_ppm));
    Serial.printf("    NOx      : %8.3f ppm  | %s\n", nox_ppm,     noxLabel(nox_ppm));
    Serial.printf("    VOC      : %8.3f ppm  | %s\n", voc_ppm,     vocLabel(voc_ppm));
    Serial.printf("    Alcohol  : %8.1f ppm  | %s\n", alcohol_ppm, alcoholLabel(alcohol_ppm));
    Serial.println("    ----------------------------------------");
    Serial.println("    IMPORTANT: These are curve-based estimates.");
    Serial.println("    All gases affect the same element — readings");
    Serial.println("    cross-influence each other. Calibrate Rzero");
    Serial.println("    in clean outdoor air after 24-48 h warm-up.");
}

// ─────────────────────────────────────────────────────────────
//  Setup
// ─────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    while (!Serial) delay(10);
    delay(500);

    printDivider('=', 52);
    Serial.println("  Air Quality Node — Booting");
    printDivider('=', 52);

    Wire.begin(SDA_PIN, SCL_PIN);
    Serial.printf("  I2C : SDA=%d  SCL=%d\n", SDA_PIN, SCL_PIN);

    // BME280
    Serial.print("  BME280  ... ");
    if (!bme.begin(0x76, &Wire)) {
        Serial.print("not at 0x76, trying 0x77 ... ");
        if (!bme.begin(0x77, &Wire)) Serial.println("FAILED");
        else Serial.println("OK (0x77)");
    } else {
        Serial.println("OK (0x76)");
    }

    // HM3301
    Serial.print("  HM3301  ... ");
    if (hm3301.init() != NO_ERROR) Serial.println("FAILED");
    else Serial.println("OK (0x40)");

    // MQ-135
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);
    Serial.printf("  MQ-135  ... OK on GPIO %d\n", MQ135_PIN);
    Serial.printf("  Rzero   = %.2f kOhm  (default — calibrate in clean air)\n", MQ135_RZERO);

    // ── CALIBRATION: uncomment the block below ONLY after 24-48 h warm-up
    // ── in clean outdoor air. Note the printed Ro and set MQ135_RZERO to it.
    //
    // Serial.println("  Calibrating Ro (50 samples, clean air) ...");
    // float ro = calibrateRo();
    // Serial.printf("  >>> Measured Ro = %.2f kOhm\n", ro);
    // Serial.println("  >>> Copy that value into #define MQ135_RZERO and reflash.");

    printDivider('=', 52);
    Serial.println("  All sensors initialised. Reading every 5 s.");
    Serial.println("  MQ-135 warm-up: 24-48 h for stable ppm values.");
    printDivider('=', 52);
    Serial.println();
    delay(2000);
}

// ─────────────────────────────────────────────────────────────
//  Loop
// ─────────────────────────────────────────────────────────────
void loop() {
    static uint32_t count = 0;
    count++;

    printDivider('=', 52);
    Serial.printf("  Reading #%lu   uptime: %lu s\n", count, millis() / 1000);
    printDivider('=', 52);

    printBME280();
    Serial.println();

    err_t ret = hm3301.read_sensor_value(hm3301Buf, 29);
    if (ret != NO_ERROR) Serial.printf("  [HM3301] Read error: %d\n", ret);
    else printHM3301();
    Serial.println();

    printMQ135();
    Serial.println();

    printDivider('-', 52);
    Serial.println();

    delay(5000);
}