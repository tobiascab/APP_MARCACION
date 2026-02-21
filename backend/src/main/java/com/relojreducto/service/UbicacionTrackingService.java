package com.relojreducto.service;

import com.relojreducto.dto.UbicacionTrackingDTO;
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
import java.util.stream.Collectors;

/**
 * Servicio para tracking de ubicaciones de empleados.
 * Guarda posiciones GPS periódicamente para seguridad.
 */
@Service
public class UbicacionTrackingService {

    private final UbicacionTrackingRepository trackingRepository;
    private final UsuarioService usuarioService;

    // Máximo de registros por usuario por día (1 cada 2 min = ~300 en 10h)
    private static final long MAX_TRACKING_DIA = 500;

    public UbicacionTrackingService(UbicacionTrackingRepository trackingRepository,
            UsuarioService usuarioService) {
        this.trackingRepository = trackingRepository;
        this.usuarioService = usuarioService;
    }

    /**
     * Registra una ubicación del empleado.
     */
    @Transactional
    public Map<String, Object> registrarUbicacion(Long usuarioId, Double latitud, Double longitud,
            Double accuracy, Double velocidad, Integer bateria) {
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
}
