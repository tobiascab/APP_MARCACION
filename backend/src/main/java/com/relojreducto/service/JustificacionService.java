package com.relojreducto.service;

import com.relojreducto.entity.Justificacion;
import com.relojreducto.entity.Justificacion.EstadoJustificacion;
import com.relojreducto.entity.Justificacion.TipoJustificacion;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.JustificacionRepository;
import com.relojreducto.repository.UsuarioRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio de justificaciones de tardanza/ausencia.
 */
@Service
public class JustificacionService {

    private final JustificacionRepository justificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    public JustificacionService(JustificacionRepository justificacionRepository,
            UsuarioRepository usuarioRepository,
            AuditoriaService auditoriaService) {
        this.justificacionRepository = justificacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaService = auditoriaService;
    }

    /**
     * Crear una justificación (empleado).
     */
    public Map<String, Object> crear(String tipo, LocalDate fecha, String motivo, String evidenciaUrl) {
        Usuario usuario = getUsuarioActual();

        Justificacion j = new Justificacion();
        j.setUsuario(usuario);
        j.setFecha(fecha);
        j.setTipo(TipoJustificacion.valueOf(tipo.toUpperCase()));
        j.setMotivo(motivo);
        j.setEvidenciaUrl(evidenciaUrl);
        j.setEstado(EstadoJustificacion.PENDIENTE);

        justificacionRepository.save(j);

        auditoriaService.registrarSimple("CREAR", "JUSTIFICACION", j.getId(),
                "Justificación creada: " + tipo + " para " + fecha);

        return Map.of("status", "creada", "id", j.getId());
    }

    /**
     * Aprobar/Rechazar una justificación (admin).
     */
    public Map<String, Object> revisar(Long id, String decision, String comentario) {
        Justificacion j = justificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Justificación no encontrada"));

        Usuario admin = getUsuarioActual();

        EstadoJustificacion nuevoEstado = "APROBAR".equalsIgnoreCase(decision)
                ? EstadoJustificacion.APROBADA
                : EstadoJustificacion.RECHAZADA;

        j.setEstado(nuevoEstado);
        j.setComentarioAdmin(comentario);
        j.setRevisadoPor(admin);
        j.setFechaRevision(LocalDateTime.now());

        justificacionRepository.save(j);

        auditoriaService.registrarSimple(
                nuevoEstado == EstadoJustificacion.APROBADA ? "APROBAR" : "RECHAZAR",
                "JUSTIFICACION", j.getId(),
                "Justificación " + nuevoEstado + " para " + j.getUsuario().getNombreCompleto());

        return Map.of("status", nuevoEstado.name().toLowerCase(), "id", j.getId());
    }

    /**
     * Obtener justificaciones del empleado actual.
     */
    public List<Map<String, Object>> getMisJustificaciones() {
        Usuario usuario = getUsuarioActual();
        return justificacionRepository.findByUsuarioId(usuario.getId())
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    /**
     * Obtener todas las justificaciones (admin).
     */
    public List<Map<String, Object>> getTodas() {
        return justificacionRepository.findAllOrdered()
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    /**
     * Obtener justificaciones pendientes (admin).
     */
    public List<Map<String, Object>> getPendientes() {
        return justificacionRepository.findByEstado(EstadoJustificacion.PENDIENTE)
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    /**
     * Contar pendientes (para badge).
     */
    public long contarPendientes() {
        return justificacionRepository.contarPendientes();
    }

    private Map<String, Object> toMap(Justificacion j) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", j.getId());
        map.put("usuarioId", j.getUsuario().getId());
        map.put("nombreUsuario", j.getUsuario().getNombreCompleto());
        map.put("fecha", j.getFecha().toString());
        map.put("tipo", j.getTipo().name());
        map.put("motivo", j.getMotivo());
        map.put("evidenciaUrl", j.getEvidenciaUrl());
        map.put("estado", j.getEstado().name());
        map.put("comentarioAdmin", j.getComentarioAdmin());
        map.put("revisadoPor", j.getRevisadoPor() != null ? j.getRevisadoPor().getNombreCompleto() : null);
        map.put("fechaCreacion", j.getFechaCreacion() != null ? j.getFechaCreacion().toString() : null);
        map.put("fechaRevision", j.getFechaRevision() != null ? j.getFechaRevision().toString() : null);
        return map;
    }

    private Usuario getUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}
