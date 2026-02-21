package com.relojreducto.controller;

import com.relojreducto.service.AuditoriaService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Controller de auditoría — solo admin.
 */
@RestController
@RequestMapping("/api/admin/auditoria")
@PreAuthorize("hasRole('ADMIN')")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    /**
     * Obtener auditorías paginadas.
     * GET /api/admin/auditoria?page=0&size=50
     */
    @GetMapping
    public ResponseEntity<Page<Map<String, Object>>> getAuditorias(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(auditoriaService.getAuditoriasPaginadas(page, size));
    }

    /**
     * Auditorías por rango de fecha.
     * GET /api/admin/auditoria/rango?inicio=2024-01-01&fin=2024-01-31
     */
    @GetMapping("/rango")
    public ResponseEntity<List<Map<String, Object>>> getByRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return ResponseEntity.ok(auditoriaService.getByRango(
                inicio.atStartOfDay(), fin.plusDays(1).atStartOfDay()));
    }

    /**
     * Auditorías de un usuario.
     * GET /api/admin/auditoria/usuario/{id}
     */
    @GetMapping("/usuario/{id}")
    public ResponseEntity<List<Map<String, Object>>> getByUsuario(@PathVariable Long id) {
        return ResponseEntity.ok(auditoriaService.getByUsuario(id));
    }

    /**
     * Estadísticas de auditoría.
     * GET /api/admin/auditoria/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(auditoriaService.getEstadisticas());
    }
}
