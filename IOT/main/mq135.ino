#include "mq135.h"
#include <MQ135.h>

MQ135 gasSensor(A0);

void mq135_setup() { /* nothing to init */ }

float mq135_read_air_quality() { return gasSensor.getPPM(); }
