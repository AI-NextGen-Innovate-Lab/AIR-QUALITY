#include "bme280.h"
#include <Adafruit_BME280.h>

Adafruit_BME280 bme;

void bme280_setup() {
    if(!bme.begin(0x76)) {
        Serial.println("BME280 not found!");
    }
}

float bme280_read_temperature() { return bme.readTemperature(); }
float bme280_read_humidity()    { return bme.readHumidity(); }
float bme280_read_pressure()    { return bme.readPressure() / 100.0F; }
