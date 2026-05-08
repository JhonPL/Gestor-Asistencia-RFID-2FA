# SmartClass RFID — Backend API

> API REST con **Node.js + Express 5 + PostgreSQL** para el sistema de asistencia con RFID 2FA.

---

## 📋 Requisitos Previos

Antes de instalar, asegúrate de tener:

- **Node.js**: versión 16 o superior ([Descargar](https://nodejs.org/))
- **npm**: versión 8 o superior (se instala con Node.js)
- **PostgreSQL**: versión 12 o superior ([Descargar](https://www.postgresql.org/download/))
- **Git**: para clonar el repositorio

Verifica las versiones instaladas:
```bash
node --version
npm --version
psql --version
```

---

## 🚀 Instalación Paso a Paso

### 1️⃣ Instalar las dependencias

```bash
# Desde la carpeta /backend
cd backend

# Instalar todas las dependencias del proyecto
npm install
```

Esto instala automáticamente:
- **express** - Framework web
- **pg** - Cliente PostgreSQL
- **dotenv** - Variables de entorno
- **jsonwebtoken** - Autenticación JWT
- **cors** - Control de acceso entre dominios
- **morgan** - Logger HTTP
- **swagger-jsdoc** y **swagger-ui-express** - Documentación API
- Y más (ver `package.json`)

### 2️⃣ Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Abrir .env y completar con tus datos:
# - Credenciales de PostgreSQL
# - Puerto de ejecución (default: 3000)
# - Variables de Azure AD (si aplica)
# - JWT_SECRET para firmar tokens
```

Ejemplo de archivo `.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/smartclass_rfid
JWT_SECRET=tu_clave_secreta_aqui
AZURE_CLIENT_ID=tu_client_id
AZURE_TENANT_ID=tu_tenant_id
```

### 3️⃣ Crear la base de datos

```bash
# Crear la base de datos PostgreSQL
createdb smartclass_rfid

# Ejecutar el script de inicialización con Google OAuth
psql -d smartclass_rfid -f ./src/database/script_bd_google_oauth.sql
```

**Nota**: Este script es para Google OAuth 2.0. Para migrar de una versión anterior, consulta la documentación en `GOOGLE_OAUTH_SETUP.md`.

### 4️⃣ Iniciar el servidor

```bash
# Modo desarrollo (con auto-recarga)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en:
- **API**: http://localhost:3000
- **Documentación Swagger**: http://localhost:3000/api-docs

---

## 📁 Estructura de Carpetas

```
backend/
├── src/
│   ├── config/              ← Configuración
│   │   ├── db.js            ← Pool PostgreSQL
│   │   ├── env.js           ← Variables de entorno
│   │   └── swagger.js       ← Documentación API
│   │
│   ├── controllers/         ← Lógica de rutas
│   │   ├── auth.controller.js
│   │   └── personas.controller.js
│   │
│   ├── services/            ← Lógica de negocio
│   │   ├── auth.service.js
│   │   ├── personas.service.js
│   │   ├── cursos.service.js
│   │   └── ...
│   │
│   ├── routes/              ← Definición de endpoints
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── personas.routes.js
│   │   ├── cursos.routes.js
│   │   ├── asistencia.routes.js
│   │   └── rfid.routes.js
│   │
│   ├── middlewares/         ← Middleware
│   │   ├── auth.js          ← Autenticación JWT
│   │   ├── roles.js         ← Control de roles
│   │   └── errorHandler.js  ← Manejo de errores
│   │
│   ├── app.js               ← Configuración Express
│   └── index.js             ← Punto de entrada
│
├── database/                ← Scripts SQL
│   ├── script_bd_v5.sql
│   └── script_bd_v6.sql
│
├── .env.example             ← Plantilla de variables
├── package.json
└── README.md
```

---

## 🔌 Endpoints Principales

### 🔐 Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login con token de Azure |
| `GET`  | `/api/auth/me` | Obtener datos del usuario autenticado |

### 👥 Personas (Administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`    | `/api/personas` | Listar personas con filtros |
| `GET`    | `/api/personas/:id` | Obtener persona por ID |
| `POST`   | `/api/personas` | Crear nueva persona |
| `PATCH`  | `/api/personas/:id` | Actualizar persona |
| `PATCH`  | `/api/personas/:id/tarjeta` | Vincular/desvincular tarjeta RFID |

### 📚 Cursos (Docente + Administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/cursos` | Listar cursos |
| `GET` | `/api/cursos/:id` | Detalle de curso con aulas y horarios |

### 📋 Asistencia (Docente + Administrador)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`   | `/api/asistencia/sesion/:sesionId` | Listar asistencia de una sesión |
| `PATCH` | `/api/asistencia/:id` | Actualizar estado de asistencia |

### 📡 RFID (ESP32 + App Móvil)

Endpoints para registrar asistencia y sincronizar datos con dispositivos RFID.

---

## 🛠️ Comandos Disponibles

```bash
npm run dev      # Iniciar en desarrollo con nodemon
npm start        # Iniciar en producción
npm test         # Ejecutar pruebas (si disponible)
```

---

## 🔍 Solución de Problemas

**Error: "Cannot find module 'pg'"**
```bash
npm install pg --save
```

**Error: "ECONNREFUSED - Connection refused"**
- Verifica que PostgreSQL esté corriendo
- Comprueba las credenciales en `.env`

**Error: "Port 3000 already in use"**
```bash
# Cambia el puerto en .env
PORT=3001
```

**Error: "Database does not exist"**
```bash
# Crea la BD nuevamente
createdb smartclass_rfid
psql -d smartclass_rfid -f ./database/script_bd_v5.sql
```

---

## 📞 Soporte

Si encuentras problemas, verifica:
1. Que Node.js y PostgreSQL estén instalados
2. Que el archivo `.env` esté correctamente configurado
3. Los logs en la consola para más detalles
4. La documentación en `/api-docs`

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
