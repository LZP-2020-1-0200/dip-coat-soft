#include "internet.h"
#include "web_server.h"
#include "stepper.h"
#include "programms.h"

unsigned long previousMillis = 0;

uint32_t passed_time = 0;
uint32_t total_passed_time = 0;
uint16_t position = 0;
uint8_t ledstate = LOW;

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
  if (!submitted && !go_to_top)
  {
    return;
  }

  if (go_to_top)
  {
    go_to_top_();
    go_to_top = !go_to_top;
    return;
  }
  
  // itereate for every input recieved
  for (input x : inputs)
  {
    // if speed is zero, then all valid inputs are executed and loop ends
    if (x.hidden == 1)
    {
      break;
    }

    passed_time = 0;
    previousMillis = 0;

    while (passed_time <= x.milli_seconds)
    {

      if (paused)
      {
        delay(1);
        previousMillis = 0;
        continue;
      }

      if (stopped)
      {
        stopped = !stopped;
        submitted = false;
        total_passed_time = 0;
        return;
      }

      unsigned long currentMillis = millis();
      if (currentMillis - previousMillis < x.interval)
      {
        delay(1);
        continue;
      }

      // Skip first previous millis
      passed_time += previousMillis ? (currentMillis - previousMillis) : 0;
      total_passed_time += previousMillis ? (currentMillis - previousMillis) : 0;

      previousMillis = currentMillis;
      ledstate = ledstate == HIGH ? LOW : HIGH;
      digitalWrite(LEDPIN,ledstate);

      position += x.direction;
      make_step(position & 0x3);
    }
  }
  submitted = false;
  total_passed_time = 0;
  clear_inputs();
}
