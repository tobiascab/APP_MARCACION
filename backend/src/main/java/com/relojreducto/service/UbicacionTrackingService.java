package com.relojreducto.service;

import com.relojreducto.dto.UbicacionTrackingDTO;
import com.relojreducto.entity.Sucursal;
import com.relojreducto.entity.UbicacionTracking;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UbicacionTrackingRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Servicio para tracking de ubicaciones de empleados.
 * Guarda posiciones GPS periódicamente para seguridad.
 */
@Service
public class UbicacionTrackingService {

    private final UbicacionTrackingRepository trackingRepository;
    private final UsuarioService usuarioService;
    private final NotificationService notificationService;

    // Máximo de registros por usuario por día (1 cada 30s = ~960 en 8h)
    private static final long MAX_TRACKING_DIA = 2000;
    // Intervalo mínimo entre registros (evita duplicados por race conditions)
    private static final long MIN_INTERVAL_SECONDS = 20;
    // Umbral de batería baja
    private static final int BATERIA_BAJA_UMBRAL = 15;
    // Cache de alertas enviadas (evita spam, max 1 alerta/hora/usuario/tipo)
    private final ConcurrentHashMap<String, LocalDateTime> alertasEnviadas = new ConcurrentHashMap<>();

    public UbicacionTrackingService(UbicacionTrackingRepository trackingRepository,
            UsuarioService usuarioService,
            NotificationService notificationService) {
        this.trackingRepository = trackingRepository;
        this.usuarioService = usuarioService;
        this.notificationService = notificationService;
    }

    /**
     * Registra una ubicación del empleado.
     */
    @Transactional
    public Map<String, Object> registrarUbicacion(Long usuarioId, Double latitud, Double longitud,
            Double accuracy, Double velocidad, Integer bateria) {
        // Throttle: ignorar si el último registro fue hace menos de MIN_INTERVAL_SECONDS
        UbicacionTracking ultimo = trackingRepository.findUltimaUbicacion(usuarioId);
        if (ultimo != null) {
            long segundosDesdeUltimo = java.time.Duration.between(
                    ultimo.getFechaHora(), LocalDateTime.now()).getSeconds();
            if (segundosDesdeUltimo < MIN_INTERVAL_SECONDS) {
                return Map.of("status", "throttled", "waitSeconds", MIN_INTERVAL_SECONDS - segundosDesdeUltimo);
            }
        }

        // Limitar registros por día
        long count = trackingRepository.countUbicacionesHoy(usuarioId);
        if (count >= MAX_TRACKING_DIA) {
            return Map.of("status", "limite_alcanzado");
        }

        Usuario usuario = usuarioService.getEntityById(usuarioId);

        UbicacionTracking tracking = new UbicacionTracking();
        tracking.setFechaHora(LocalDateTime.now());
        tracking.setLatitud(latitud);
        tracking.setLongitud(longitud);
        tracking.setPrecisionGps(accuracy);
        tracking.setVelocidad(velocidad);
        tracking.setBateria(bateria);
        tracking.setUsuario(usuario);

        trackingRepository.save(tracking);

        // === ALERTAS INTELIGENTES ===
        // 1. Batería baja (<15%)
        if (bateria != null && bateria < BATERIA_BAJA_UMBRAL) {
            enviarAlertaSiNoReciente("BAT_" + usuarioId,
                    "BATTERY_LOW",
                    String.format("🔋 %s tiene batería baja: %d%%. El tracking podría detenerse pronto.",
                            usuario.getNombreCompleto(), bateria),
                    Map.of("usuario", usuario.getNombreCompleto(), "bateria", bateria));
        }

        // 2. Salida de geocerca (empleado fuera del área de su sucursal)
        Sucursal sucursal = usuario.getSucursal();
        if (sucursal != null && sucursal.getLatitud() != null && sucursal.getLongitud() != null) {
            int radio = sucursal.getRadioGeocerca() != null ? sucursal.getRadioGeocerca() : 200;
            double distancia = calcularDistancia(latitud, longitud,
                    sucursal.getLatitud(), sucursal.getLongitud());
            // Si está fuera del radio (con margen de 50% extra para evitar falsos positivos)
            if (distancia > radio * 1.5) {
                enviarAlertaSiNoReciente("GEO_" + usuarioId,
                        "GEOFENCE_EXIT",
                        String.format("📍 %s está fuera del área de %s (distancia: %dm, radio: %dm)",
                                usuario.getNombreCompleto(), sucursal.getNombre(),
                                Math.round(distancia), radio),
                        Map.of("usuario", usuario.getNombreCompleto(),
                                "sucursal", sucursal.getNombre(),
                                "distancia", Math.round(distancia)));
            }
        }

        return Map.of("status", "ok");
    }

    /**
     * Obtiene la última ubicación de cada usuario (mapa en tiempo real).
     * Solo muestra usuarios activos en las últimas 2 horas.
     */
    public List<UbicacionTrackingDTO> getUbicacionesEnTiempoReal() {
        LocalDateTime desde = LocalDateTime.now().minusHours(2);
        return trackingRepository.findUltimaUbicacionPorUsuario(desde).stream()
                .map(UbicacionTrackingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Historial de ruta de un usuario en una fecha.
     */
    public List<UbicacionTrackingDTO> getHistorialRuta(Long usuarioId, LocalDate fecha) {
        LocalDateTime desde = fecha.atStartOfDay();
        LocalDateTime hasta = fecha.atTime(LocalTime.MAX);
        return trackingRepository
                .findByUsuarioIdAndFechaHoraBetweenOrderByFechaHoraAsc(usuarioId, desde, hasta)
                .stream()
                .map(UbicacionTrackingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Ruta de hoy de un usuario.
     */
    public List<UbicacionTrackingDTO> getRutaDeHoy(Long usuarioId) {
        return trackingRepository.findUbicacionesDeHoy(usuarioId).stream()
                .map(UbicacionTrackingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Resumen diario de tracking por usuario.
     */
    public List<Map<String, Object>> getResumenDiario(LocalDate fecha) {
        LocalDateTime desde = fecha.atStartOfDay();
        LocalDateTime hasta = fecha.atTime(LocalTime.MAX);
        List<UbicacionTracking> todos = trackingRepository
                .findAllByFechaHoraBetween(desde, hasta);

        // Agrupar por usuario
        Map<Long, List<UbicacionTracking>> porUsuario = todos.stream()
                .filter(t -> t.getUsuario() != null)
                .collect(Collectors.groupingBy(t -> t.getUsuario().getId()));

        List<Map<String, Object>> resumen = new java.util.ArrayList<>();
        for (Map.Entry<Long, List<UbicacionTracking>> entry : porUsuario.entrySet()) {
            List<UbicacionTracking> puntos = entry.getValue();
            if (puntos.isEmpty()) continue;

            UbicacionTracking primero = puntos.get(0);
            UbicacionTracking ultimo = puntos.get(puntos.size() - 1);

            // Calcular distancia total
            double distanciaTotal = 0;
            for (int i = 1; i < puntos.size(); i++) {
                distanciaTotal += calcularDistancia(
                        puntos.get(i - 1).getLatitud(), puntos.get(i - 1).getLongitud(),
                        puntos.get(i).getLatitud(), puntos.get(i).getLongitud());
            }

            // Batería mínima
            Integer bateriaMin = puntos.stream()
                    .map(UbicacionTracking::getBateria)
                    .filter(b -> b != null)
                    .min(Integer::compareTo)
                    .orElse(null);

            // Precisión promedio
            double precPromedio = puntos.stream()
                    .map(UbicacionTracking::getPrecisionGps)
                    .filter(p -> p != null)
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0);

            resumen.add(Map.of(
                    "usuarioId", entry.getKey(),
                    "nombreUsuario", primero.getUsuario().getNombreCompleto(),
                    "totalPuntos", puntos.size(),
                    "horaInicio", primero.getFechaHora().toString(),
                    "horaFin", ultimo.getFechaHora().toString(),
                    "distanciaKm", Math.round(distanciaTotal / 10.0) / 100.0,
                    "bateriaMin", bateriaMin != null ? bateriaMin : -1,
                    "precisionPromedio", Math.round(precPromedio)
            ));
        }

        resumen.sort((a, b) -> ((String) b.get("horaFin")).compareTo((String) a.get("horaFin")));
        return resumen;
    }
    /**
     * Envía una alerta solo si no se envió una similar en la última hora.
     * Evita spam de alertas repetitivas.
     */
    @SuppressWarnings("unchecked")
    private void enviarAlertaSiNoReciente(String cacheKey, String tipo, String mensaje, Map<String, ?> datos) {
        LocalDateTime ultimaAlerta = alertasEnviadas.get(cacheKey);
        if (ultimaAlerta != null && java.time.Duration.between(ultimaAlerta, LocalDateTime.now()).toMinutes() < 60) {
            return; // Ya se envió una alerta similar hace menos de 1 hora
        }
        alertasEnviadas.put(cacheKey, LocalDateTime.now());
        try {
            notificationService.sendAdminAlert(tipo, mensaje, (Map<String, Object>) datos);
        } catch (Exception e) {
            // Silencioso — no interrumpir el tracking por fallos de notificación
        }
    }

    /**
     * Calcula distancia Haversine en metros entre dos puntos GPS.
     */
    private double calcularDistancia(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
