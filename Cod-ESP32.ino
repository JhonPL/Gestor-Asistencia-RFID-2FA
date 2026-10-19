#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── Configuración — solo cambiar estas líneas ─────────────────────
const char* ssid               = "WIFI_UCC_ACADEMICA";//"LILA_2.4"; 
const char* password           = "Academicos.2026*";//"Ldj0114est"; 
const char* CODIGO_DISPOSITIVO = "ESP32-04";  // debe coincidir con la BD
const char* SERVER_URL         = "http://172.13.0.242:3000/api/rfid/scan";
const char* SERVER_URL_ADMIN   = "http://172.13.0.242:3000/api/rfid/scan-admin";

// ── Pines ─────────────────────────────────────────────────────────
#define SS_PIN  5
#define RST_PIN 22
// #define LED_ROJO 4
// #define LED_VERDE 2  // descomentar cuando esté disponible

// ── Modo de operación ─────────────────────────────────────────────
bool modoLectura = false;

MFRC522 mfrc522(SS_PIN, RST_PIN);

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

// void parpadearRojo(int veces, int ms) {
//   for (int i = 0; i < veces; i++) {
//     digitalWrite(LED_ROJO, HIGH);
//     delay(ms);
//     digitalWrite(LED_ROJO, LOW);
//     delay(ms);
//   }
// }

// void parpadearVerde(int veces, int ms) {
//   for (int i = 0; i < veces; i++) {
//     digitalWrite(LED_VERDE, HIGH);
//     delay(ms);
//     digitalWrite(LED_VERDE, LOW);
//     delay(ms);
//   }
// }

void reconectarWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("[WiFi] Conexión perdida. Reconectando...");
  WiFi.begin(ssid, password);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Reconectado — IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] No se pudo reconectar.");
  }
}

void imprimirEstado() {
  Serial.println("─────────────────────────────────────");
  Serial.println("Dispositivo : " + String(CODIGO_DISPOSITIVO));
  Serial.println("Modo actual : " + String(modoLectura ? "LECTURA (envía UID al panel admin)" : "ENVIO (modo aula normal)"));
  Serial.println("Comandos    : LECTURA | ENVIO | ESTADO");
  Serial.println("─────────────────────────────────────");
}

// ─────────────────────────────────────────────────────────────────
// Leer comandos del Serial Monitor
// ─────────────────────────────────────────────────────────────────

void leerComandoSerial() {
  if (!Serial.available()) return;

  String comando = Serial.readStringUntil('\n');
  comando.trim();
  comando.toUpperCase();

  if (comando == "LECTURA") {
    modoLectura = true;
    Serial.println("\n✔ Modo cambiado a: LECTURA");
    Serial.println("  Acerca una tarjeta — el UID se enviará al panel admin.");
    //oparpadearRojo(1, 500);
  }
  else if (comando == "ENVIO") {
    modoLectura = false;
    Serial.println("\n✔ Modo cambiado a: ENVIO");
    Serial.println("  El dispositivo operará con normalidad.");
    //parpadearRojo(3, 100);
  }
  else if (comando == "ESTADO") {
    imprimirEstado();
  }
  else {
    Serial.println("Comando no reconocido: \"" + comando + "\"");
    Serial.println("Comandos válidos: LECTURA | ENVIO | ESTADO");
  }
}

// ─────────────────────────────────────────────────────────────────
// Modo LECTURA — envía el UID al panel admin
// ─────────────────────────────────────────────────────────────────

void manejarModoLectura(String uid) {
  Serial.println("┌─ MODO LECTURA ─────────────────────");
  Serial.println("│ UID leído: " + uid);
  Serial.println("│ Enviando al panel de administración...");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("│ Sin WiFi — copia el UID manualmente.");
    Serial.println("└────────────────────────────────────");
    //parpadearRojo(5, 100);
    return;
  }

  String jsonData = "{\"codigo_dispositivo\":\"" + String(CODIGO_DISPOSITIVO) + "\","
                  + "\"codigo_tarjeta\":\"" + uid + "\"}";

  // HTTPClient http;
  // http.begin(SERVER_URL_ADMIN);
  WiFiClient client;
  HTTPClient http;
  http.begin(client, SERVER_URL_ADMIN);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  int httpCode = http.POST(jsonData);

  if (httpCode > 0) {
    Serial.println("│ ✔ UID enviado al panel correctamente.");
    //parpadearRojo(1, 600);
  } else {
    Serial.println("│ ✘ Error al enviar. Copia el UID manualmente:");
    Serial.println("│   " + uid);
    //parpadearRojo(4, 150);
  }

  http.end();
  Serial.println("└────────────────────────────────────");
}

// ─────────────────────────────────────────────────────────────────
// Modo ENVIO — flujo normal de aula
// ─────────────────────────────────────────────────────────────────

void manejarModoEnvio(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Error] Sin WiFi — no se puede enviar.");
    //parpadearRojo(5, 100);
    return;
  }

  String jsonData = "{\"codigo_dispositivo\":\"" + String(CODIGO_DISPOSITIVO) + "\","
                  + "\"codigo_tarjeta\":\"" + uid + "\"}";

  Serial.println("[HTTP] Enviando → " + jsonData);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  int httpCode = http.POST(jsonData);

  if (httpCode > 0) {
    String respuesta = http.getString();
    Serial.println("[HTTP] Código: " + String(httpCode));
    Serial.println("[HTTP] Respuesta: " + respuesta);

    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, respuesta);

    if (!err) {
      String accion  = doc["accion"]  | "desconocido";
      String persona = doc["persona"] | "";
      String motivo  = doc["motivo"]  | "";

      Serial.println("[Acción] " + accion + (persona != "" ? " — " + persona : ""));
      if (motivo != "") Serial.println("[Motivo] " + motivo);

      if (accion == "rechazado") {
        //parpadearRojo(4, 150);
      } else {
        // parpadearVerde(2, 300); // usar cuando haya LED verde
        //parpadearRojo(1, 800); // un parpadeo largo = éxito (provisional)
      }
    } else {
      Serial.println("[Error] No se pudo parsear la respuesta JSON.");
      //parpadearRojo(2, 200);
    }

  } else {
    Serial.println("[Error] HTTP falló con código: " + String(httpCode));
    //parpadearRojo(5, 100);
  }

  http.end();
}

// ─────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(500);

  SPI.begin(18, 19, 23, 5);
  mfrc522.PCD_Init();

  // pinMode(LED_ROJO, OUTPUT);
  // pinMode(LED_VERDE, OUTPUT);
  // digitalWrite(LED_ROJO, LOW);

  WiFi.begin(ssid, password);
  Serial.print("\n[WiFi] Conectando");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Conectado — IP: " + WiFi.localIP().toString());

  //parpadearRojo(2, 200);
  imprimirEstado();
  Serial.println("\nListo. Esperando tarjeta...\n");
}

// ─────────────────────────────────────────────────────────────────
// Loop
// ─────────────────────────────────────────────────────────────────

void loop() {
  leerComandoSerial();

  if (!modoLectura) {
    reconectarWifi();
  }

  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    delay(100);
    return;
  }

  // Leer UID → formato "A3 2F 1B 09"
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (i > 0) uid += " ";
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  if (modoLectura) {
    manejarModoLectura(uid);
  } else {
    manejarModoEnvio(uid);
  }

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(2000);
}