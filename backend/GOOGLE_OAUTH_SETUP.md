# Implementación de OAuth 2.0 con Google

## � IMPORTANTE: Expo Go vs Development Build

**Si estás usando Expo Go** (en la terminal dice: "Using Expo Go"):
- ✅ Debes usar `useProxy: true` (el proxy deprecated funciona)
- ❌ NO puedes usar deep links personalizados

**Si tienes un development build**:
- ✅ Puedes usar deep links sin proxy
- ❌ El proxy no funcionará

**Estado actual:** Usando Expo Go + Proxy (temporal para desarrollo)

---

## 🔑 CONFIGURACIÓN PARA EXPO GO + PROXY

### PASO 1: En Google Cloud Console

1. **Ir a:** https://console.cloud.google.com/
2. **Seleccionar el proyecto**
3. **Ir a:** APIs & Services > Credentials
4. **Editar** OAuth 2.0 Client ID (tipo: "Web application")

### PASO 2: Registrar URIs para el Proxy de Expo

**En "Authorized JavaScript Origins":**
```
https://auth.expo.io
http://localhost:5173
http://localhost:3000
```

**En "Authorized redirect URIs":**
```
https://auth.expo.io/
http://localhost:3000/api/auth/google/callback
```

Guarda y espera **5-10 minutos** (Google tarda en propagarse).

---

## 🚀 CONFIGURACIÓN DEL BACKEND

### PASO 3: Variables de Entorno en `backend/.env`

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_exacto
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Otros...
DB_HOST=localhost
DB_NAME=smartclass_rfid
DB_USER=postgres
JWT_SECRET=tu_jwt_secret_muy_secreto
```

### PASO 4: Migración de BD

```bash
cd backend
psql -U postgres -d smartclass_rfid -f src/database/script_bd_google_oauth.sql
```

---

## 📱 CONFIGURACIÓN DEL MOBILE (Expo Go)

### PASO 5: Variables en `mobile/app.json`

```json
{
  "expo": {
    "projectId": "dcef63df-50c9-48e7-80e2-bdcda1998b5b",
    "extra": {
      "GOOGLE_CLIENT_ID": "tu_client_id.apps.googleusercontent.com",
      "API_BASE_URL": "http://192.168.80.60:3000"
    }
  }
}
```

---

## 🔄 FLUJO DE AUTENTICACIÓN (CON PROXY)

```
┌─────────────┐
│   Mobile    │
│  (Expo Go)  │
└──────┬──────┘
       │ 1. Usuario toca "Login con Google"
       │
       ▼
┌──────────────────────────────────┐
│   Google OAuth Flow              │
│   (redirects to auth.expo.io)    │ ◄─── PROXY intercepta
└──────┬───────────────────────────┘
       │ 2. Usuario elige cuenta Gmail
       │ 3. Google redirige a: https://auth.expo.io/
       │ 4. El proxy redirige de vuelta a Expo Go
       │ 5. Expo obtiene el idToken
       │
       ▼
┌─────────────────────┐
│  Mobile App         │
│  (loginWithGoogle)  │
└──────┬──────────────┘
       │ 6. Envía: { credential: idToken }
       │
       ▼
┌──────────────────────────┐
│ Backend                  │
│ POST /api/auth/google... │
│ 1. Verifica token        │
│ 2. Busca persona en BD   │
│ 3. Emite JWT propio      │
└──────┬───────────────────┘
       │ 7. Retorna: { token, user }
       │
       ▼
┌──────────────┐
│ Mobile Home  │
│ (Autenticado)│
└──────────────┘
```

---

## 🐛 DIAGNÓSTICO DE ERRORES

### Error: "You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy"

**Causa:** Las URIs no están registradas en Google Cloud Console

**Solución:**
1. En Google Cloud Console, asegúrate que EXACTAMENTE estos URIs estén registrados:
   - Origins: `https://auth.expo.io`
   - Redirect URIs: `https://auth.expo.io/`
2. Guarda y **espera 10 minutos** (Google propaga lentamente)
3. Intenta de nuevo

### Error: "Proxy de redirección de Expo AuthSession está obsoleto"

**Esto es normal.** Es solo un warning que dice:
- ⚠️ El proxy de Expo va a desaparecer en el futuro
- ✅ Por ahora sigue funcionando en Expo Go
- ✅ Para producción, deberías usar un development build

### Error en Backend: "Token validating failed"

```bash
# En terminal del backend, deberías ver:
🌐 [GOOGLE CALLBACK] Solicitud recibida
✅ Token recibido, longitud: 1234
🔐 [VERIFICAR TOKEN DE GOOGLE]
✅ [TOKEN VÁLIDO]
```

Si ves ❌ Error, verifica:
- GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en backend/.env
- Que coincidan exactamente con Google Cloud Console

---

## 🧪 PRUEBA MANUAL

### Paso 1: Terminal 1 - Backend

```bash
cd backend
npm start
```

Deberías ver:
```
✅ Server running on http://localhost:3000
```

### Paso 2: Terminal 2 - Mobile

```bash
cd mobile
npm start --clear
```

Deberías ver:
```
› Using Expo Go
› Metro waiting on exp://192.168.80.60:8081
```

### Paso 3: En tu teléfono/emulador

1. Abre Expo Go
2. Escanea el QR o ve a `exp://192.168.80.60:8081`
3. Toca "Iniciar sesión con Google"
4. **Te debe aparecer el selector de cuentas Gmail** ✅
5. Selecciona tu cuenta
6. Deberías ir directamente a la pantalla home

---

## ⚠️ PARA PRODUCCIÓN (Development Build)

Cuando quieras crear un APK con deep links propios, haz:

```bash
cd mobile
eas build --platform android --profile preview
```

Esto crea una APK que:
- ✅ Soporta deep links como `mobile://oauth-callback`
- ✅ NO necesita el proxy
- ✅ Funciona sin Expo Go
- ❌ Tarda 10 minutos en compilar

---

## 📋 CHECKLIST PARA DESARROLLO CON EXPO GO

- [ ] En Google Cloud Console, `https://auth.expo.io` está en Origins
- [ ] En Google Cloud Console, `https://auth.expo.io/` está en Redirect URIs
- [ ] backend/.env tiene GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
- [ ] mobile/app.json tiene el mismo GOOGLE_CLIENT_ID
- [ ] Backend está corriendo (`npm start`)
- [ ] Terminal de mobile dice: "Using Expo Go"
- [ ] La app muestra el selector de cuentas Gmail ✅






    
    const response = await fetch('/api/auth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: credentialResponse.credential })
    });
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
  };

  return (
    <GoogleOAuthProvider clientId="tu_client_id">
      <GoogleLogin 
        onSuccess={handleGoogleSuccess}
        onError={() => console.log('Login failed')}
      />
    </GoogleOAuthProvider>
  );
}
```

### Backend - Endpoint

**POST** `/api/auth/google/callback`

**Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIs..." // JWT token de Google
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 123,
    "nombre": "Carlos",
    "apellido": "Ramirez",
    "correo": "carlos@example.com",
    "rol": "estudiante"
  }
}
```

## Flujo Completo (Sin configuración de Backend)

1. **Frontend**: Usuario hace click en "Iniciar sesión con Google"
2. **Google**: Se abre modal de autenticación de Google
3. **Google**: Devuelve un JWT token (credential)
4. **Frontend**: Envía el token al backend en `/api/auth/google/callback`
5. **Backend**: Valida el token contra Google, extrae el email
6. **Backend**: Busca o crea al usuario, emite JWT propio
7. **Frontend**: Guarda el JWT en localStorage y redirige a dashboard

## Comportamiento del Sistema

- **Primer login con Google**: Se crea automáticamente un usuario con rol **estudiante**
- **Logins posteriores**: Se valida que el usuario exista y esté activo
- **Usuarios existentes**: Si el correo ya existe en el sistema (por ejemplo, creado por admin), se vincula con su cuenta de Google

## Consideraciones de Seguridad

1. **Validación de Token**: El backend valida el JWT directamente contra Google, sin necesidad de código secreto
2. **Sin CORS issues**: La validación ocurre server-to-server
3. **Audience claim**: Se valida que el token sea para tu `GOOGLE_CLIENT_ID`
4. **HTTPS en producción**: Requiere HTTPS para cookies seguras
5. **Tiempo de expiración**: Los tokens de Google expiran rápidamente, por eso usamos JWT propio

## Pruebas

### Con cURL

```bash
# Obtener un token válido de Google (manualmente o del navegador)
curl -X POST http://localhost:3000/api/auth/google/callback \
  -H "Content-Type: application/json" \
  -d '{"credential":"tu_google_token_aqui"}'
```

### Con Postman

1. Crear un POST request a `http://localhost:3000/api/auth/google/callback`
2. Body (JSON):
   ```json
   {
     "credential": "eyJhbGciOiJSUzI1NiIs..."
   }
   ```
3. Enviar

## Migraciones

El archivo `migration_v8_google_oauth.sql` agrega:
- Columna `google_id` a tabla `persona`
- Índice para búsquedas rápidas

```sql
ALTER TABLE persona 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_persona_google_id ON persona(google_id);
```

## Próximos Pasos

- [x] Implementar validación de tokens en el backend
- [x] Crear componente de Google Login en el frontend
- [x] Integración automática de usuarios nuevos
- [ ] Agregar botón de logout con revoke de sesión de Google
- [ ] Permitir vincular múltiples proveedores OAuth a una cuenta
- [ ] Remover el estado "sin app" una vez funcione completamente
