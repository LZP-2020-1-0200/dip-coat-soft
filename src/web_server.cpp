#include "web_server.h"
#include "stepper.h"
#include "AsyncJson.h"
#include "ArduinoJson.h"

AsyncWebServer server(80);
input inputs[15];
bool submitted;
bool go_to_top;
bool paused = false;
bool stopped = false;

void print_input()
{
    for (auto x : inputs)
    {

        Serial.print("Speed: ");
        Serial.print(x.speed);
        Serial.print(" Distance: ");
        Serial.print(x.distance);
        Serial.print(" Interval: ");
        Serial.print(x.interval);
        Serial.print(" Position: ");
        Serial.println(x.direction == 1 ? "Up" : "Down");
    }
    Serial.println("");
}

String processor(const String &var)
{
    // int i = 0;
    // while (inputs[i].speed)
    // {
    //     if (var == "SPEED" + String(i))
    //     {
    //         return String(inputs[i].speed);
    //     }

    //     else if (var == "DIRECTION" + String(i))
    //     {
    //         return inputs[i].direction == 0 ? "Checked" : "";
    //     }

    //     else if (var == "DISTANCE" + String(i))
    //     {
    //         return String(inputs[i].distance/1000);
    //     }
    //     i++;
    // }
    return "";
}

void initialize_server()
{
    server.serveStatic("/images", LittleFS, "/images");
    server.serveStatic("/css", LittleFS, "/css");
    server.serveStatic("/js", LittleFS, "/js");

    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request)
              { request->send(LittleFS, "/index.html", String(), false, processor); });

    server.on("/go_to_top", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  go_to_top = true;
                  request->send(200, "text/plain", "Going top"); });


    server.on("/pause", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  paused = !paused;
                  request->send(200, "text/plain", "Paused"); }

    );

    server.on("/stop", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  stopped = true;
                  request->send(200, "text/plain", "Stopped"); }

    );

    server.on("/submit", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  submitted = false;
                  StaticJsonDocument<1536> doc;
                  AsyncWebParameter *p = request->getParam(0);
                  deserializeJson(doc, p->value());
                  JsonObject root = doc.as<JsonObject>();

                  for (unsigned int i = 0; i < sizeof(inputs) / sizeof(inputs[0]); i++)
                  {
                      Serial.println(i);
                      inputs[i].speed = 0;
                      inputs[i].direction = 0;
                      inputs[i].distance = 0;
                      inputs[i].interval = 0;
                      inputs[i].milli_seconds = 0;
                  }

                  int i = 0;
                  for (JsonPair kv : root)
                  {
                      // if parameter speed
                      if (kv.key().c_str()[2] == 'e')
                          inputs[i].speed = kv.value().as<uint32_t>();

                      // if parameter is distnace
                      else if (kv.key().c_str()[2] == 's')
                          inputs[i].distance = (kv.value().as<uint32_t>()) * 1000;

                      else
                      {
                          inputs[i].direction = kv.value().as<int>();
                          inputs[i].interval = calculate_pause_interval(inputs[i].speed);
                          inputs[i].milli_seconds = (inputs[i].distance / inputs[i].speed) * 1000;
                          i++;
                      }
                  }

                  print_input();
                  submitted = true;
                  request->send(200, "text/plain", "success"); });

    server.begin();
}