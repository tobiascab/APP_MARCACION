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
 * - Admins pueden ver mapa en tiempo real, historial de rutas, exportar KML
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

    /**
     * Exportar ruta como KML (Google Earth).
     * GET /api/tracking/admin/ruta/{usuarioId}/exportar?fecha=2026-02-28
     */
    @GetMapping("/admin/ruta/{usuarioId}/exportar")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<String> exportarRutaKml(
            @PathVariable Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        List<UbicacionTrackingDTO> ruta = (fecha != null)
                ? trackingService.getHistorialRuta(usuarioId, fecha)
                : trackingService.getRutaDeHoy(usuarioId);

        if (ruta.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        String nombreUsuario = ruta.get(0).getNombreUsuario() != null
                ? ruta.get(0).getNombreUsuario() : "Usuario_" + usuarioId;
        String fechaStr = fecha != null ? fecha.toString() : LocalDate.now().toString();

        StringBuilder kml = new StringBuilder();
        kml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        kml.append("<kml xmlns=\"http://www.opengis.net/kml/2.2\">\n");
        kml.append("<Document>\n");
        kml.append("  <name>Ruta de ").append(nombreUsuario).append(" - ").append(fechaStr).append("</name>\n");
        kml.append("  <description>Tracking GPS - RelojReducto</description>\n");
        kml.append("  <Style id=\"ruta\"><LineStyle><color>ff0000ff</color><width>3</width></LineStyle></Style>\n");
        kml.append("  <Style id=\"punto\"><IconStyle><scale>0.5</scale></IconStyle></Style>\n");

        // Línea de ruta
        kml.append("  <Placemark>\n");
        kml.append("    <name>Recorrido</name>\n");
        kml.append("    <styleUrl>#ruta</styleUrl>\n");
        kml.append("    <LineString>\n");
        kml.append("      <coordinates>\n");
        for (UbicacionTrackingDTO p : ruta) {
            kml.append("        ").append(p.getLongitud()).append(",").append(p.getLatitud()).append(",0\n");
        }
        kml.append("      </coordinates>\n");
        kml.append("    </LineString>\n");
        kml.append("  </Placemark>\n");

        // Puntos individuales
        for (int i = 0; i < ruta.size(); i++) {
            UbicacionTrackingDTO p = ruta.get(i);
            String label = i == 0 ? "INICIO" : (i == ruta.size() - 1 ? "FIN" : "Punto " + i);
            kml.append("  <Placemark>\n");
            kml.append("    <name>").append(label).append(" - ").append(p.getFechaHora().toLocalTime()).append("</name>\n");
            kml.append("    <description>");
            if (p.getBateria() != null) kml.append("Bateria: ").append(p.getBateria()).append("% ");
            if (p.getPrecisionGps() != null) kml.append("Precision: ").append(Math.round(p.getPrecisionGps())).append("m");
            kml.append("</description>\n");
            kml.append("    <styleUrl>#punto</styleUrl>\n");
            kml.append("    <Point><coordinates>").append(p.getLongitud()).append(",").append(p.getLatitud()).append(",0</coordinates></Point>\n");
            kml.append("  </Placemark>\n");
        }

        kml.append("</Document>\n</kml>");

        String filename = "ruta_" + nombreUsuario.replace(" ", "_") + "_" + fechaStr + ".kml";
        return ResponseEntity.ok()
                .header("Content-Type", "application/vnd.google-earth.kml+xml")
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(kml.toString());
    }

    /**
     * Resumen diario de todos los usuarios con tracking.
     * GET /api/tracking/admin/resumen?fecha=2026-02-28
     */
    @GetMapping("/admin/resumen")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<?> getResumenDiario(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        if (fecha == null) fecha = LocalDate.now();
        return ResponseEntity.ok(trackingService.getResumenDiario(fecha));
    }

    // ===================== HELPERS =====================

    private Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try { return Double.parseDouble(value.toString()); } catch (Exception e) { return null; }
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).intValue();
        try { return Integer.parseInt(value.toString()); } catch (Exception e) { return null; }
    }

    private Long getUsuarioIdActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return usuario.getId();
    }
}
