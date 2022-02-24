#include "internet.h"

// const char *ssid = "KEKW 2.4";
// const char *password = "Pepelsin32!";

const char *ssid = "NanoLab";
const char *password = "Mikro2015";

// const char *ssid = "Vladislavs";
// const char *password = "";

bool initialize_wifi()
{
    uint8_t counter = 0;
    delay(1000);
    Serial.print("\n\nConnecting to WiFi");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(1000);
        Serial.print(".");
        counter++;

        if (counter >= 20)
        {
            return 0;
        }
    }
    Serial.println("\nConnected successfully!");
    Serial.print("Local IP address: ");
    Serial.println(WiFi.localIP());
    return 1;
}