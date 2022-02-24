#include "internet.h"
#include "web_server.h"

#define LEDPIN 2
#define STEPPER_LINE1 15
#define STEPPER_LINE2 13
#define STEPPER_LINE3 12
#define STEPPER_LINE4 14
#define REACHED_TOP_LINE 5
#define REACHED_BOTTOM_LINE 4

static const uint8_t Q1[] = {LOW, HIGH, HIGH, LOW};
static const uint8_t Q2[] = {HIGH, LOW, LOW, HIGH};
static const uint8_t Q3[] = {LOW, LOW, HIGH, HIGH};
static const uint8_t Q4[] = {HIGH, HIGH, LOW, LOW};

unsigned long previousMillis = 0;
unsigned long currentMillis;
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
  if (submitted)
  {
    passed_time2 = "0";
    uint8_t i = 0;
    while (inputs[i].speed && !finished && submitted)
    {
      currentMillis = millis();
      if (currentMillis - previousMillis >= inputs[i].interval)
      {
        if (previousMillis)
          passed_time += (currentMillis - previousMillis);

        previousMillis = currentMillis;
        // ledstate = ledstate == HIGH ? LOW : HIGH;
        // digitalWrite(LEDPIN, ledstate);

        position += inputs[i].direction ? 1 : -1;
        const int phase = position & 0x3;
        digitalWrite(STEPPER_LINE1, Q1[phase]);
        digitalWrite(STEPPER_LINE2, Q2[phase]);
        digitalWrite(STEPPER_LINE3, Q3[phase]);
        digitalWrite(STEPPER_LINE4, Q4[phase]);

        // Serial.println((inputs[i].milli_seconds - passed_time) / 1000);
        passed_time2 = String((passed_time+total_passed_time)/1000);

        if (passed_time >= inputs[i].milli_seconds)
        {
          i++;
          total_passed_time += passed_time;
          passed_time = 0;
          previousMillis = 0;
        }
      }
    }
    finished = true;
  }
  if (go_to_top)
  {
    Serial.println("i recieved command");
    while (!digitalRead(REACHED_TOP_LINE))
    {
      delayMicroseconds(200000);
      position += 1;
      const int phase = position & 0x3;
      Serial.println(phase);
      digitalWrite(STEPPER_LINE1, Q1[phase]);
      digitalWrite(STEPPER_LINE2, Q2[phase]);
      digitalWrite(STEPPER_LINE3, Q3[phase]);
      digitalWrite(STEPPER_LINE4, Q4[phase]);
    }
    go_to_top = false;
  }
}
