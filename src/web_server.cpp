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
        inputs[i].hidden = 1;
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
                  clear_inputs();
                  stopped = true;
                  request->send(200, "text/plain", "Stopped"); });

    server.on("/check_if_paused", HTTP_POST, [](AsyncWebServerRequest *request)
              { request->send(200, "text/plain", paused ? "true" : "false"); });

    server.on("/check_if_reached_top", HTTP_POST, [](AsyncWebServerRequest *request)
              { request->send(200, "text/plain", reached_top ? "true" : "false"); });

    server.on("/check_if_reached_bottom", HTTP_POST, [](AsyncWebServerRequest *request)
              { request->send(200, "text/plain", reached_bottom ? "true" : "false"); });

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
                  } });

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
                      // Inverted!
                      inputs[i].direction = values["direction"].as<int>() * -1;
                      inputs[i].interval = calculate_pause_interval(inputs[i].speed);
                      inputs[i].milli_seconds = calculate_time_needed(inputs[i].distance, inputs[i].speed);
                      i++;
                  }

                  print_input();
                  submitted = true;
                  request->send(200, "text/plain", "Submited sucessfuly"); });

    server.on("/send_saved_programms", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  Dir dir = LittleFS.openDir("/data/programms/");
                  StaticJsonDocument<1024> programm_json;
                  int i = 0;
                  while (dir.next())
                  {
                      if (dir.fileSize())
                      {
                          programm_json["names"][i] = dir.fileName();
                          i++;
                      }
                  }
                  AsyncResponseStream *response = request->beginResponseStream("application/json");
                  serializeJson(programm_json, *response);
                  request->send(response); });

    server.on("/delete_programm", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  AsyncWebParameter *p = request->getParam(0);
                  String filename_to_delete = "/data/programms/" + p->value();

                  if (LittleFS.exists(filename_to_delete))
                  {
                      LittleFS.remove(filename_to_delete);
                      request->send(200, "text/plain", "Removed successfully");
                  }

                  else
                  {
                      request->send(400, "text/plain", "Removed successfully");
                  } });

    server.on("/save_programm", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  DynamicJsonDocument recieving_doc(2048);
                  AsyncWebParameter *p = request->getParam(0);
                  DeserializationError err = deserializeJson(recieving_doc, p->value());

                  if (err)
                  {
                      Serial.print(F("deserializeJson() returned "));
                      Serial.println(err.f_str());
                      request->send(500, "text/plain", "Could not Deserialize JSON");
                      
                  }

                    String filename = "/data/programms/" + recieving_doc["name"].as<String>();
                    Serial.println(filename);


                  File file = LittleFS.open(filename, "w");
                  uint8_t i = 0;
                  for (auto row : recieving_doc.as<JsonObject>())
                  {
                      if (i == 0){
                          i++;
                          continue;
                      }
                      JsonObject values = row.value().as<JsonObject>();
                      file.println(values["hidden"].as<int>());
                      file.println(values["speed"].as<int>());
                      file.println(values["distance"].as<int>());
                      file.println(values["direction"].as<int>());
                  }

                  file.close();
                  request->send(200, "text/plain", "Saved successfully"); });

    server.on("/send_saved", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  AsyncWebParameter *p = request->getParam(0);
                  Serial.println(p->value());
                  String filename = "/data/programms/" + p->value();

                  File f = LittleFS.open(filename, "r");
                  DynamicJsonDocument sending_doc(2048);
                  Serial.println("inside /send_saved");

                  int i = 0;
                  int row_number = 0;
                  String current_row_nr = "";
                  while (f.available())
                  {
                      String line = f.readStringUntil('\n');

                      switch (i)
                      {

                      case 0:
                          Serial.println("case0");
                          current_row_nr = "row" + String(row_number++);
                          Serial.println(current_row_nr);
                          sending_doc[current_row_nr]["hidden"] = line.toInt();
                          break;

                      case 1:
                          sending_doc[current_row_nr]["speed"] = line.toInt();
                          Serial.println("case1");

                          break;

                      case 2:
                          Serial.println("case2");
                          sending_doc[current_row_nr]["distance"] = line.toInt();

                          break;

                      case 3:
                          Serial.println("case3");
                          sending_doc[current_row_nr]["direction"] = line.toInt();
                          i = -1;
                          break;
                      };
                      i++;
                  };

                  f.close();

                  AsyncResponseStream *response = request->beginResponseStream("application/json");
                  serializeJson(sending_doc, *response);
                  request->send(response); });

    server.begin();
}