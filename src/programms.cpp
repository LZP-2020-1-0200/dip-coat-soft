#include "programms.h"

#define ASCI 48

void printData(){
    File file = LittleFS.open("/programms/test.txt","r");

    if (!file){
        Serial.println("Can't open file");
        return;
    }

    int i = 0;
   
    char number[7];
    while(file.available()){

        if (file.read() == 10 || file.read() == 13){
            Serial.println(atoi(number));
            i = 0;
            continue;
        }

        number[i] = file.read() + '0';
        i++;
        // if (file.read() <= 48 || file.read() > 57){
        //     return;
        // }
        
        // if newline
        // if (file.read() == 13){

        //     continue;
        // }

        
        Serial.println(file.read());


        
    }


}
