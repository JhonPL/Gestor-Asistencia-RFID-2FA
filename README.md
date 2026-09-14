# SmartClass RFID - Sistema de Gestion de Asistencia

> Universidad Cooperativa de Colombia · Sede Villavicencio, Meta  
> Trabajo de grado — Metodología Scrum

Sistema para controlar asistencia con tarjetas RFID y segundo factor biométrico.

---

## Estructura

El repositorio contiene tres aplicaciones coordinadas:

| Carpeta | Funcion |
|---|---|
| `backend/` | API Node.js, Express y PostgreSQL |
| `frontend/` | Panel web administrativo con React y Vite |
| `mobile/` | App React Native con Expo para Android e iOS |

## Requisitos

- Node.js 20 LTS o superior
- PostgreSQL 15 o superior
- Para Android: Android Studio y un dispositivo/emulador
- Para iOS: macOS, Xcode y Apple ID; Apple Developer es necesario para distribuir o usar TestFlight

## Clonar y preparar

```bash
git clone https://github.com/JhonPL/Gestor-Asistencia-RFID-2FA.git
cd Gestor-Asistencia-RFID-2FA

cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

Después copia las plantillas de entorno y completa los valores locales:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp mobile/.env.example mobile/.env
```

En Windows PowerShell, usa `Copy-Item` en lugar de `cp`.

## Ejecutar en desarrollo

Abre tres terminales desde la raiz del repositorio:

```bash
cd backend && npm run dev
cd frontend && npm run dev
cd mobile && npx expo start
```

La API queda en `http://localhost:3000`, el panel en `http://localhost:5173` y Expo muestra el QR para abrir la app.

## Probar iOS desde una Mac

Para la app completa, incluyendo modulos nativos como Google Sign-In:

```bash
cd mobile
npx expo prebuild
npx expo run:ios --device
```

Conecta el iPhone por cable, abre el proyecto en Xcode si solicita configurar la firma y selecciona tu equipo Apple en `Signing & Capabilities`. `npx expo prebuild` puede regenerar las carpetas nativas; no edites `ios/` ni `android/` manualmente si permanecen ignoradas.

## Builds EAS

```bash
cd mobile
npx eas build --platform android --profile preview
npx eas build --platform ios --profile development
npx eas build --platform ios --profile production
```

La build iOS de desarrollo está configurada para simulador en `eas.json`. Para un iPhone físico hay que usar una build de dispositivo y credenciales de Apple.

## Variables de entorno y secretos

No subas `.env`, `google-services.json`, `GoogleService-Info.plist` ni el JSON de credenciales administrativas de Firebase. Usa las plantillas `.env.example` y configura los secretos en EAS o en el entorno local.

## Stack tecnologico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend web | React + Vite + styled-components + react-router-dom | 19 / 6 / ^6 / v7 |
| App móvil | React Native + Expo | SDK 51+ |
| Backend / API | Node.js + Express + Swagger | 5 |
| Base de datos | PostgreSQL | ≥ 15 |
| Autenticación | Microsoft OAuth / Azure AD | — |
| Push | Expo Push Notifications | — |
| Biometría | expo-local-authentication | — |
| GPS | expo-location + Haversine | — |
| Hardware | ESP32 + módulo RFID | — |

---

## Estructura del repositorio

```
smartclass-rfid/
├── src/                        ← Frontend web React
│   ├── context/AuthContext.jsx
│   ├── styles/

### Cambios vs v4

| Campo | Cambio |
|---|---|
| `verificacion_biometrica.metodo` | `varchar` → FK `metodo_verificacion_id` |
| `asistencia.estado` | `varchar` → FK `estado_asistencia_id` |
| `asistencia.estado_verificacion` | `varchar` → FK `estado_verificacion_id` |
| `dispositivo_rfid.estado` | `varchar` → FK `estado_dispositivo_id` |
| `lista_estudiantes.estado_inscripcion` | `varchar` → `activo boolean` |
| `dispositivo_movil.modelo` | Eliminado |
| Nuevas tablas catálogo | `metodo_verificacion`, `estado_asistencia`, `estado_verificacion`, `estado_dispositivo` |

### Métodos de verificación (v5)
`fingerprint` · `face_id` · `ubicacion` ← se eliminaron `pin` y `pattern`

---

## Flujo del sistema

```
Docente pasa tarjeta → API crea sesion_clase { activa }
Estudiante pasa tarjeta → crea asistencia { pendiente }
                       → push notification a app móvil
App recibe push → biometría + GPS → estado: completado / fallido
Sin app registrada → estado: sin_app → docente valida manual
Docente pasa tarjeta → sesion_clase { cerrada }
Cron → marca Ausente a registros sin asistencia
```

---