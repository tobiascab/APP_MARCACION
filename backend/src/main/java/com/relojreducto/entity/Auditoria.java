package com.relojreducto.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Registro de auditoría para todas las acciones administrativas.
 * Cumplimiento regulatorio para entidades bancarias.
 */
@Entity
@Table(name = "auditoria", indexes = {
        @Index(name = "idx_audit_fecha", columnList = "fecha_hora"),
        @Index(name = "idx_audit_usuario", columnList = "usuario_id"),
        @Index(name = "idx_audit_tipo", columnList = "tipo_accion")
})
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tipo_accion", nullable = false, length = 50)
    private String tipoAccion; // CREAR, MODIFICAR, ELIMINAR, LOGIN, RESET, APROBAR, RECHAZAR

    @Column(name = "entidad", length = 50)
    private String entidad; // USUARIO, MARCACION, TURNO, PERMISO, SUCURSAL, etc.

    @Column(name = "entidad_id")
    private Long entidadId;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @Column(name = "datos_anteriores", columnDefinition = "TEXT")
    private String datosAnteriores; // JSON del estado anterior

    @Column(name = "datos_nuevos", columnDefinition = "TEXT")
    private String datosNuevos; // JSON del estado nuevo

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @PrePersist
    protected void onCreate() {
        if (fechaHora == null)
            fechaHora = LocalDateTime.now();
    }

    public Auditoria() {
    }

    // Builder estático para facilitar la creación
    public static Auditoria crear(String tipoAccion, String entidad, Long entidadId,
            String descripcion, Usuario usuario) {
        Auditoria a = new Auditoria();
        a.setTipoAccion(tipoAccion);
        a.setEntidad(entidad);
        a.setEntidadId(entidadId);
        a.setDescripcion(descripcion);
        a.setUsuario(usuario);
        a.setFechaHora(LocalDateTime.now());
        return a;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipoAccion() {
        return tipoAccion;
    }

    public void setTipoAccion(String tipoAccion) {
        this.tipoAccion = tipoAccion;
    }

    public String getEntidad() {
        return entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    public Long getEntidadId() {
        return entidadId;
    }

    public void setEntidadId(Long entidadId) {
        this.entidadId = entidadId;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDatosAnteriores() {
        return datosAnteriores;
    }

    public void setDatosAnteriores(String datosAnteriores) {
        this.datosAnteriores = datosAnteriores;
    }

    public String getDatosNuevos() {
        return datosNuevos;
    }

    public void setDatosNuevos(String datosNuevos) {
        this.datosNuevos = datosNuevos;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
