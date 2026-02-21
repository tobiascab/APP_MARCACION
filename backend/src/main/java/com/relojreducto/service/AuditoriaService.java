package com.relojreducto.service;

import com.relojreducto.entity.Auditoria;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.AuditoriaRepository;
import com.relojreducto.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio de auditoría — registra todas las acciones administrativas.
 */
@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository,
            UsuarioRepository usuarioRepository) {
        this.auditoriaRepository = auditoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Registra una acción de auditoría.
     */
    public void registrar(String tipoAccion, String entidad, Long entidadId,
            String descripcion, String ipAddress, String userAgent) {
        try {
            Usuario usuario = getUsuarioActual();
            Auditoria audit = Auditoria.crear(tipoAccion, entidad, entidadId, descripcion, usuario);
            audit.setIpAddress(ipAddress);
            audit.setUserAgent(userAgent);
            auditoriaRepository.save(audit);
        } catch (Exception e) {
            // No fallar si la auditoría falla
            System.err.println("Error registrando auditoría: " + e.getMessage());
        }
    }

    /**
     * Registra con datos antes/después (para modificaciones).
     */
    public void registrarConDatos(String tipoAccion, String entidad, Long entidadId,
            String descripcion, String datosAnteriores, String datosNuevos) {
        try {
            Usuario usuario = getUsuarioActual();
            Auditoria audit = Auditoria.crear(tipoAccion, entidad, entidadId, descripcion, usuario);
            audit.setDatosAnteriores(datosAnteriores);
            audit.setDatosNuevos(datosNuevos);
            auditoriaRepository.save(audit);
        } catch (Exception e) {
            System.err.println("Error registrando auditoría: " + e.getMessage());
        }
    }

    /**
     * Registra una acción simple (sin request info).
     */
    public void registrarSimple(String tipoAccion, String entidad, Long entidadId, String descripcion) {
        registrar(tipoAccion, entidad, entidadId, descripcion, null, null);
    }

    /**
     * Obtener auditorías con paginación.
     */
    public Page<Map<String, Object>> getAuditoriasPaginadas(int page, int size) {
        Page<Auditoria> auditorias = auditoriaRepository.findAllByOrderByFechaHoraDesc(
                PageRequest.of(page, size));
        return auditorias.map(this::toMap);
    }

    /**
     * Obtener auditorías por rango de fecha.
     */
    public List<Map<String, Object>> getByRango(LocalDateTime inicio, LocalDateTime fin) {
        return auditoriaRepository.findByRango(inicio, fin).stream()
                .map(this::toMap).collect(Collectors.toList());
    }

    /**
     * Obtener auditorías por usuario.
     */
    public List<Map<String, Object>> getByUsuario(Long usuarioId) {
        return auditoriaRepository.findByUsuarioId(usuarioId).stream()
                .map(this::toMap).collect(Collectors.toList());
    }

    /**
     * Estadísticas de auditoría (últimos 30 días).
     */
    public Map<String, Long> getEstadisticas() {
        LocalDateTime desde = LocalDateTime.now().minusDays(30);
        List<Object[]> results = auditoriaRepository.contarPorTipo(desde);
        return results.stream().collect(
                Collectors.toMap(r -> (String) r[0], r -> (Long) r[1]));
    }

    private Map<String, Object> toMap(Auditoria a) {
        return Map.of(
                "id", a.getId(),
                "tipoAccion", a.getTipoAccion(),
                "entidad", a.getEntidad() != null ? a.getEntidad() : "",
                "entidadId", a.getEntidadId() != null ? a.getEntidadId() : 0,
                "descripcion", a.getDescripcion() != null ? a.getDescripcion() : "",
                "fechaHora", a.getFechaHora().toString(),
                "usuario", a.getUsuario() != null ? a.getUsuario().getNombreCompleto() : "Sistema",
                "ipAddress", a.getIpAddress() != null ? a.getIpAddress() : "");
    }

    private Usuario getUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null)
            return null;
        return usuarioRepository.findByUsername(auth.getName()).orElse(null);
    }
}
