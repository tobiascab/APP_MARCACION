package com.relojreducto.controller;

import com.relojreducto.dto.UbicacionTrackingDTO;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UsuarioRepository;
import com.relojreducto.service.UbicacionTrackingService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller para tracking de ubicaciones.
 * - Empleados envían su ubicación periódicamente (silencioso)
 * - Admins pueden ver mapa en tiempo real e historial de rutas
 */
@RestController
@RequestMapping("/api/tracking")
public class UbicacionTrackingController {

    private final UbicacionTrackingService trackingService;
    private final UsuarioRepository usuarioRepository;

    public UbicacionTrackingController(UbicacionTrackingService trackingService,
            UsuarioRepository usuarioRepository) {
        this.trackingService = trackingService;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Registra una ubicación del empleado (silencioso).
     * POST /api/tracking/ubicacion
     */
    @PostMapping("/ubicacion")
    public ResponseEntity<?> registrarUbicacion(@RequestBody Map<String, Object> payload) {
        try {
            Long usuarioId = getUsuarioIdActual();

            Double latitud = toDouble(payload.get("latitud"));
            Double longitud = toDouble(payload.get("longitud"));
            Double accuracy = toDouble(payload.get("accuracy"));
            Double velocidad = toDouble(payload.get("velocidad"));
            Integer bateria = toInteger(payload.get("bateria"));

            if (latitud == null || longitud == null) {
                return ResponseEntity.ok(Map.of("status", "sin_ubicacion"));
            }

            Map<String, Object> result = trackingService.registrarUbicacion(
                    usuarioId, latitud, longitud, accuracy, velocidad, bateria);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("status", "error"));
        }
    }

    // ===================== ADMIN ENDPOINTS =====================

    /**
     * Mapa en tiempo real: última ubicación de cada usuario activo.
     * GET /api/tracking/admin/tiempo-real
     */
    @GetMapping("/admin/tiempo-real")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<List<UbicacionTrackingDTO>> getTiempoReal() {
        return ResponseEntity.ok(trackingService.getUbicacionesEnTiempoReal());
    }

    /**
     * Historial de ruta de un usuario en una fecha.
     * GET /api/tracking/admin/ruta/{usuarioId}?fecha=2024-01-15
     */
    @GetMapping("/admin/ruta/{usuarioId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<List<UbicacionTrackingDTO>> getHistorialRuta(
            @PathVariable Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        if (fecha == null) {
            return ResponseEntity.ok(trackingService.getRutaDeHoy(usuarioId));
        }
        return ResponseEntity.ok(trackingService.getHistorialRuta(usuarioId, fecha));
    }

    // ===================== HELPERS =====================

    private Double toDouble(Object value) {
        if (value == null)
            return null;
        if (value instanceof Number)
            return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private Integer toInteger(Object value) {
        if (value == null)
            return null;
        if (value instanceof Number)
            return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private Long getUsuarioIdActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return usuario.getId();
    }
}
