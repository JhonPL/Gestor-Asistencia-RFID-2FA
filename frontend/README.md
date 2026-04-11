# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


--------------------------------------------------------------------------------------------------------------------------------------

# SmartClass RFID — Frontend Web

> Interfaz web para docentes y administradores del sistema de asistencia con RFID.

---

## Stack

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 19 | Framework de UI |
| Vite | 6 | Bundler y servidor de desarrollo |
| styled-components | ^6 | CSS-in-JS con temas |
| react-router-dom | v7 | Enrutamiento SPA |

---

## Instalación

```bash
# Desde la raíz del proyecto
npm install

# Dependencias principales (si arrancas desde cero)
npm install react react-dom
npm install react-router-dom
npm install styled-components

# Dev dependencies
npm install -D vite @vitejs/plugin-react-swc eslint
```

---

## Comandos

```bash
npm run dev      # Servidor de desarrollo en http://localhost:5173
npm run build    # Build de producción en /dist
npm run preview  # Preview del build
```

---

## Variables de entorno (`.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_AZURE_CLIENT_ID=       # Pendiente: área de sistemas UCC
VITE_AZURE_TENANT_ID=       # Pendiente: área de sistemas UCC
VITE_AZURE_REDIRECT_URI=http://localhost:5173/login
```

---

## Estructura de carpetas

```
src/
├── context/
│   └── AuthContext.jsx         ← sesión simulada (swap por MSAL en producción)
├── styles/
│   ├── theme.js                ← tokens de diseño (colores, tipografía, espaciado)
│   └── GlobalStyles.jsx        ← reset CSS + Google Fonts
├── mocks/
│   ├── dashboard.mock.js       ← datos simulados del dashboard docente
│   └── attendance.mock.js      ← datos simulados de asistencia y admin
├── pages/
│   ├── LandingPage.jsx         ← ruta /
│   ├── LoginPage.jsx           ← ruta /login  (redirect_uri de Azure AD)
│   ├── DashboardPage.jsx       ← ruta /dashboard
│   ├── AttendancePage.jsx      ← ruta /cursos/:id/asistencia
│   └── AdminPage.jsx           ← ruta /admin
└── components/
    ├── ui/                     ← Button, Badge, Icon, Modal, FormElements
    ├── layout/                 ← Navbar, Footer, AppLayout
    ├── landing/                ← HeroSection, DashboardPreview, CtaSection
    ├── dashboard/              ← CourseCard, widgets de sesiones/horario/acciones
    ├── attendance/             ← AttendanceStatusToggle, VerificationBadge
    └── admin/                  ← tablas, modales CRUD de personas y dispositivos
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
