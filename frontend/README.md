# SmartClass RFID — Frontend Web

> Interfaz web moderna construida con **React 19 + Vite** para docentes y administradores del sistema de asistencia con RFID 2FA.

---

## 📋 Requisitos Previos

Antes de instalar, asegúrate de tener:

- **Node.js**: versión 16 o superior ([Descargar](https://nodejs.org/))
- **npm**: versión 8 o superior (se instala con Node.js)
- **Git**: para clonar el repositorio (opcional)

Verifica las versiones:
```bash
node --version
npm --version
```

---

## 🚀 Instalación Paso a Paso

### 1️⃣ Instalar las dependencias

```bash
# Desde la carpeta /frontend
cd frontend

# Instalar todas las dependencias del proyecto
npm install
```

Esto instala automáticamente:
- **react** - Librería de UI
- **react-dom** - Integración de React con el DOM
- **react-router-dom** - Enrutamiento entre páginas
- **styled-components** - Estilos CSS en JavaScript
- **vite** - Bundler ultra rápido
- **eslint** - Linter de código
- Y más (ver `package.json`)

### 2️⃣ Configurar variables de entorno

```bash
# Crear archivo .env en la raíz de /frontend
# (Puede copiarse de .env.example si existe)
touch .env

# Editar .env con lo siguiente:
```

```env
VITE_API_URL=http://localhost:3000
VITE_AZURE_CLIENT_ID=tu_client_id_aqui
VITE_AZURE_TENANT_ID=tu_tenant_id_aqui
VITE_AZURE_REDIRECT_URI=http://localhost:5173/login
```

**Nota**: Los IDs de Azure deben solicitarse al área de sistemas de la institución.

### 3️⃣ Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173

La consola mostrará un mensaje como:
```
  VITE v6.0.4 ready in 245 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🔧 Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | 19 | Framework de interfaz de usuario |
| **Vite** | 8 | Bundler y servidor de desarrollo |
| **React Router** | 7 | Enrutamiento y navegación SPA |
| **styled-components** | 6 | Estilos CSS en JavaScript |
| **ESLint** | 9 | Linter para validar código |

---

## 📁 Estructura de Carpetas

```
frontend/
├── src/
│   ├── api/                    ← Llamadas a la API backend
│   │   ├── authApi.js
│   │   ├── cursosApi.js
│   │   ├── personasApi.js
│   │   ├── asistenciaApi.js
│   │   └── ...
│   │
│   ├── context/                ← Estado global
│   │   └── AuthContext.jsx     ← Gestión de sesión y usuario
│   │
│   ├── styles/                 ← Tema y estilos globales
│   │   ├── theme.js            ← Colores, tipografía, espaciado
│   │   └── GlobalStyles.jsx    ← Estilos base y fuentes
│   │
│   ├── hooks/                  ← Hooks personalizados
│   │   ├── useCursos.js
│   │   ├── useAttendance.js
│   │   ├── useDashboard.js
│   │   └── ...
│   │
│   ├── mocks/                  ← Datos simulados para desarrollo
│   │   ├── dashboard.mock.js
│   │   ├── Attendance.mock.js
│   │   └── Admin.mock.js
│   │
│   ├── pages/                  ← Páginas principales
│   │   ├── LandingPage.jsx     ← Página de inicio (/)
│   │   ├── LoginPage.jsx       ← Login (/login)
│   │   ├── DashboardPage.jsx   ← Dashboard (/dashboard)
│   │   ├── AttendancePage.jsx  ← Asistencia (/cursos/:id/asistencia)
│   │   └── AdminPage.jsx       ← Panel admin (/admin)
│   │
│   ├── components/             ← Componentes reutilizables
│   │   ├── ui/                 ← Componentes base
│   │   │   ├── Button.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ...
│   │   ├── layout/             ← Layout
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── AppLayout.jsx
│   │   ├── landing/            ← Componentes landing
│   │   ├── dashboard/          ← Componentes dashboard
│   │   ├── attendance/         ← Componentes de asistencia
│   │   └── admin/              ← Componentes de administración
│   │
│   ├── App.jsx                 ← Componente raíz
│   ├── main.jsx                ← Punto de entrada
│   └── index.html              ← HTML base
│
├── public/                     ← Archivos estáticos
├── .env                        ← Variables de entorno (NO subir a git)
├── .env.example                ← Plantilla de variables (subir a git)
├── package.json
├── vite.config.js              ← Configuración de Vite
├── eslint.config.js            ← Configuración de ESLint
└── README.md
```

---

## 🎯 Comandos Disponibles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build de producción
npm run preview

# Verificar y corregir linting
npm run lint
```

---

## 🔍 Flujo de Autenticación

1. Usuario accede a http://localhost:5173
2. Click en "Iniciar Sesión"
3. Redirige a Azure AD para login
4. Azure redirige de vuelta a `/login`
5. Sistema valida el token de Azure
6. Genera un JWT propio
7. Usuario accede al dashboard

En **desarrollo**, usa `/api/auth/login-dev` para login sin Azure.

---

## 🔗 Conexión con el Backend

El frontend se conecta a la API en:
```
http://localhost:3000
```

Asegúrate de que:
1. El backend esté corriendo (`npm run dev` en `/backend`)
2. Las CORS estén configuradas correctamente
3. El `.env` tenga el `VITE_API_URL` correcto

---

## 📦 Estructura de Archivos Importantes

### Context de Autenticación
`src/context/AuthContext.jsx` - Gestiona el estado de sesión del usuario

### Hooks Personalizados
- `useCursos.js` - Obtiene cursos del usuario
- `useAttendance.js` - Gestiona datos de asistencia
- `useDashboard.js` - Datos del dashboard

### Temas y Estilos
- `theme.js` - Define colores, tamaños, fuentes
- `GlobalStyles.jsx` - Estilos globales y reset CSS

---

## 🐛 Solución de Problemas

**Error: "Cannot find module 'react'"**
```bash
npm install react react-dom --save
```

**Error: "Port 5173 is already in use"**
```bash
# Especifica otro puerto
npm run dev -- --port 5174
```

**Error: "API connection refused"**
- Verifica que el backend esté corriendo en `http://localhost:3000`
- Comprueba que `VITE_API_URL` sea correcto en `.env`
- Verifica CORS en la configuración del backend

**Estilos no cargan correctamente**
```bash
# Reinstala las dependencias
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 💡 Tips de Desarrollo

- Los cambios en el código se reflejan **instantáneamente** (HMR)
- Los datos mockeados están en `src/mocks/`
- El tema global se configura en `src/styles/theme.js`
- Los componentes reutilizables van en `src/components/ui/`

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica que Node.js esté actualizado
2. Borra `node_modules` y `package-lock.json`, luego ejecuta `npm install`
3. Revisa la consola del navegador (F12) para errores
4. Consulta la documentación en http://localhost:3000/api-docs
```

---

## Rutas

| Ruta | Página | Acceso |
|---|---|---|
| `/` | LandingPage | Público |
| `/login` | LoginPage | Público |
| `/dashboard` | DashboardPage | Solo `docente` |
| `/cursos/:id/asistencia` | AttendancePage | Solo `docente` |
| `/admin` | AdminPage | Solo `administrador` |

Las rutas protegidas usan `PrivateRoute` en `App.jsx`. Si no hay sesión redirigen a `/login`; si el rol no coincide redirigen al destino correcto del rol.

---

## Modo simulación

Mientras Azure AD no está configurado, el login muestra dos botones de rol:

- **Docente** → navega a `/dashboard`
- **Administrador** → navega a `/admin`

La sesión se persiste en `localStorage` (clave: `smartclass_mock_user`). Para desactivar el modo simulación y activar MSAL real:

1. Instalar `@azure/msal-browser` y `@azure/msal-react`
2. En `AuthContext.jsx` reemplazar `login(rol)` por `instance.loginRedirect({ scopes: ['User.Read'] })`
3. En `App.jsx`, `handleLogin` lee el token de Microsoft y consulta la API para obtener el rol

---

## Conexión con la API (cuando el backend esté listo)

Todos los mocks están en `src/mocks/`. Cuando el backend esté disponible:

```js
// Antes (mock)
import { MOCK_CURSOS } from '../mocks/dashboard.mock';

// Después (API real)
const cursos = await fetch(`${import.meta.env.VITE_API_URL}/api/cursos/docente/me`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());
```

La **estructura de datos no cambia** porque la API devuelve los nombres de los catálogos (ej. `"Presente"`, `"completado"`) en lugar de los IDs de FK — el mapeo lo hace el backend.

---

## Sistema de diseño

El proyecto sigue **The Academic Atelier** (ver `DESIGN.md`):

- **Paleta**: Deep University Blue `#000666` + Academic Teal `#006b5e`
- **Fuentes**: Playfair Display (titulares) + Plus Jakarta Sans (cuerpo)
- **Regla "no-line"**: los límites entre secciones se definen por cambios de superficie, nunca con `border: 1px solid`
- **Ghost border**: cuando se necesita un borde, se usa `outlineVariant` al 15% de opacidad
- **Glassmorphism**: para elementos flotantes (cards hero, modales)
