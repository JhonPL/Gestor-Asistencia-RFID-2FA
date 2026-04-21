# SmartClass RFID — Backend API

> Node.js + Express 5 + PostgreSQL (`pg`) — SmartClass RFID

---

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

npm install swagger-ui-express

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con los datos reales

# 3. Crear la base de datos (desde la raíz del repo)
createdb smartclass_rfid
psql -d smartclass_rfid -f ../database/script_bd_v5.sql

# 4. Arrancar en desarrollo
npm run dev
# → http://localhost:3000
```

---

## Estructura de carpetas

```
src/
├── config/
│   ├── db.js         ← Pool de conexiones PostgreSQL (pg)
│   └── env.js        ← Valida y exporta variables de entorno
│
├── middlewares/
│   ├── auth.js       ← verifyAzureToken + verifyJwt + signJwt
│   ├── roles.js      ← requireRole('docente', 'administrador', ...)
│   └── errorHandler.js ← Manejo global de errores + createError()
│
├── routes/
│   ├── index.js      ← Monta todos los routers bajo /api
│   ├── auth.routes.js
│   ├── personas.routes.js
│   ├── cursos.routes.js
│   ├── asistencia.routes.js
│   └── rfid.routes.js   ← ⭐ Endpoint principal del ESP32
│
├── controllers/
│   ├── auth.controller.js
│   └── personas.controller.js
│
├── services/
│   ├── auth.service.js     ← login OAuth + login simulado
│   └── personas.service.js ← CRUD personas
│
├── app.js    ← Configuración Express (cors, morgan, rutas)
└── index.js  ← Arranca el servidor HTTP
```

---

## Endpoints implementados

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | Azure token | Valida token de Microsoft → devuelve JWT propio |
| `POST` | `/api/auth/login-dev` | Ninguna | Solo en `development` — login por correo |
| `GET`  | `/api/auth/me` | JWT | Datos del usuario autenticado |

### Personas (solo administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`    | `/api/personas` | Listado con filtros: `?rol=docente&activo=true&search=Carlos` |
| `GET`    | `/api/personas/:id` | Detalle de una persona |
| `POST`   | `/api/personas` | Crear persona |
| `PATCH`  | `/api/personas/:id` | Actualizar campos |
| `PATCH`  | `/api/personas/:id/tarjeta` | Vincular / desvincular tarjeta RFID |

### Cursos (docente + administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/cursos` | Cursos del docente autenticado (o todos si es admin) |
| `GET` | `/api/cursos/:id` | Detalle con aulas y horarios |

### Asistencia (docente + administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`   | `/api/asistencia/sesion/:sesionId` | Lista de asistencia de una sesión |
| `PATCH` | `/api/asistencia/:id` | Cambiar estado manualmente (justificar, etc.) |

### RFID — Endpoints del ESP32 y la app móvil

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/rfid/scan` | Procesa lectura de tarjeta → abre/cierra sesión o registra asistencia |
| `POST` | `/api/rfid/verificar` | App móvil envía resultado biométrico + GPS |

---

## Flujo de autenticación

```
Frontend                   Backend                    Microsoft
   │                          │                            │
   │── Click "Iniciar con ───►│                            │
   │   Microsoft"             │                            │
   │                          │◄── Redirige a OAuth ──────►│
   │◄── Azure token ──────────┤◄── token ─────────────────┤
   │                          │                            │
   │── POST /api/auth/login ──►│                            │
   │   Authorization: Bearer  │                            │
   │   <azure_token>          │                            │
   │                          │── verifyAzureToken ───────►│(JWKS)
   │                          │   valida firma RS256        │
   │                          │── busca correo en persona   │
   │                          │── guarda microsoft_id       │
   │◄── { token, user } ──────│                            │
   │    (JWT propio 8h)        │                            │
```

### Modo desarrollo (sin Azure AD)

```bash
# Crear persona en la BD primero, luego:
curl -X POST http://localhost:3000/api/auth/login-dev \
  -H "Content-Type: application/json" \
  -d '{"correo": "carlos.ramirez@campusucc.edu.co"}'
```

---

## Flujo RFID — Lectura de tarjeta

```
ESP32 (POST /api/rfid/scan)
  { codigo_dispositivo: "ESP32-01", codigo_tarjeta: "RFID-A1B2" }
              │
              ▼
  1. ¿codigo_tarjeta existe en persona?
  2. ¿Dispositivo tiene aula asignada y está Activo?
              │
        ┌─────┴─────┐
        │           │
     DOCENTE    ESTUDIANTE
        │           │
        ▼           ▼
   ¿Sesión     ¿Sesión activa
    activa?     en el aula?
        │           │
       SÍ    ┌──────┘
        │    │  ¿Inscrito en lista_estudiantes?
      CIERRA │
     sesión  ▼
        │  Crea asistencia { estado: pendiente }
       NO    │
        │    ▼
      ABRE ¿Tiene dispositivo_movil?
     sesión  │
          SÍ─┘  NO → estado: sin_app
          │
          ▼
     Envía push notification
     (TODO: implementar)
```

---

## Cómo agregar nuevos endpoints (guía para el equipo)

### 1. Crear el servicio (lógica de negocio)

```js
// src/services/aulas.service.js
import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

export async function getAulas() {
  const { rows } = await pool.query('SELECT * FROM aula ORDER BY numero');
  return rows;
}

export async function createAula({ numero, nombre, edificio, piso, capacidad }) {
  const { rows } = await pool.query(
    'INSERT INTO aula (numero, nombre, edificio, piso, capacidad) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [numero, nombre, edificio, piso, capacidad],
  );
  return rows[0];
}
```

### 2. Crear el controlador (recibe request → llama servicio → responde)

```js
// src/controllers/aulas.controller.js
import * as aulasService from '../services/aulas.service.js';

export async function getAll(req, res, next) {
  try {
    res.json(await aulasService.getAulas());
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const data = await aulasService.createAula(req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}
```

### 3. Crear las rutas

```js
// src/routes/aulas.routes.js
import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import * as ctrl from '../controllers/aulas.controller.js';

const router = Router();
router.use(verifyJwt, requireRole('administrador'));
router.get('/',  ctrl.getAll);
router.post('/', ctrl.create);
export default router;
```

### 4. Registrar en `src/routes/index.js`

```js
import aulasRoutes from './aulas.routes.js';
router.use('/aulas', aulasRoutes);
```

---

## Endpoints pendientes (para el equipo)

| Módulo | Prioridad | Descripción |
|--------|-----------|-------------|
| `aulas.routes.js` | Alta | CRUD de aulas |
| `horarios.routes.js` | Alta | CRUD de horarios |
| `sesiones.routes.js` | Alta | Historial de sesiones por curso |
| `cursos.routes.js` | Media | POST / PATCH / DELETE cursos |
| `dispositivos.routes.js` | Media | CRUD dispositivos RFID |
| `facultades.routes.js` | Media | CRUD facultades y programas |
| Push notifications | Alta | Integrar Expo Push API en `/api/rfid/scan` |
| Exportar asistencia | Baja | CSV/PDF desde `/api/asistencia/sesion/:id/export` |

---

## Variables de entorno

Ver `.env.example`. Las críticas son:

- `DB_*` — conexión a PostgreSQL
- `JWT_SECRET` — secreto para firmar los tokens propios (¡no compartir!)
- `AZURE_CLIENT_ID` + `AZURE_TENANT_ID` — pendiente del área de sistemas UCC
