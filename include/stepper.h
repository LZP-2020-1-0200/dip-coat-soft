#ifndef STEPPER_H
#define STEPPER_H

#define LEDPIN 2
#define STEPPER_LINE1 15
#define STEPPER_LINE2 13
#define STEPPER_LINE3 12
#define STEPPER_LINE4 14
#define REACHED_TOP_LINE 5
#define REACHED_BOTTOM_LINE 4

#include "Arduino.h"

void go_to_top_();
void make_step(int);
uint16_t calculate_pause_interval(uint32_t);
uint32_t calculate_time_needed(uint32_t, uint32_t);
#endif // DEBUG