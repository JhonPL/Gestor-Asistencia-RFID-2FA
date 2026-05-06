# Mobile - Gestor de Asistencia RFID 2FA

Aplicación móvil **cross-platform** desarrollada con **Expo** y **React Native** para la gestión de asistencia con tecnología RFID y autenticación de dos factores (2FA).

---

## 📋 Requisitos Previos

### Instalación Base (Obligatorio)

- **Node.js**: versión 16 o superior ([Descargar](https://nodejs.org/))
- **npm**: versión 8 o superior (se instala con Node.js)
- **Git**: para clonar el repositorio (opcional)

Verifica las versiones:
```bash
node --version    # Debe ser v16.x.x o superior
npm --version     # Debe ser v8.x.x o superior
```

### Para Android (Opcional)

- **Android Studio**: versión 2022.1 o superior ([Descargar](https://developer.android.com/studio))
- **Java Development Kit (JDK)**: versión 11 o superior
- **Emulador de Android** o **dispositivo físico** con `USB Debugging` activado

### Para iOS (Opcional - Solo macOS)

- **Xcode**: versión 14 o superior ([App Store](https://apps.apple.com/es/app/xcode/id497799835))
- **Simulador de iOS** o **dispositivo físico** con desarrollo habilitado

### Para Web (Opcional)

- No requiere instalaciones adicionales (usa navegadores estándar)

---

## 🚀 Instalación Paso a Paso

### 1️⃣ Instalar las dependencias

```bash
# Desde la carpeta /mobile
cd mobile

# Instalar todas las dependencias del proyecto
npm install
```

Esto instala automáticamente:
- **expo** - Framework para desarrollo React Native
- **react** - Librería de React
- **react-native** - Plataforma móvil de React
- **expo-router** - Enrutamiento basado en archivos
- **@react-navigation** - Sistema de navegación
- **expo-location**, **expo-notifications**, **expo-local-authentication** - APIs nativas
- Y más (ver `package.json`)

### 2️⃣ Configurar variables de entorno

```bash
# Crear archivo .env en la raíz de /mobile
# (Puede copiarse de .env.example si existe)
touch .env

# Editar .env con lo siguiente:
```

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_AZURE_CLIENT_ID=tu_client_id_aqui
REACT_APP_AZURE_REDIRECT_URI=http://localhost:19006/
```

**Nota**: Los IDs de Azure deben solicitarse al área de sistemas de la institución.

### 3️⃣ Instalar Expo CLI globalmente (Recomendado)

```bash
# Instalar Expo CLI de forma global
npm install -g expo-cli

# Verificar la instalación
expo --version
```

### 4️⃣ Iniciar la aplicación

#### Opción A: Usar npm (más simple)

```bash
npm start
```

Se abrirá el menú de Expo donde puedes elegir:
```
Press a to open Android
Press i to open iOS  
Press w to open web
Press r to reload
Press q to quit
```

#### Opción B: Usar comandos directos

```bash
# Abrir en Android
npm run android

# Abrir en iOS (solo en macOS)
npm run ios

# Abrir en navegador web
npm run web
```

---

## 🔧 Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| **Expo** | ~54.0.33 | Framework para desarrollo React Native |
| **React** | 19 | Librería de UI |
| **React Native** | 0.81.5 | Plataforma móvil |
| **Expo Router** | 6 | Enrutamiento basado en archivos |
| **React Navigation** | 7 | Sistema de navegación |

---

## 📦 Dependencias Principales

### Framework Base
| Paquete | Versión | Propósito |
|---------|---------|----------|
| `expo` | ~54.0.33 | Framework principal |
| `react` | ^19.1.0 | Librería de React |
| `react-native` | 0.81.5 | Plataforma móvil |
| `react-dom` | ^19.1.0 | Soporte web |

### Navegación
| Paquete | Versión | Propósito |
|---------|---------|----------|
| `expo-router` | ~6.0.23 | Enrutamiento basado en archivos |
| `@react-navigation/native` | ^7.2.2 | Gestor de navegación base |
| `@react-navigation/native-stack` | ^7.14.10 | Stack navigator |
| `react-native-screens` | ~4.16.0 | Optimización nativa |
| `react-native-safe-area-context` | ~5.6.0 | Manejo de notches y safe areas |

### UI & Componentes
| Paquete | Versión | Propósito |
|---------|---------|----------|
| `@expo/vector-icons` | ^15.0.3 | Iconos vectoriales |
| `@expo-google-fonts/plus-jakarta-sans` | ^0.4.2 | Fuente personalizada |
| `expo-font` | ~14.0.11 | Carga de fuentes |
| `expo-status-bar` | ~3.0.9 | Control de barra de estado |

### Almacenamiento & Autenticación
| Paquete | Versión | Propósito |
|---------|---------|----------|
| `@react-native-async-storage/async-storage` | 2.2.0 | Almacenamiento local |
| `expo-auth-session` | ~7.0.10 | OAuth y sesiones |
| `expo-local-authentication` | ~17.0.8 | Biometría (huella, rostro) |

### Features Avanzadas
| Paquete | Versión | Propósito |
|---------|---------|----------|
| `expo-location` | ~19.0.8 | Acceso a GPS |
| `expo-notifications` | ~0.32.16 | Notificaciones push |
| `expo-constants` | ~18.0.13 | Acceso a constantes |
| `expo-linking` | ~8.0.11 | Deep linking |
| `expo-build-properties` | ^55.0.13 | Propiedades de build nativas |

---

## 📁 Estructura del Proyecto

```
mobile/
├── app/                        ← Rutas (Expo Router)
│   ├── _layout.js             ← Layout principal
│   ├── index.js               ← Pantalla de inicio
│   └── screens/               ← Pantallas de la app
│       ├── login.js
│       ├── home.js
│       ├── attendance-confirm.js
│       └── history.js
│
├── src/
│   ├── api/                   ← Llamadas a la API
│   │   ├── auth.js            ← Autenticación
│   │   ├── asistencia.js      ← Asistencia
│   │   ├── movil.js           ← Endpoints específicos móvil
│   │   └── index.js           ← Configuración base
│   │
│   ├── storage/               ← Almacenamiento local
│   │   └── index.js
│   │
│   └── notifications/         ← Notificaciones
│       └── index.js
│
├── components/
│   └── ui/
│       └── index.js           ← Componentes reutilizables
│
├── constants/
│   └── tokens.js              ← Constantes de la app
│
├── mocks/
│   └── index.js               ← Datos simulados
│
├── android/                   ← Carpeta Android
│   └── app/
│       └── src/               ← Código nativo Java/Kotlin
│
├── assets/                    ← Imágenes, fuentes, etc.
├── app.json                   ← Configuración de Expo
├── eas.json                   ← Configuración de builds
├── package.json
└── README.md
```

---

## 🎯 Comandos Disponibles

```bash
# Iniciar la aplicación
npm start

# Abrir en Android (requiere Android Studio)
npm run android

# Abrir en iOS (requiere Xcode - solo macOS)
npm run ios

# Abrir en navegador web
npm run web
```

---

## 🔐 Flujo de Autenticación

1. Usuario abre la app
2. Si no hay sesión, muestra pantalla de login
3. Usuario ingresa credenciales o usa biometría
4. App obtiene token del backend
5. Token se almacena en AsyncStorage
6. Usuario accede a la app

---

## 📱 Plataformas Soportadas

### Android
```bash
npm run android
```
- Requiere Android Studio y emulador o dispositivo
- Mínimo SDK: 21
- Objetivo SDK: 34

### iOS
```bash
npm run ios
```
- Solo en macOS
- Requiere Xcode
- Mínimo iOS 13

### Web
```bash
npm run web
```
- Funciona en cualquier navegador
- Útil para desarrollo rápido
- URL: http://localhost:19006

---

## 🔗 Conexión con el Backend

La app se conecta a la API en:
```
http://localhost:3000
```

Asegúrate de que:
1. El backend esté corriendo (`npm run dev` en `/backend`)
2. El `.env` tenga el `REACT_APP_API_URL` correcto
3. Las CORS estén configuradas en el backend

---

## 🐛 Solución de Problemas

**Error: "Cannot find module 'expo'"**
```bash
npm install expo --save
```

**Error: "Android emulator not found"**
- Abre Android Studio
- Ve a Tools → Device Manager
- Crea un nuevo emulador virtual

**Error: "Port 19000 already in use"**
```bash
# Especifica otro puerto
expo start --port 19001
```

**Error: "API connection refused"**
- Verifica que el backend esté corriendo
- En emulador Android, usa: `http://10.0.2.2:3000`
- En dispositivo físico, usa la IP local: `http://192.168.x.x:3000`

**Error: "Biometric authentication not available"**
- No todos los dispositivos tienen sensores biométricos
- La app debe manejar fallback a PIN o contraseña

**Error: "Location permission denied"**
- Solicita permisos en runtime para Android 6+
- Ve a Configuración → Aplicaciones → Permisos → Ubicación

---

## 💡 Tips de Desarrollo

- Los cambios en el código se reflejan **en tiempo real**
- Usa `console.log()` para debugging (visible en terminal Expo)
- Los datos mockeados están en `src/mocks/`
- Para dispositivo físico, escanea el código QR de Expo
- En emulador, presiona `a` en terminal para recargar

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica que Node.js esté actualizado
2. Borra `node_modules` y `package-lock.json`, luego ejecuta `npm install`
3. Reinicia Expo: presiona `q` y ejecuta `npm start` nuevamente
4. Consulta logs en la terminal Expo para más detalles
5. Revisa [documentación oficial de Expo](https://docs.expo.dev/)
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