#include "web_server.h"
#include "stepper.h"
#include "AsyncJson.h"
#include "ArduinoJson.h"

AsyncWebServer server(80);
input inputs[20];
StaticJsonDocument<2048> doc;
bool submitted;
bool go_to_top;
bool paused = false;
bool stopped = false;

void print_input()
{
    for (input x : inputs)
    {
        Serial.printf("Hidden: %s\tSpeed: %d\tDistance: %d\tInterval: %lu\tDirection: %s\tTotal Time: %u\n",
                      x.hidden ? "Yes" : "No", x.speed, x.distance, x.interval, x.direction == 1 ? "Up" : "Down", x.milli_seconds);
    }
}

void clear_inputs()
{
    for (unsigned int i = 0; i < sizeof(inputs) / sizeof(inputs[0]); i++)
    {
        inputs[i].speed = 0;
        inputs[i].direction = 0;
        inputs[i].distance = 0;
        inputs[i].interval = 0;
        inputs[i].milli_seconds = 0;
    }
}

void initialize_server()
{
    server.serveStatic("/images", LittleFS, "/images");
    server.serveStatic("/css", LittleFS, "/css");
    server.serveStatic("/js", LittleFS, "/js");

    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request)
              { request->send(LittleFS, "/index.html", String(), false); });

    server.on("/go_to_top", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  go_to_top = true;
                  request->send(200, "text/plain", "Going top"); });

    server.on("/pause", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  paused = !paused;
                  request->send(200, "text/plain", "Paused"); });

    server.on("/stop", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  stopped = true;
                  request->send(200, "text/plain", "Stopped"); });

    server.on("/get_passed_time", HTTP_POST, [](AsyncWebServerRequest *request)
              { request->send(200, "text/plain", String(total_passed_time)); });

    server.on("/recieve_inputs", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  if (inputs[0].speed)
                  {
                      AsyncResponseStream *response = request->beginResponseStream("application/json");
                      serializeJson(doc, *response);
                      request->send(response);
                  }

                  else
                  {
                      request->send(200, "application/json", "{}");
                  }
              });

    server.on("/submit", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  
                  submitted = false;
                  AsyncWebParameter *p = request->getParam(0);
                  DeserializationError err = deserializeJson(doc, p->value());
                    
                  if (err)
                  {
                      Serial.print(F("deserializeJson() returned "));
                      Serial.println(err.f_str());
                      return;
                  }

                  clear_inputs();
                  int i = 0;

                  for (auto row : doc.as<JsonObject>())
                  {
                      JsonObject values = row.value().as<JsonObject>();
                      inputs[i].hidden = values["hidden"];
                      inputs[i].speed = values["speed"];
                      inputs[i].distance = values["distance"].as<uint32_t>() * 1000;
                      inputs[i].direction = values["direction"];
                      inputs[i].interval = calculate_pause_interval(inputs[i].speed);
                      inputs[i].milli_seconds = calculate_time_needed(inputs[i].distance, inputs[i].speed);
                      i++;
                  }

                  print_input();
                  submitted = true;
                  request->send(200, "text/plain", "success"); });

    server.begin();
}