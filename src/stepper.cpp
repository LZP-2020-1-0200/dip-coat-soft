#include "stepper.h"
#include "web_server.h"

const uint32_t DISTANCE_NM_PER_ROTATION = 320800;
static const uint8_t Q1[] = {LOW, HIGH, HIGH, LOW};
static const uint8_t Q2[] = {HIGH, LOW, LOW, HIGH};
static const uint8_t Q3[] = {LOW, LOW, HIGH, HIGH};
static const uint8_t Q4[] = {HIGH, HIGH, LOW, LOW};

uint16_t calculate_pause_interval(uint32_t speed)
{
  return round(DISTANCE_NM_PER_ROTATION / double(speed));
}

uint32_t calculate_time_needed(uint32_t distance, uint32_t speed)
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

// void go_to_top_()
// {
//   Serial.println("Going top");
//   uint16_t position = 0;
//   unsigned long previousMillis = 0;
//   int ledstate = LOW;
//   Serial.println(digitalRead(REACHED_TOP_LINE));
//   while (!digitalRead(REACHED_TOP_LINE))
//   {
//     unsigned long currentMillis = millis();
//     if (currentMillis - previousMillis >= 100)
//     {
//       previousMillis = currentMillis;
//       ledstate = ledstate == HIGH ? LOW : HIGH;
//       digitalWrite(LEDPIN, ledstate);
//       make_step(position++ & 0x3);
//       Serial.println(position);
//     }
//   }
// }

bool go_up_(unsigned long currentMillis, unsigned long *previousMillis, uint16_t *position)
{
  if (currentMillis - *previousMillis >= 65)
  {
    int ledstate = (*position) % 2 == 0 ? HIGH : LOW;
    digitalWrite(LEDPIN, ledstate);
    make_step((*position)++ & 0x3);
    *previousMillis = currentMillis;
  }
  return !digitalRead(REACHED_TOP_LINE);
}
