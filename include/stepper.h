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

const uint32_t DISTANCE_NM_PER_ROTATION = 326000;
static const uint8_t Q1[] = {LOW, HIGH, HIGH, LOW};
static const uint8_t Q2[] = {HIGH, LOW, LOW, HIGH};
static const uint8_t Q3[] = {LOW, LOW, HIGH, HIGH};
static const uint8_t Q4[] = {HIGH, HIGH, LOW, LOW};

void go_to_top_();
void make_step(int);
uint16_t calculate_pause_interval(uint32_t);
uint32_t calculate_time_needed(uint32_t, uint32_t);
#endif // DEBUG