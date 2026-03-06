---
description: Workflow completo para mejoras del módulo de Tracking GPS - RelojReducto
---

# 🛰️ Mejoras del Módulo de Tracking GPS - RelojReducto

## Información del Proyecto
- **URL Producción:** https://asistoreducto.arizar-ia.cloud
- **Backend:** Docker container `relojreducto-backend` (Spring Boot / Java)
- **Frontend:** Docker container `relojreducto-frontend` (React + Vite)
- **DB:** MySQL en `relojreducto-db`
- **Deploy script:** `bash /home/reductoasistencia/deploy.sh [frontend|backend|all]`
- **Admin creds:** admin/admin123
- **Token path:** `/tmp/admin_token.txt`

## Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `frontend/src/components/GeofenceTracker.jsx` | Tracking GPS vinculado a turno laboral |
| `frontend/src/components/GpsIndicator.jsx` | Indicador visual GPS en header |
| `frontend/src/components/BotonMarcacion.jsx` | Botón de marcación — dispara evento para tracking |
| `frontend/public/sw.js` | Service Worker para tracking background + offline |
| `frontend/src/App.jsx` | Root component - GeofenceTracker montado aquí |
| `frontend/src/pages/AdminPanel.jsx` | `AdminRastreo` (~L5354) - Panel admin mapa GPS |
| `frontend/src/services/api.js` | `trackingService` con exportKml + getResumen |
| `backend/.../service/UbicacionTrackingService.java` | Servicio tracking con alertas + resumen |
| `backend/.../service/TrackingCleanupService.java` | Limpieza automática datos >90 días |
| `backend/.../controller/UbicacionTrackingController.java` | Controller REST con KML export + resumen |
| `backend/.../repository/UbicacionTrackingRepository.java` | Queries DB con JOIN FETCH + delete |
| `backend/.../repository/PreMarcacionRepository.java` | Queries con JOIN FETCH corregido |

## Comandos Útiles

```bash
# Obtener token admin
// turbo
curl -s -X POST http://localhost:8082/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; t=json.load(sys.stdin)['token']; print(t); open('/tmp/admin_token.txt','w').write(t)"

# Deploy
// turbo
bash /home/reductoasistencia/deploy.sh frontend
// turbo
bash /home/reductoasistencia/deploy.sh backend
bash /home/reductoasistencia/deploy.sh all

# Estado servicios
// turbo
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test tracking
// turbo
TOKEN=$(cat /tmp/admin_token.txt) && curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/tracking/admin/tiempo-real | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Activos: {len(d)}')"

# Test KML
// turbo
TOKEN=$(cat /tmp/admin_token.txt) && curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/tracking/admin/ruta/1/exportar" | head -3

# Test resumen
// turbo
TOKEN=$(cat /tmp/admin_token.txt) && curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8082/api/tracking/admin/resumen" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} usuarios')"
```

---

# ✅ FASE 1: Correcciones Críticas (COMPLETADA)

- [x] Fix SEND_INTERVAL 5s → 30s
- [x] Fix fallback `SEND_INTERVAL-5000=0` bug
- [x] Throttle backend 20s entre registros del mismo usuario
- [x] MAX_TRACKING_DIA 500 → 2000
- [x] Fix race condition pre-marcación con `checkingInRef`
- [x] Fix N+1 query tiempo-real con `JOIN FETCH`
- [x] Auth check en GeofenceTracker
- [x] Double-init prevention con `isTrackingRef`

# ✅ FASE 2: Mejoras de Arquitectura (COMPLETADA)

- [x] Mover GeofenceTracker a App.jsx (funciona en todas las páginas)
- [x] Indicador visual GPS (`GpsIndicator.jsx`) con precisión Alta/Media/Baja
- [x] Alertas de batería baja (<15%) al admin
- [x] Detección salida de geocerca con distancia Haversine
- [x] Anti-spam alertas (max 1/hora/usuario/tipo)
- [x] Stat cards: Batería Baja + Precisión Promedio en AdminRastreo
- [x] Colores batería en lista "En Línea" (rojo/amarillo/verde)

# ✅ FASE 3: Nuevas Funcionalidades Backend (COMPLETADA)

- [x] Exportar ruta como KML (Google Earth) — `GET /admin/ruta/{id}/exportar`
- [x] Resumen diario de tracking — `GET /admin/resumen`
- [x] Limpieza automática de datos >90 días — `TrackingCleanupService.java`
- [x] Fix JOIN FETCH en `PreMarcacionRepository`
- [x] Query `findAllByFechaHoraBetween` con JOIN FETCH para resumen
- [x] Query `deleteOlderThan` para cleanup

# ✅ FASE 4: Nuevas Funcionalidades Frontend (COMPLETADA)

- [x] Botón "Exportar KML" junto al selector de fecha
- [x] Tracking vinculado a turno: EMPIEZA con ENTRADA, TERMINA con SALIDA
- [x] Evento `marcacion-realizada` en `BotonMarcacion.jsx`
- [x] GeofenceTracker escucha evento para iniciar/detener tracking
- [x] Service Worker respeta `trackingActivo` flag
- [x] Grid responsive para mobile en AdminRastreo
- [x] `trackingService.exportKml()` y `trackingService.getResumen()` en api.js

# ✅ FASE 5: Verificación y Testing (COMPLETADA)

## Tests ejecutados y resultados:

| # | Test | Resultado | Detalle |
|---|------|-----------|---------|
| 1 | Throttle 20s | ✅ PASS | 1st: `{"status":"ok"}`, 2nd: `{"status":"throttled","waitSeconds":18}` |
| 2 | Tiempo real | ✅ PASS | 1 usuario activo con datos correctos |
| 3 | KML export | ✅ PASS | XML válido con nombre usuario, coordenadas, metadata |
| 4 | Resumen diario | ✅ PASS | 1 usuario, 8 puntos, 0.0km, batería min 8% |
| 5 | Sin auth (403) | ✅ PASS | HTTP 403 Forbidden |
| 6 | Backend logs | ✅ PASS | Sin errores, solo logs de inicialización |
| 7 | Deploy | ✅ PASS | Frontend + Backend compilados y corriendo |

---

# 📋 PENDIENTES FUTUROS (Nice to have, no críticos)

### Heatmap de actividad
- Instalar `leaflet.heat` y agregar toggle "Ver Heatmap" en AdminRastreo
- Renderizar mapa de calor con todos los puntos de tracking del día

### WebSocket para tiempo real
- Reemplazar polling cada 5s por WebSocket push
- Solo si el polling causa problemas de rendimiento

### Clustering de marcadores
- `react-leaflet-markercluster` para agrupar empleados cercanos
- Útil cuando hay muchos empleados en la misma sucursal

### Activar requiereGeolocalizacion
- `UPDATE usuarios SET requiere_geolocalizacion=1 WHERE activo=1 AND rol!='ADMIN';`
- Habilita validación de geocerca en marcación oficial
- **IMPORTANTE:** Coordiniar con gerencia antes de activar

### Compresión de puntos estáticos
- Si un empleado está en el mismo lugar >5 min, actualizar timestamp en vez de crear registros nuevos
- Reduce almacenamiento ~60% para personal de oficina

---

## Notas Importantes

1. **Tracking vinculado a turno:** Empieza con ENTRADA, termina con SALIDA
2. **Service Worker sigue trackeando** aunque cierre la web (limitaciones del navegador aplican)
3. **El backend se compila DENTRO de Docker** — no necesita Maven local
4. **Cleanup automático** a las 3:00 AM elimina tracking >90 días
5. **Alertas son in-memory** — se resetean al reiniciar el backend (aceptable)
6. **OSRM tiene límite de 100 puntos** por request — el frontend hace downsampling
7. **NINGÚN usuario tiene `requiereGeolocalizacion=true`** — coordinar con gerencia
