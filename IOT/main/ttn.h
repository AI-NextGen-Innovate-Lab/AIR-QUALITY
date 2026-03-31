#pragma once
#include <Arduino.h>

void ttn_setup();
void ttn_join();
void ttn_loop();
void ttn_send(uint8_t *data, uint8_t size, uint8_t port, bool confirmed);
void ttn_register(void (*callback)(uint8_t message));
size_t ttn_response_len();
void ttn_response(uint8_t *buffer, size_t len);
void ttn_erase_prefs();
