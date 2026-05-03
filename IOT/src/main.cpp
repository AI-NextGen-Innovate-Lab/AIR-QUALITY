// ============================================================
//  Air Quality Sensor Node — Serial Monitor
//  Sensors : BME280 + HM3301 (PM2.5) + MQ-135 (multi-gas)
//  Board   : ESP32 FireBeetle
//  MQ-135  : Estimates CO2-equivalent, NOx, VOCs, Alcohol ppm
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
#define SDA_PIN 21
#define SCL_PIN 22
#define MQ135_PIN 34 // Analog input (input-only GPIO)
#define SEA_LEVEL_HPA 1013.25f

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
#define MQ135_RZERO 76.63f    // Clean air resistance (kOhm) — calibrate!
#define MQ135_RLOAD 10.0f     // Load resistor on module (kOhm), usually 10k
#define MQ135_VREF 3.3f       // ESP32 ADC reference voltage
#define MQ135_ADC_MAX 4095.0f // 12-bit ADC

//  Gas curve constants { a, b }  =>  ppm = a * pow(Rs/Ro, b)
//  Derived from MQ-135 datasheet sensitivity characteristic curves.
//
//  IMPORTANT:
//  MQ-135 is not a true CO2 sensor and cannot measure oxygen (O2).
//  The CO2 output below is a calibrated CO2-equivalent estimate,
//  not a laboratory-grade absolute ppm reading.
struct GasCurve
{
    float a;
    float b;
};

const GasCurve CURVE_CO2 = {116.60f, -2.769f};
const GasCurve CURVE_NOX = {1.07f, -2.018f};
const GasCurve CURVE_VOC = {56.34f, -3.267f};     // Benzene / general VOC
const GasCurve CURVE_ALCOHOL = {77.26f, -3.180f}; // Ethanol

// Empirical clean-air baseline used to keep the displayed CO2 value realistic.
// Calibrate this in fresh outdoor air if you need a different baseline.
#define MQ135_CO2_EQ_BASELINE_PPM 420.0f
#define MQ135_CO2_EQ_CLEAN_RATIO 12.5f

// ─────────────────────────────────────────────────────────────
//  Sensor objects
// ─────────────────────────────────────────────────────────────
Adafruit_BME280 bme;
HM330X hm3301;
uint8_t hm3301Buf[30];

// ─────────────────────────────────────────────────────────────
//  MQ-135 core math
// ─────────────────────────────────────────────────────────────

// Average 10 ADC samples to reduce noise
int readMQ135Raw()
{
    long sum = 0;
    for (int i = 0; i < 10; i++)
    {
        sum += analogRead(MQ135_PIN);
        delay(5);
    }
    return (int)(sum / 10);
}

// Convert raw ADC reading to sensor resistance Rs (kOhm)
// Formula: Rs = Rload * (Vref - Vout) / Vout
float getRs(int raw)
{
    float voltage = (raw / MQ135_ADC_MAX) * MQ135_VREF;
    if (voltage < 0.001f)
        voltage = 0.001f; // prevent divide-by-zero
    return MQ135_RLOAD * (MQ135_VREF - voltage) / voltage;
}

// Calculate ppm using sensitivity curve: ppm = a * (Rs/Ro)^b
float getPPM(float rs, const GasCurve &curve)
{
    float ratio = rs / MQ135_RZERO;
    if (ratio <= 0)
        return 0.0f;
    float ppm = curve.a * pow(ratio, curve.b);
    return max(0.0f, ppm);
}

// CO2-equivalent estimate anchored to a realistic outdoor-air baseline.
// This keeps the displayed number in a plausible range, but it is still
// only an approximation from the MQ-135 sensor.
float getCO2Equivalent(float rs)
{
    float ratio = rs / MQ135_RZERO;
    if (ratio <= 0.0f)
        return 0.0f;

    float ppm = MQ135_CO2_EQ_BASELINE_PPM * pow(MQ135_CO2_EQ_CLEAN_RATIO / ratio, 1.0f);
    return constrain(ppm, 0.0f, 5000.0f);
}

// ─────────────────────────────────────────────────────────────
//  Ro calibration — run ONLY after 24-48 h warm-up in clean air
//  Rs/Ro in clean air = 3.6 (MQ-135 datasheet, Fig.2)
// ─────────────────────────────────────────────────────────────
float calibrateRo()
{
    long sum = 0;
    for (int i = 0; i < 50; i++)
    {
        sum += analogRead(MQ135_PIN);
        delay(20);
    }
    float rs = getRs((int)(sum / 50));
    return rs / 3.60f;
}

// ─────────────────────────────────────────────────────────────
//  Air quality label helpers
// ─────────────────────────────────────────────────────────────
void printDivider(char c = '=', int len = 52)
{
    for (int i = 0; i < len; i++)
        Serial.print(c);
    Serial.println();
}

void printStartupInfo()
{
    printDivider('=', 52);
    Serial.println("Air quality node starting");
    Serial.println("MQ-135 warm-up: 60 seconds");
    Serial.println();
    Serial.println("MQ-135 calibration settings");
    Serial.printf("  RZERO baseline     : %.2f kOhm\n", MQ135_RZERO);
    Serial.printf("  CO2e clean-air ppm : %.1f ppm\n", MQ135_CO2_EQ_BASELINE_PPM);
    Serial.printf("  Clean-air Rs/Ro    : %.2f\n", MQ135_CO2_EQ_CLEAN_RATIO);
    Serial.println("  Tip: if indoor CO2e stays too low, lower RZERO only after");
    Serial.println("       recalibrating in fresh outdoor air.");
    printDivider('=', 52);
}

void printSectionTitle(const char *title)
{
    Serial.println(title);
}

void printBME280()
{
    float temp = bme.readTemperature();
    float humidity = bme.readHumidity();
    float pressure = bme.readPressure() / 100.0f;
    float altitude = bme.readAltitude(SEA_LEVEL_HPA);

    printSectionTitle("[BME280]");
    Serial.printf("  Temperature : %.2f C\n", temp);
    Serial.printf("  Humidity    : %.2f %%\n", humidity);
    Serial.printf("  Pressure    : %.2f hPa\n", pressure);
    Serial.printf("  Altitude    : %.2f m\n", altitude);
}

void printHM3301()
{
    uint16_t pm1_std = (hm3301Buf[2] << 8) | hm3301Buf[3];
    uint16_t pm25_std = (hm3301Buf[4] << 8) | hm3301Buf[5];
    uint16_t pm10_std = (hm3301Buf[6] << 8) | hm3301Buf[7];
    uint16_t pm1_atm = (hm3301Buf[8] << 8) | hm3301Buf[9];
    uint16_t pm25_atm = (hm3301Buf[10] << 8) | hm3301Buf[11];
    uint16_t pm10_atm = (hm3301Buf[12] << 8) | hm3301Buf[13];

    printSectionTitle("[HM3301]");
    Serial.printf("  PM1.0 (atm) : %u ug/m3\n", pm1_atm);
    Serial.printf("  PM2.5 (atm) : %u ug/m3\n", pm25_atm);
    Serial.printf("  PM10  (atm) : %u ug/m3\n", pm10_atm);
}

void printMQ135()
{
    int raw = readMQ135Raw();
    float voltage = (raw / MQ135_ADC_MAX) * MQ135_VREF;
    float rs = getRs(raw);
    float ratio = rs / MQ135_RZERO;

    float co2_eq_ppm = getCO2Equivalent(rs);
    float nox_ppm = getPPM(rs, CURVE_NOX);
    float voc_ppm = getPPM(rs, CURVE_VOC);
    float alcohol_ppm = getPPM(rs, CURVE_ALCOHOL);

    printSectionTitle("[MQ-135]");
    Serial.printf("  Raw ADC     : %d / 4095\n", raw);
    Serial.printf("  Voltage     : %.3f V\n", voltage);
    Serial.printf("  Rs          : %.2f kOhm\n", rs);
    Serial.printf("  Rs/Ro       : %.3f\n", ratio);
    Serial.printf("  CO2 eq      : %.1f ppm\n", co2_eq_ppm);
    Serial.printf("  NOx         : %.3f ppm\n", nox_ppm);
    Serial.printf("  VOC         : %.3f ppm\n", voc_ppm);
    Serial.printf("  Alcohol     : %.1f ppm\n", alcohol_ppm);
}

// ─────────────────────────────────────────────────────────────
//  Setup
// ─────────────────────────────────────────────────────────────
void setup()
{
    Serial.begin(115200);
    while (!Serial)
        delay(10);
    delay(500);

    printStartupInfo();

    Wire.begin(SDA_PIN, SCL_PIN);

    if (!bme.begin(0x76, &Wire))
    {
        if (!bme.begin(0x77, &Wire))
            ;
    }

    hm3301.init();

    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);

    delay(60000);
}

// ─────────────────────────────────────────────────────────────
//  Loop
// ─────────────────────────────────────────────────────────────
void loop()
{
    static uint32_t count = 0;
    count++;

    printBME280();
    printDivider('-', 52);

    HM330XErrorCode ret = hm3301.read_sensor_value(hm3301Buf, 29);
    if (ret != NO_ERROR)
        Serial.printf("  HM3301 error : %d\n", ret);
    else
        printHM3301();
    printDivider('-', 52);

    printMQ135();

    delay(60000);
}
