Introduction

This repository contains the hardware implementation of the Air Quality Monitoring System, designed to measure environmental and air pollution parameters in real time and transmit the data to The Things Network (TTN) using LoRaWAN communication.

The system is built around the ESP32 FireBeetle microcontroller integrated with a LoRa module, forming a low-power wireless sensor node. The node collects data from multiple environmental sensors, processes it, and sends compact payloads over a LoRa gateway to the cloud for storage, visualization, and further analysis.

Sensors Used

The hardware node integrates the following sensors to capture a wide range of environmental and air quality parameters:

MQ-135 Gas Sensor
Used to detect air pollutants such as ammonia (NH₃), nitrogen oxides (NOₓ), alcohol, benzene, smoke, and carbon dioxide (CO₂). It provides an analog output that represents overall air quality levels.

BME280 Environmental Sensor
A digital sensor that measures temperature, humidity, and atmospheric pressure with high accuracy using I²C communication.

HM3301 Laser Dust Sensor
A particulate matter sensor that measures air quality based on particle concentration, including PM1.0, PM2.5, and PM10, which are critical indicators of air pollution.

Data Transmission

After collecting data from the sensors, the ESP32 encodes the readings into a compact payload and transmits them via LoRaWAN to a nearby gateway. The gateway forwards the data to The Things Network, where it can be decoded, visualized, and integrated with backend systems such as APIs or dashboards.

![Air Quality Node](img/fyp.png)

