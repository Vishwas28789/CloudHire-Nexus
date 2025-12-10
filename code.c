#include <Wire.h>
#include <MPU6050.h>
#include <DHT.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define DHTPIN D5        // GPIO14 on ESP8266 (change as needed)
#define DHTTYPE DHT11    // DHT 11


#define WIFI_SSID "spherenex1"
#define WIFI_PASSWORD "Spherenex@789"

#define API_KEY "AIzaSyBGvhE5d797L-I63rQz9nN8HbkLg0keahU"
#define DATABASE_URL "https://spherenex-1c0a4-default-rtdb.firebaseio.com/"
#define USER_EMAIL "spherenexgpt@gmail.com"
#define USER_PASSWORD "Spherenex@123"

// MUX select lines moved to unused GPIOs to avoid conflict with I2C (D1/D2)
#define MUX_S0 D7              // GPIO13
#define MUX_S1 D8              // GPIO15
#define MUX_S2 D3              // GPIO0
#define MUX_S3 D4              // GPIO2
#define MUX_SIG_PIN A0         // Analog output from MUX to ESP8266
#define BUZZER D6

#define MIC_MUX_CH 0           // Mic connected to MUX channel C0
#define ACS712_MUX_CH 1        // ACS712 connected to MUX channel C1

// OLED display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 32
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

MPU6050 mpu;
DHT dht(DHTPIN, DHTTYPE);

const int vibrationThreshold = 22000;
const int micThreshold = 305;

// ACS712 parameters
const float ACS712_SENSITIVITY = 0.185; // For 5A module: 185mV/A
const float ACS712_ZERO = 1.65;         // 1.65V for 0A (centered at 3.3V/2)

FirebaseData fbdo;
FirebaseData movementStream;
FirebaseData modeStream;     // Stream for automatic/manual mode control
FirebaseAuth auth;
FirebaseConfig config;

void selectMuxChannel(uint8_t channel) {
    digitalWrite(MUX_S0, channel & 0x01);
    digitalWrite(MUX_S1, (channel >> 1) & 0x01);
    digitalWrite(MUX_S2, (channel >> 2) & 0x01);
    digitalWrite(MUX_S3, (channel >> 3) & 0x01);
}

void beep()
{
  digitalWrite(BUZZER, HIGH);
  delay(500);
  digitalWrite(BUZZER, LOW);
  delay(500);
}

void setup() {
    Serial.begin(9600);
    Wire.begin(); // I2C on D1 (GPIO5=SCL), D2 (GPIO4=SDA)
    mpu.initialize();
    dht.begin();

    pinMode(BUZZER, OUTPUT);
    pinMode(MUX_S0, OUTPUT);
    pinMode(MUX_S1, OUTPUT);
    pinMode(MUX_S2, OUTPUT);
    pinMode(MUX_S3, OUTPUT);

    // OLED init
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println(F("SSD1306 allocation failed"));
        while (1);
    }
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0,0);
    display.println("Connecting WiFi...");
    display.display();

    if (mpu.testConnection()) {
        Serial.println("MPU6050 connected!");
    } else {
        Serial.println("MPU6050 connection failed!");
        while (1);
    }
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) 
    {
        Serial.print(".");
        delay(300);
    }
    Serial.println();
    Serial.print("IP: "); Serial.println(WiFi.localIP());     

    display.display();
    display.clearDisplay();
    display.setTextSize(1);  
    display.setCursor(0,0);
    display.setTextColor(SSD1306_WHITE);
    display.println("WiFi Connected!");
    display.display();

    // Firebase
    config.api_key               = API_KEY;
    config.database_url          = DATABASE_URL;
    auth.user.email              = USER_EMAIL;
    auth.user.password           = USER_PASSWORD;
    config.token_status_callback = tokenStatusCallback;
    Firebase.reconnectNetwork(true);
    Firebase.begin(&config, &auth);

    display.clearDisplay();
    display.setCursor(0,0);
    display.println("Firebase Ready!");
    display.display();
    delay(1000);
}

void loop() {
    // --- MPU6050 Vibration Detection ---
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);

    long totalVibration = abs(ax) + abs(ay) + abs(az);

    Serial.print("AX: "); Serial.print(ax);
    Serial.print(" AY: "); Serial.print(ay);
    Serial.print(" AZ: "); Serial.print(az);
    Serial.print(" | Total: "); Serial.println(totalVibration);

    String vibrationMsg;
    if (totalVibration > vibrationThreshold) {
        Serial.println("Vibration Detected!");
        Firebase.setString(fbdo, "Sensors/Vibration", "1");
        vibrationMsg = "Vib: ALERT!";
        beep();
    }
    else {
        Firebase.setString(fbdo, "Sensors/Vibration", "0");
        vibrationMsg = "Vib: Safe";
    }

    // --- DHT11 Temperature and Humidity ---
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    String humMsg, tempMsg;
    if (isnan(h) || isnan(t)) {
        Serial.println("Failed to read from DHT11 sensor!");
        humMsg = "Hum: --";
        tempMsg = "Temp: --";
    } else {
        Serial.print("Humidity: ");
        Serial.print(h);
        Firebase.setString(fbdo, "Sensors/Humidity", h);
        Serial.print(" %\t");
        Serial.print("Temperature: ");
        Serial.print(t);
        Firebase.setString(fbdo, "Sensors/Temperature", t);
        Serial.println(" *C");
        humMsg = "Hum: " + String(h, 1) + "%";
        tempMsg = "Temp: " + String(t, 1) + "C";
    }

    // --- Sound Detection (HW484 Analog) via MUX ---
    selectMuxChannel(MIC_MUX_CH);
    delay(2); // Small delay for channel settling
    int micValue = analogRead(MUX_SIG_PIN);
    Serial.print("Mic Analog Value: ");
    Serial.println(micValue);

    String noiseMsg;
    if (micValue > micThreshold) {
        Serial.println("Loud sound detected! (Analog)");
        Firebase.setString(fbdo, "Sensors/Noise", "1");
        noiseMsg = "Noise: ALERT!";
        beep();
    }
    else {
        Firebase.setString(fbdo, "Sensors/Noise", "0");
        noiseMsg = "Noise: Safe";
    }

    // --- ACS712 Current Sensor via MUX ---
    selectMuxChannel(ACS712_MUX_CH);
    delay(2); // Small delay for channel settling
    int acsValue = analogRead(MUX_SIG_PIN);
    float voltage = (acsValue / 1023.0) * 3.3; // ESP8266 ADC reference is 3.3V
    float current = (voltage - ACS712_ZERO) / ACS712_SENSITIVITY;

    Serial.print("ACS712 Raw Value: ");
    Serial.print(acsValue);
    Serial.print(" | Voltage: ");
    Serial.print(voltage, 3);
    Serial.print(" V | Current: ");
    Serial.print(current, 3);
    Serial.println(" A");
    Firebase.setString(fbdo, "Sensors/Current", current);

    // --- OLED Display ---
    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0,0);
    display.println(tempMsg);
    display.println(humMsg);
    display.println(vibrationMsg);
    display.println(noiseMsg);
    display.display();

    delay(2000);
}