#include "configuration.h"
#include "credentials.h"
#include "sleep.ino"
#include "bme280.ino"
#include "mq135.ino"
#include "ttn.ino"

#include <Wire.h>
#include <lmic.h>
#include <hal/hal.h>

// ---------------------- GLOBALS ----------------------
Adafruit_BME280 bme;

float temp_f = 0, hum_f = 0, pres_f = 0;
float co2_ppm = 0, nox_ppm = 0, alcohol_ppm = 0, benzene_ppm = 0;
uint32_t temperature, humidity, pressure;
uint32_t co2, nox, alcohol, benzene;

RTC_DATA_ATTR int bootCount = 0;
RTC_DATA_ATTR uint32_t lastBootTime = 0;
esp_sleep_source_t wakeCause;

static uint8_t txBuffer[20];
bool packetSent = false, packetQueued = false;

// ---------------------- LMIC CALLBACK -----------------
void onEvent(ev_t ev) {
    switch(ev) {
        case EV_TXCOMPLETE:
            DEBUG_PORT.println("Packet sent");
            packetQueued = false;
            packetSent = true;
            break;
        default:
            break;
    }
}

// ---------------------- BUILD PAYLOAD ----------------
bool buildPacket() {
    int i = 0;
    int16_t temp_scaled = (int16_t)(temp_f * 100);
    txBuffer[i++] = temp_scaled >> 8; txBuffer[i++] = temp_scaled;

    uint16_t hum_scaled = (uint16_t)(hum_f * 100);
    txBuffer[i++] = hum_scaled >> 8; txBuffer[i++] = hum_scaled;

    uint16_t pres_scaled = (uint16_t)(pres_f * 10);
    txBuffer[i++] = pres_scaled >> 8; txBuffer[i++] = pres_scaled;

    uint16_t co2_scaled = (uint16_t)(co2_ppm * 10);
    txBuffer[i++] = co2_scaled >> 8; txBuffer[i++] = co2_scaled;

    uint16_t nox_scaled = (uint16_t)(nox_ppm * 1000);
    txBuffer[i++] = nox_scaled >> 8; txBuffer[i++] = nox_scaled;

    uint16_t alcohol_scaled = (uint16_t)(alcohol_ppm * 100);
    txBuffer[i++] = alcohol_scaled >> 8; txBuffer[i++] = alcohol_scaled;

    uint16_t benzene_scaled = (uint16_t)(benzene_ppm * 1000);
    txBuffer[i++] = benzene_scaled >> 8; txBuffer[i++] = benzene_scaled;

    DEBUG_PORT.print("Packet bytes: ");
    for (int j = 0; j < i; j++) DEBUG_PORT.printf("%02X ", txBuffer[j]);
    DEBUG_PORT.println();

    return true;
}

// ---------------------- SEND PAYLOAD -----------------
bool trySend() {
    packetSent = false;
    packetQueued = true;

    bme280_loop();
    mq135_loop(temp_f);

    if (!buildPacket()) return false;

    LMIC_setTxData2(LORAWAN_PORT, txBuffer, sizeof(txBuffer), 0);
    DEBUG_PORT.println("Sending packet via LMIC...");
    return true;
}

// ---------------------- DEEP SLEEP ------------------
void doDeepSleep(uint64_t msecToWake) {
    DEBUG_PORT.printf("Sleeping for %llu ms\n", msecToWake);
    LMIC_shutdown();
    sleep_millis(msecToWake);
}

void sleepLoop() {
#if SLEEP_BETWEEN_MESSAGES
    delay(MESSAGE_TO_SLEEP_DELAY);
    doDeepSleep(SEND_INTERVAL);
#endif
}

// ---------------------- SETUP -----------------------
void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(500);

    pinMode(BUTTON_PIN, INPUT_PULLUP);

    DEBUG_PORT.println("Initializing sensors...");
    bme280_setup();
    mq135_setup();

    bootCount++;
    wakeCause = esp_sleep_get_wakeup_cause();
    lastBootTime = millis();
    DEBUG_PORT.printf("Boot #%d, wake cause: %d\n", bootCount, wakeCause);

    os_init();
    LMIC_reset();

    LMIC_setSession(0x13, DEVADDR, NWKSKEY, APPSKEY);
    LMIC_selectSubBand(1);
    LMIC_setLinkCheckMode(0);
    LMIC.dn2Dr = DR_SF9;
    LMIC_setAdrMode(1);

    DEBUG_PORT.println("Setup complete!");
}

// ---------------------- LOOP ------------------------
void loop() {
    os_runloop_once();

    static uint32_t last = 0;
    if (millis() - last > SEND_INTERVAL) {
        trySend();
        last = millis();
    }

    if (packetSent) {
        packetSent = false;
        sleepLoop();
    }
}
