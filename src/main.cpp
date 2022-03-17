#include "internet.h"
#include "web_server.h"
#include "stepper.h"

unsigned long previousMillis = 0;

uint32_t passed_time = 0;
uint32_t total_passed_time = 0;
uint16_t position = 0;
uint8_t ledstate = LOW;
uint8_t currentInputNr = 0;

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
  const unsigned long currentMillis = millis();

  // while paused don't go beyond those lines
  if (paused)
  {
    previousMillis = 0;
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
  }

  // if submited in browser
  if (submitted)
  {
    previousMillis = previousMillis ? previousMillis : millis();
    // if current input is hidden that means that programm ended
    if (inputs[currentInputNr].hidden == 1)
    {
      // Serial.println(total_passed_time);
      stopped = true;
      return;
    }

    // if interval is bigger than current input interval
    if (currentMillis - previousMillis >= inputs[currentInputNr].interval)
    {
      // Serial.println(inputs[currentInputNr].milli_seconds - (currentMillis - previousMillis));

      // Current input sum of time
      passed_time += currentMillis - previousMillis;
      // Total programm sum of time
      total_passed_time += currentMillis - previousMillis;

      previousMillis = currentMillis;
      ledstate = ledstate == HIGH ? LOW : HIGH;
      digitalWrite(LEDPIN, ledstate);
      position += inputs[currentInputNr].direction;
      make_step(position & 0x3);

      // If current input sum of time is bigger than calculated continue to the next one
      if (passed_time >= inputs[currentInputNr].milli_seconds)
      {
        passed_time = 0;
        currentInputNr++;
        previousMillis = 0;
      }
    }
  }

  // if go to top pressed move up until reached top
  if (go_to_top)
  {
    go_to_top = go_up_(currentMillis, &previousMillis, &position);
  }
}
