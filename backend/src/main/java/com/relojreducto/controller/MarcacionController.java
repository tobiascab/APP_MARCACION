package com.relojreducto.controller;

import com.relojreducto.dto.MarcacionDTO;
import com.relojreducto.dto.MarcacionRequest;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UsuarioRepository;
import com.relojreducto.service.MarcacionService;
import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller para gestión de marcaciones.
 */
@RestController
@RequestMapping("/api/marcaciones")
public class MarcacionController {

    private final MarcacionService marcacionService;
    private final UsuarioRepository usuarioRepository;

    public MarcacionController(MarcacionService marcacionService, UsuarioRepository usuarioRepository) {
        this.marcacionService = marcacionService;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Registra una nueva marcación.
     * POST /api/marcaciones
     */
    @PostMapping
    public ResponseEntity<?> registrarMarcacion(@Valid @RequestBody MarcacionRequest request) {
        try {
            Long usuarioId = getUsuarioIdActual();
            MarcacionDTO marcacion = marcacionService.registrarMarcacion(usuarioId, request);
            return ResponseEntity.ok(Map.of(
                    "message", "Marcación registrada exitosamente",
                    "marcacion", marcacion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al registrar marcación",
                    "message",
                    e.getMessage().contains("radio") || e.getMessage().contains("GPS")
                            || e.getMessage().contains("Mock") ? e.getMessage()
                                    : "No se pudo registrar la marcación."));
        }
    }

    /**
     * Obtiene el estado actual con información de horarios.
     * GET /api/marcaciones/estado
     */
    @GetMapping("/estado")
    public ResponseEntity<?> getEstadoActual() {
        try {
            Long usuarioId = getUsuarioIdActual();
            Map<String, Object> info = marcacionService.getInfoHorario(usuarioId);
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al obtener estado",
                    "message", "Inténtelo de nuevo más tarde."));
        }
    }

    /**
     * Obtiene las marcaciones del día actual.
     * GET /api/marcaciones/hoy
     */
    @GetMapping("/hoy")
    public ResponseEntity<?> getMarcacionesDeHoy() {
        try {
            Long usuarioId = getUsuarioIdActual();
            List<MarcacionDTO> marcaciones = marcacionService.getMarcacionesDeHoy(usuarioId);
            return ResponseEntity.ok(marcaciones);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al obtener marcaciones",
                    "message", e.getMessage()));
        }
    }

    /**
     * Obtiene el historial de marcaciones del usuario.
     * GET /api/marcaciones/historial
     */
    @GetMapping("/historial")
    public ResponseEntity<?> getHistorial() {
        try {
            Long usuarioId = getUsuarioIdActual();
            List<MarcacionDTO> marcaciones = marcacionService.getMarcacionesByUsuario(usuarioId);
            return ResponseEntity.ok(marcaciones);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al obtener historial",
                    "message", "No se pudo cargar el historial."));
        }
    }

    /**
     * Obtiene marcaciones por rango de fechas.
     * GET /api/marcaciones/rango?inicio=2024-01-01&fin=2024-01-31
     */
    @GetMapping("/rango")
    public ResponseEntity<?> getMarcacionesByRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        try {
            Long usuarioId = getUsuarioIdActual();
            List<MarcacionDTO> marcaciones = marcacionService.getMarcacionesByUsuarioAndRango(usuarioId, inicio, fin);
            return ResponseEntity.ok(marcaciones);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al obtener marcaciones",
                    "message", e.getMessage()));
        }
    }

    /**
     * Obtiene la última marcación del usuario.
     * GET /api/marcaciones/ultima
     */
    @GetMapping("/ultima")
    public ResponseEntity<?> getUltimaMarcacion() {
        try {
            Long usuarioId = getUsuarioIdActual();
            return marcacionService.getUltimaMarcacion(usuarioId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.noContent().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al obtener última marcación",
                    "message", e.getMessage()));
        }
    }

    /**
     * Sincronizar marcaciones guardadas offline.
     * POST /api/marcaciones/sync-offline
     * Recibe un array de marcaciones guardadas localmente y las procesa.
     */
    @PostMapping("/sync-offline")
    public ResponseEntity<?> syncOffline(@RequestBody List<MarcacionRequest> marcaciones) {
        try {
            Long usuarioId = getUsuarioIdActual();
            List<Map<String, Object>> resultados = new java.util.ArrayList<>();

            for (MarcacionRequest request : marcaciones) {
                try {
                    MarcacionDTO marcacion = marcacionService.registrarMarcacion(usuarioId, request);
                    resultados.add(Map.of("status", "ok", "marcacion", marcacion));
                } catch (Exception e) {
                    resultados.add(Map.of("status", "error", "message", e.getMessage()));
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Sincronización completada",
                    "total", marcaciones.size(),
                    "resultados", resultados));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error en sincronización offline",
                    "message", e.getMessage()));
        }
    }

    /**
     * Obtiene el ID del usuario autenticado actualmente.
     */
    private Long getUsuarioIdActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return usuario.getId();
    }
}
