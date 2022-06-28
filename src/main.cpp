#include "internet.h"
#include "web_server.h"
#include "stepper.h"

unsigned long previousMillis = 0;
unsigned long previousMillisGoUp = 0;
unsigned long previousMillisGoDown = 0;

uint32_t passed_time = 0;
uint32_t total_passed_time = 0;
uint16_t position = 0;
uint8_t ledstate = LOW;
uint8_t currentInputNr = 0;

bool reached_top = false;
bool reached_bottom = false;

void setup()
{
  Serial.begin(74880);

  pinMode(LEDPIN, HIGH);
  pinMode(STEPPER_LINE1, OUTPUT);
  pinMode(STEPPER_LINE2, OUTPUT);
  pinMode(STEPPER_LINE3, OUTPUT);
  pinMode(STEPPER_LINE4, OUTPUT);

  pinMode(REACHED_TOP_LINE, INPUT);
  pinMode(REACHED_BOTTOM_LINE, INPUT);

  pinMode(UP_LED, OUTPUT);
  pinMode(DOWN_LED, OUTPUT);

  digitalWrite(UP_LED, LOW);
  digitalWrite(DOWN_LED, LOW);

  // digitalWrite(DOWN_LED,HIGH);

  if (!LittleFS.begin())
  {
    Serial.println("An Error has occurred while mounting LittleFS");
    return;
  }

  if (!LittleFS.exists("/index.html"))
  {
    Serial.println("\nCould not find index.html");
    return;
  }

  if (!initialize_wifi())
  {
    Serial.println("\nCould not connect to WiFi");
    return;
  }

  initialize_server();
}

void loop()
{
  const unsigned long currentMillis = micros();

  // while paused don't go beyond those lines
  if (paused)
  {
    Serial.println("paused");
    previousMillis = 0;
    return;
  }

  // if go to top pressed move up until reached top
  if (go_to_top && !stopped)
  {
    go_to_top = go_up_(currentMillis, &previousMillisGoUp, &position);
    reached_top = !go_to_top;
    return;
  }

  if (go_to_btm && !stopped)
  {
    go_to_btm = go_down_(currentMillis, &previousMillisGoDown, &position);
    reached_bottom = !go_to_btm;
    return;
  }

  // if stopped reset all variables and clears inputs
  if (stopped)
  {
    stopped = false;
    submitted = false;
    total_passed_time = 0;
    passed_time = 0;
    currentInputNr = 0;
    previousMillis = 0;
    clear_inputs();
    digitalWrite(DOWN_LED, LOW);
    digitalWrite(UP_LED, LOW);
    digitalWrite(STEPPER_LINE1, LOW);
    digitalWrite(STEPPER_LINE2, LOW);
    digitalWrite(STEPPER_LINE3, LOW);
    digitalWrite(STEPPER_LINE4, LOW);
    return;
  }

  // if submitted in browser
  if (submitted)
  {
    reached_top = false;
    reached_bottom = false;

    // if current input is hidden that means that program ended
    if (inputs[currentInputNr].hidden == 1)
    {
      stopped = true;
      return;
    }

    if (digitalRead(REACHED_TOP_LINE) && inputs[currentInputNr].direction == -1)
    {
      reached_top = true;
      stopped = true;
    }

    // if reached top or bottom
    if (digitalRead(REACHED_BOTTOM_LINE) && inputs[currentInputNr].direction == 1)
    {
      reached_bottom = true;
      stopped = true;
    }

    // if interval is bigger than current input interval
    if (currentMillis - previousMillis >= inputs[currentInputNr].interval)
    {
      // Current input sum of time
      if (previousMillis && currentMillis > previousMillis)
      {
        passed_time += (currentMillis - previousMillis) / 1000;
        total_passed_time += (currentMillis - previousMillis) / 1000;
      }

      previousMillis = currentMillis;

      digitalWrite(inputs[currentInputNr].direction == 1 ? DOWN_LED : UP_LED, HIGH);

      position += inputs[currentInputNr].direction;
      make_step(position & 0x3);

      // If current input sum of time is bigger than calculated continue to the next one
      if (passed_time >= inputs[currentInputNr].milli_seconds)
      {
        passed_time = 0;
        currentInputNr++;
        previousMillis = 0;
        digitalWrite(DOWN_LED, LOW);
        digitalWrite(UP_LED, LOW);
      }
    }
  }
}
