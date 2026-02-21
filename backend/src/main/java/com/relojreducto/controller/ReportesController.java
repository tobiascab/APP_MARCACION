package com.relojreducto.controller;

import com.relojreducto.scheduler.ReporteAsistenciaScheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoint para disparar manualmente el reporte de asistencia.
 * Solo accesible por admins.
 */
@RestController
@RequestMapping("/api/admin/reportes")
public class ReportesController {

    @Autowired
    private ReporteAsistenciaScheduler reporteScheduler;

    /**
     * Dispara manualmente el reporte diario de asistencia.
     * Envía las notificaciones a todos los admins conectados.
     */
    @PostMapping("/asistencia-hoy")
    public ResponseEntity<?> generarReporteManual() {
        try {
            reporteScheduler.generarReporteDiario();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Reporte de asistencia generado y enviado a los administradores"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }
}
