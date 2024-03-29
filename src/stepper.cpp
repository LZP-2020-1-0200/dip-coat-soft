#include "stepper.h"
#include "web_server.h"

const double DISTANCE_NM_PER_ROTATION = 83333.33;
static const uint8_t Q1[] = {LOW, HIGH, HIGH, LOW};
static const uint8_t Q2[] = {HIGH, LOW, LOW, HIGH};
static const uint8_t Q3[] = {LOW, LOW, HIGH, HIGH};
static const uint8_t Q4[] = {HIGH, HIGH, LOW, LOW};

uint32_t calculate_pause_interval(uint32_t speed)
{
  return round(DISTANCE_NM_PER_ROTATION / double(speed) * 1000);
}

uint64_t calculate_time_needed(uint32_t distance, uint32_t speed)
{
  return round(((double)distance / (double)speed) * 1000);
}

void make_step(uint16_t phase)
{
  digitalWrite(STEPPER_LINE1, Q1[phase]);
  digitalWrite(STEPPER_LINE2, Q2[phase]);
  digitalWrite(STEPPER_LINE3, Q3[phase]);
  digitalWrite(STEPPER_LINE4, Q4[phase]);
}

bool go_up_(unsigned long currentMillis, unsigned long *previousMillis, uint16_t *position)
{
  digitalWrite(UP_LED, HIGH);
  if (currentMillis - *previousMillis >= 4800)
  {
    make_step((*position)-- & 0x3);
    *previousMillis = currentMillis;
  }

  if (digitalRead(REACHED_TOP_LINE))
  {
    digitalWrite(UP_LED, LOW);
    digitalWrite(STEPPER_LINE1, LOW);
    digitalWrite(STEPPER_LINE2, LOW);
    digitalWrite(STEPPER_LINE3, LOW);
    digitalWrite(STEPPER_LINE4, LOW);
  }

  return !digitalRead(REACHED_TOP_LINE);
}

bool go_down_(unsigned long currentMillis, unsigned long *previousMillis, uint16_t *position)
{
  digitalWrite(DOWN_LED, HIGH);
  if (currentMillis - *previousMillis >= 4800)
  {
    make_step((*position)++ & 0x3);
    *previousMillis = currentMillis;
  }

  if (digitalRead(REACHED_BOTTOM_LINE))
  {
    digitalWrite(STEPPER_LINE1, LOW);
    digitalWrite(STEPPER_LINE2, LOW);
    digitalWrite(STEPPER_LINE3, LOW);
    digitalWrite(STEPPER_LINE4, LOW);
    digitalWrite(DOWN_LED, LOW);
  }

  return !digitalRead(REACHED_BOTTOM_LINE);
}
