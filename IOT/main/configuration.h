#pragma once

#include <Arduino.h>
#include <lmic.h>
#include <hal/hal.h>

#define SERIAL_BAUD 115200
#define BUTTON_PIN 0
#define SEND_INTERVAL 10000 // in ms

#define USE_ABP
#define LORAWAN_ADR 1
#define SINGLE_CHANNEL_GATEWAY 0 // 0 = disable

#define NSS_GPIO 5
#define RESET_GPIO 14
#define DIO0_GPIO 2
#define DIO1_GPIO 4
#define DIO2_GPIO 15
#define SCK_GPIO 18
#define MISO_GPIO 19
#define MOSI_GPIO 23

// Custom events for callback
#define EV_QUEUED 100
#define EV_PENDING 101
#define EV_ACK 102
#define EV_RESPONSE 103
