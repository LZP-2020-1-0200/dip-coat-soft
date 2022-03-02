#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include "LittleFS.h"
#include <ESPAsyncWebServer.h>
#include <ESPAsyncTCP.h>

typedef struct {
    uint32_t speed;
    int direction;
    uint32_t distance;
    unsigned long interval;
    uint32_t milli_seconds;
} input;

String processor(const String &var);

void initialize_server();

void print_input();

extern input inputs[15];
extern bool submitted;
extern bool paused;
extern bool stopped;
extern bool go_to_top;
#endif // !WEB_SERVER_H

