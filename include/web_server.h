#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include "LittleFS.h"
#include <ESPAsyncWebServer.h>
#include <ESPAsyncTCP.h>

typedef struct {
    uint8_t hidden;
    uint32_t speed;
    uint32_t distance;
    int direction;
    unsigned long interval;
    uint32_t milli_seconds;
} input;

String processor(const String &var);

void initialize_server();

void print_input();

void clear_inputs();

extern input inputs[20];
extern bool submitted;
extern bool paused;
extern bool stopped;
extern bool go_to_top;
extern uint32_t total_passed_time;
#endif // !WEB_SERVER_H

