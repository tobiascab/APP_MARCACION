package com.relojreducto.controller;

import com.relojreducto.service.JustificacionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller de justificaciones.
 * - Empleados: crean justificaciones y ven las suyas
 * - Admins: ven todas, aprueban/rechazan
 */
@RestController
@RequestMapping("/api/justificaciones")
public class JustificacionController {

    private final JustificacionService justificacionService;

    public JustificacionController(JustificacionService justificacionService) {
        this.justificacionService = justificacionService;
    }

    // ========== EMPLEADO ==========

    /**
     * Crear justificación (empleado).
     * POST /api/justificaciones
     */
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, String> payload) {
        try {
            String tipo = payload.get("tipo");
            LocalDate fecha = LocalDate.parse(payload.get("fecha"));
            String motivo = payload.get("motivo");
            String evidencia = payload.get("evidenciaUrl");

            Map<String, Object> result = justificacionService.crear(tipo, fecha, motivo, evidencia);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mis justificaciones (empleado).
     * GET /api/justificaciones/mis
     */
    @GetMapping("/mis")
    public ResponseEntity<List<Map<String, Object>>> getMisJustificaciones() {
        return ResponseEntity.ok(justificacionService.getMisJustificaciones());
    }

    // ========== ADMIN ==========

    /**
     * Todas las justificaciones.
     * GET /api/justificaciones/admin/todas
     */
    @GetMapping("/admin/todas")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<List<Map<String, Object>>> getTodas() {
        return ResponseEntity.ok(justificacionService.getTodas());
    }

    /**
     * Justificaciones pendientes.
     * GET /api/justificaciones/admin/pendientes
     */
    @GetMapping("/admin/pendientes")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<List<Map<String, Object>>> getPendientes() {
        return ResponseEntity.ok(justificacionService.getPendientes());
    }

    /**
     * Contar pendientes (para badge de notificación).
     * GET /api/justificaciones/admin/pendientes/count
     */
    @GetMapping("/admin/pendientes/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<Map<String, Long>> contarPendientes() {
        return ResponseEntity.ok(Map.of("count", justificacionService.contarPendientes()));
    }

    /**
     * Aprobar o rechazar una justificación.
     * PUT /api/justificaciones/admin/{id}/revisar
     */
    @PutMapping("/admin/{id}/revisar")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<?> revisar(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String decision = payload.get("decision"); // APROBAR o RECHAZAR
            String comentario = payload.get("comentario");
            Map<String, Object> result = justificacionService.revisar(id, decision, comentario);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
