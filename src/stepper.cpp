#include "stepper.h"
#include "web_server.h"

// const uint32_t DISTANCE_NM_PER_ROTATION = 320800;
const double DISTANCE_NM_PER_ROTATION = 83333.33;
static const uint8_t Q1[] = {LOW, HIGH, HIGH, LOW};
static const uint8_t Q2[] = {HIGH, LOW, LOW, HIGH};
static const uint8_t Q3[] = {LOW, LOW, HIGH, HIGH};
static const uint8_t Q4[] = {HIGH, HIGH, LOW, LOW};

// unsigned long calculate_pause_interval(uint32_t speed)
// {
//   return round(DISTANCE_NM_PER_ROTATION / double(speed)*1000);
// }

// uint64_t calculate_time_needed(uint32_t distance, uint32_t speed)
// {
//   return round(((double)distance / (double)speed) * 1000);
// }

uint32_t calculate_pause_interval(uint32_t speed)
{
  return round(DISTANCE_NM_PER_ROTATION / double(speed)*1000);
}

uint64_t calculate_time_needed(uint32_t distance, uint32_t speed)
{
  return round(((double)distance / (double)speed) * 1000);
}

void make_step(int phase)
{
  digitalWrite(STEPPER_LINE1, Q1[phase]);
  digitalWrite(STEPPER_LINE2, Q2[phase]);
  digitalWrite(STEPPER_LINE3, Q3[phase]);
  digitalWrite(STEPPER_LINE4, Q4[phase]);
}

bool go_up_(unsigned long currentMillis, unsigned long *previousMillis, uint16_t *position)
{
  if (currentMillis - *previousMillis >= 4)
  {
    // int ledstate = (*position) % 2 == 0 ? HIGH : LOW;
    // digitalWrite(LEDPIN, ledstate);
    // Inverted
    make_step((*position)-- & 0x3);
    *previousMillis = currentMillis;
  }
  return !digitalRead(REACHED_TOP_LINE);
}
