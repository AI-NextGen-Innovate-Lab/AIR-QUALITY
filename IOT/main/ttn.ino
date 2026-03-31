#include "ttn.h"
#include "configuration.h"
#include "credentials.h"
#include <SPI.h>
#include <Preferences.h>
#include <vector>

const lmic_pinmap lmic_pins = {
    .nss = NSS_GPIO,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = RESET_GPIO,
    .dio = {DIO0_GPIO, DIO1_GPIO, DIO2_GPIO},
};

static RTC_DATA_ATTR uint32_t count = 0;
static std::vector<void (*)(uint8_t)> _lmic_callbacks;

void _ttn_callback(uint8_t message) {
    for (auto cb : _lmic_callbacks) cb(message);
}

void ttn_register(void (*callback)(uint8_t message)) {
    _lmic_callbacks.push_back(callback);
}

size_t ttn_response_len() { return LMIC.dataLen; }

void ttn_response(uint8_t *buffer, size_t len) {
    for (uint8_t i=0;i<LMIC.dataLen;i++) buffer[i] = LMIC.frame[LMIC.dataBeg+i];
}

void ttn_erase_prefs() {
    Preferences p;
    if(p.begin("loratest", false)) {
        p.clear();
        p.end();
    }
}

bool ttn_setup() {
    Preferences p;
    p.begin("loratest", false);
    count = p.getUInt("counttest", 0);
    p.end();

    SPI.begin(SCK_GPIO, MISO_GPIO, MOSI_GPIO, NSS_GPIO);
    bool initSuccess = (1 == os_init_ex((const void *)&lmic_pins));
    Serial.println(initSuccess ? "TTN Init Success" : "TTN Init Fail");
    return initSuccess;
}

void ttn_join() {
    LMIC_reset();
#ifdef USE_ABP
    LMIC_setSession(0x1, DEVADDR, NWKSKEY, APPSKEY);
    LMIC.dn2Dr = DR_SF9;
    _ttn_callback(EV_ACK); // Custom callback for joined
#endif
}

void ttn_send(uint8_t *data, uint8_t size, uint8_t port, bool confirmed) {
    if(LMIC.opmode & OP_TXRXPEND) { _ttn_callback(EV_PENDING); return; }
    LMIC_setTxData2(port, data, size, confirmed ? 1 : 0);
    _ttn_callback(EV_QUEUED);
    count++;
}

void ttn_loop() { os_runloop_once(); }