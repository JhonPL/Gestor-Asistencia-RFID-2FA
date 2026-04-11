# SmartClass RFID — Sistema de Gestión de Asistencia

> Universidad Cooperativa de Colombia · Sede Villavicencio, Meta  
> Trabajo de grado — Metodología Scrum

Sistema para controlar asistencia con tarjetas RFID y segundo factor biométrico.

---

## Stack tecnológico

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
│   ├── mocks/
│   ├── pages/
│   └── components/{ui,layout,landing,dashboard,attendance,admin}
├── src/api/                    ← Backend Express
│   └── src/{routes,controllers,services,middlewares,config,swagger}
├── mobile/                     ← App Expo
│   └── app/{screens,components,context,hooks,constants}
├── database/
│   ├── script_bd_v5.sql
│   └── DER_dbdiagram_v5.dbml
├── DESIGN.md
├── README.md
└── README-frontend.md
```

---

## Puesta en marcha

```bash
# Frontend web
npm install && npm run dev          # http://localhost:5173

# Backend
cd src/api && npm install && npm run dev   # http://localhost:3000
# Swagger: http://localhost:3000/api-docs

# Base de datos
createdb smartclass_rfid
psql -d smartclass_rfid -f database/script_bd_v5.sql

# App móvil
cd mobile && npx expo start
```

---

## Variables de entorno (.env)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartclass_rfid
DB_USER=postgres
DB_PASSWORD=

# Azure AD (pendiente área de sistemas UCC)
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_REDIRECT_URI=http://localhost:5173/login

# Frontend
VITE_API_URL=http://localhost:3000
VITE_AZURE_CLIENT_ID=
VITE_AZURE_TENANT_ID=

# Expo
EXPO_ACCESS_TOKEN=

# Campus UCC Villavicencio
CAMPUS_LAT=-4.142900
CAMPUS_LNG=-73.626700
CAMPUS_RADIUS_METERS=200

# Servidor
PORT=3000
NODE_ENV=development
JWT_SECRET=
```

---

## Base de datos v5

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