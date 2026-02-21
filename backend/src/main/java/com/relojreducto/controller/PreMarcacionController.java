package com.relojreducto.controller;

import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UsuarioRepository;
import com.relojreducto.service.PreMarcacionService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller para pre-marcaciones automáticas por geofence.
 * El endpoint de check-in es llamado silenciosamente desde el frontend
 * cuando el empleado abre la app. No retorna nada visible para el usuario.
 */
@RestController
@RequestMapping("/api/premarcacion")
public class PreMarcacionController {

    private final PreMarcacionService preMarcacionService;
    private final UsuarioRepository usuarioRepository;

    public PreMarcacionController(PreMarcacionService preMarcacionService,
            UsuarioRepository usuarioRepository) {
        this.preMarcacionService = preMarcacionService;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Check-in silencioso de ubicación.
     * El frontend envía la ubicación periódicamente y este endpoint
     * verifica si el empleado está dentro del geofence.
     * 
     * POST /api/premarcacion/checkin
     */
    @PostMapping("/checkin")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, Object> payload) {
        try {
            Long usuarioId = getUsuarioIdActual();

            Double latitud = toDouble(payload.get("latitud"));
            Double longitud = toDouble(payload.get("longitud"));
            Double accuracy = toDouble(payload.get("accuracy"));

            if (latitud == null || longitud == null) {
                return ResponseEntity.ok(Map.of("status", "sin_ubicacion"));
            }

            Map<String, Object> resultado = preMarcacionService.procesarCheckIn(
                    usuarioId, latitud, longitud, accuracy);

            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            // Silencioso — no mostramos error al usuario
            return ResponseEntity.ok(Map.of("status", "error"));
        }
    }

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

    private Long getUsuarioIdActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return usuario.getId();
    }
}
