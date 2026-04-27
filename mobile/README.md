# Mobile - Gestor de Asistencia RFID 2FA

Aplicación móvil cross-platform desarrollada con **Expo** y **React Native** para la gestión de asistencia con tecnología RFID y autenticación de dos factores.

## 📋 Requisitos Previos

- **Node.js**: versión 16 o superior
- **npm**: versión 8 o superior
- **Expo CLI**: se instala automáticamente con `npx expo`
- **Android Studio** (para Android) o **Xcode** (para iOS)
- Dispositivo físico o emulador

## 🚀 Instalación


```bash
npm install
```

### Iniciar la aplicación

```bash
npm start
```

Esto abrirá el menú de Expo donde puedes elegir:
- **a**: Abrir en Android
- **i**: Abrir en iOS
- **w**: Abrir en web
- **q**: Salir

## 📦 Dependencias Principales

### Framework Base
| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `expo` | ~54.0.33 | Framework para desarrollo React Native |
| `react` | ^19.1.0 | Librería de React |
| `react-native` | 0.81.5 | Plataforma móvil de React |
| `react-dom` | ^19.1.0 | Soporte para web en Expo |

### Navegación
| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `expo-router` | ~6.0.23 | Enrutamiento basado en archivos (Expo routing) |
| `@react-navigation/native` | ^7.2.2 | Gestor de navegación base |
| `@react-navigation/native-stack` | ^7.14.10 | Stack navigator para navegación |
| `react-native-screens` | ~4.16.0 | Optimización de pantallas nativas |
| `react-native-safe-area-context` | ~5.6.0 | Manejo de áreas seguras (notches, home bar) |

### UI & Componentes
| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `@expo/vector-icons` | ^15.0.3 | Iconos vectoriales (Ionicons, FontAwesome, etc.) |
| `@expo-google-fonts/plus-jakarta-sans` | ^0.4.2 | Fuente Plus Jakarta Sans de Google |
| `expo-font` | ~14.0.11 | Carga de fuentes personalizadas |
| `expo-status-bar` | ~3.0.9 | Control de barra de estado |

### Almacenamiento & Estado
| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `@react-native-async-storage/async-storage` | 2.2.0 | Almacenamiento local asincrónico |

### Autenticación
| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `expo-auth-session` | ~7.0.10 | Sesión de autenticación y OAuth |
| `expo-local-authentication` | ~17.0.8 | Biometría (huella, rostro, PIN) |

### Features
| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `expo-location` | ~19.0.8 | Acceso a ubicación GPS |
| `expo-notifications` | ~0.32.16 | Notificaciones push locales y remotas |
| `expo-constants` | ~18.0.13 | Acceso a constantes del app |
| `expo-linking` | ~8.0.11 | Manejo de deep linking |

## 🎯 Scripts Disponibles

```bash
# Iniciar la aplicación en modo desarrollo
npm start

# Abrir en Android
npm run android

# Abrir en iOS
npm run ios

# Abrir en web
npm run web
```

## 📁 Estructura del Proyecto

```
mobile/
├── app/
│   ├── _layout.js          # Layout principal de rutas
│   ├── index.js            # Pantalla de inicio
│   └── screens/            # Pantallas de la aplicación
│       ├── login.js
│       ├── home.js
│       ├── attendance-confirm.js
│       └── history.js
├── assets/                 # Recursos estáticos
├── components/
│   └── ui/                 # Componentes UI reutilizables
├── constants/
│   └── tokens.js          # Constantes y tokens
├── mocks/                 # Datos mock para desarrollo
├── App.js                 # Componente raíz
├── app.json              # Configuración de Expo
├── package.json          # Dependencias
└── README.md             # Este archivo
```

## 🔧 Configuración

### Variables de Entorno

Las variables de entorno se cargan desde `constants/tokens.js`. Actualiza los valores necesarios:

```javascript
export const API_BASE_URL = 'tu-url-de-api';
export const TOKEN_STORAGE_KEY = 'auth_token';
// ... más configuración
```

### Cambios Recientes

#### Instalación de AsyncStorage (v2.2.0)

Se agregó `@react-native-async-storage/async-storage` para:
- Almacenar datos locales de forma persistente
- Guardar tokens de autenticación
- Persistir estado de la aplicación
- Caché de datos

Instalación:
```bash
npx expo install @react-native-async-storage/async-storage
```

## 💡 Cómo Usar AsyncStorage

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Guardar datos
await AsyncStorage.setItem('user_token', 'valor-token');

// Obtener datos
const token = await AsyncStorage.getItem('user_token');

// Eliminar datos
await AsyncStorage.removeItem('user_token');

// Limpiar todo
await AsyncStorage.clear();


En la ruta src/api/index.js reecplace TU_IP_LOCAL por su ip
```

## 🐛 Troubleshooting

### La app no inicia
1. Limpia cache: `npm start -- --clear`
2. Reinstala dependencias: `rm -rf node_modules && npm install`
3. Reconstruye: `expo prebuild --clean`

### Error de versiones
- Todas las dependencias están fijadas a versiones compatibles con Expo 54.0.33
- No instales paquetes manualmente, usa `npx expo install <package>` para asegurar compatibilidad

### AsyncStorage no funciona
- En Android: asegúrate que el permiso está en `app.json`
- En iOS: ejecuta `expo prebuild --clean` y reconstruye
- Limpia datos: `await AsyncStorage.clear()`

---

**Última actualización**: Abril 2026
**Versión del proyecto**: 1.0.0