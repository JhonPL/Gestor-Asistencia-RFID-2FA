# Implementación de OAuth 2.0 con Google

## Configuración

### 1. Crear Credenciales en Google Cloud Console

1. Ir a https://console.cloud.google.com/
2. Crear un nuevo proyecto o seleccionar uno existente
3. Ir a **APIs & Services > Credentials**
4. Click en **Create Credentials > OAuth 2.0 Client ID**
5. Seleccionar **Web application**
6. Agregar URIs autorizadas (para el cliente):
   - **Authorized JavaScript origins**: `http://localhost:5173` (desarrollo Vite)
   - **Authorized redirect URIs**: `http://localhost:3000` (backend, para validación)
   - Para producción: cambiar `localhost` por tu dominio
7. Copiar **Client ID** y **Client Secret**

### 2. Configurar Variables de Entorno

**Backend** → `backend/.env`:

```env
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Frontend** → `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
```

### 3. Ejecutar Migración de Base de Datos

```bash
psql -U postgres -d smartclass_rfid -f backend/src/database/script_bd_google_oauth.sql
```

## Flujo de Autenticación

### Frontend - Componente de Login

```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  const handleGoogleSuccess = async (credentialResponse) => {
    // credentialResponse.credential es el JWT token de Google
    
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
