# 🌍 Configuración de Ubicación en Flujo de Biometría

## Descripción General

El flujo de biometría ahora captura la ubicación del dispositivo después de la verificación biométrica. Se implementaron **dos escenarios de prueba**:

### 1. **Escenario: Fuera del Campus (Simulado)** ❌
- **Variable**: `DEBUG_UBICACION = "simular_fuera"`
- **Ubicación simulada**: Iquitos, Perú (~18 km del campus UCC)
- **Resultado**: Muestra alerta de "Fuera del campus"
- **Propósito**: Probar el flujo cuando NO estás en la universidad

### 2. **Escenario: Ubicación Real en Campus** ✅
- **Variable**: `DEBUG_UBICACION = "obtener_real"`
- **Ubicación**: Captura tu ubicación real del dispositivo
- **Resultado**: Valida si estás dentro del radio del campus (500m)
- **Propósito**: Probar cuando estés físicamente en la UCC

---

## Cómo Usar

### Cambiar entre Escenarios

Abre el archivo: `mobile/app/screens/attendance-confirm.js`

Busca esta línea (cerca del inicio):
```javascript
const DEBUG_UBICACION = "simular_fuera";
```

**Para probar fuera del campus:**
```javascript
const DEBUG_UBICACION = "simular_fuera";
```

**Para probar con ubicación real (en la universidad):**
```javascript
const DEBUG_UBICACION = "obtener_real";
```

---

## Funcionalidades Implementadas

### Campus UCC
- **Latitud**: -4.1429
- **Longitud**: -73.6267
- **Radio**: 500 metros

### Cálculo de Distancia (Fórmula Haversine)
- Calcula la distancia exacta entre tu ubicación y el campus
- Si estás dentro de 500m → **Ubicación válida**
- Si estás fuera → **Mostrar alerta de distancia**

### Flujo de Verificación
1. **Biometría** → Verifica huella dactilar/Face ID
2. **Ubicación** → Captura GPS y valida campus
3. **Servidor** → Envía datos al backend

---

## Permisos Requeridos

El app pedirá permiso de ubicación cuando cambies a `"obtener_real"`:

```javascript
const { status } = await Location.requestForegroundPermissionsAsync();
```

**Acepta el permiso en el dispositivo** para que funcione.

---

## Resultados Esperados

### Escenario 1: Fuera del Campus
```
✓ Biometría verificada
✗ Ubicación: Fuera del campus (18432 metros)
⚠️ Alerta: "Estás a 18432 metros del campus UCC"
```

### Escenario 2: En el Campus (Real)
```
✓ Biometría verificada
✓ Ubicación: Dentro del campus (142 metros)
✓ Asistencia: Confirmada
```

---

## Código Importante

### Función `obtenerUbicacion()`
```javascript
async function obtenerUbicacion() {
  // Retorna:
  // - latitude, longitude
  // - dentro: boolean (si está en el campus)
  // - distancia: número en metros
  // - error: string (si hay error)
}
```

### Función `calcularDistancia()`
```javascript
function calcularDistancia(lat1, lon1, lat2, lon2) {
  // Usa fórmula Haversine
  // Retorna distancia en metros
}
```

---

## Pruebas Recomendadas

1. **Primera prueba (fuera)**: `DEBUG_UBICACION = "simular_fuera"`
   - Verifica que aparezca la alerta de distancia
   - Comprueba que se registre la asistencia aunque falle ubicación

2. **Segunda prueba (en universidad)**: `DEBUG_UBICACION = "obtener_real"`
   - Estando físicamente en la UCC
   - Acepta permiso de ubicación
   - Verifica que se valide correctamente

---

## Notas Técnicas

- **Librería**: `expo-location` (ya instalada)
- **Accuracy**: Balanced (no requiere mucha precisión)
- **Timeout**: Simulado en escenario fuera (~1.5s)
- **Métrica**: Metros (para precisión local)

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| No pide permiso de ubicación | Asegúrate de estar en `"obtener_real"` y recarga la app |
| Dice "Permiso denegado" | Ve a Configuración → Permisos → Ubicación → Permitir |
| No detecta ubicación | Activa GPS en el dispositivo |
| Siempre dice fuera del campus | Verifica que estés dentro del radio de 500m |

