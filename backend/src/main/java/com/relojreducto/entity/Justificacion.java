package com.relojreducto.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Justificación de tardanza o ausencia.
 * El empleado puede justificar y el admin aprueba/rechaza.
 */
@Entity
@Table(name = "justificaciones", indexes = {
        @Index(name = "idx_justif_usuario", columnList = "usuario_id"),
        @Index(name = "idx_justif_fecha", columnList = "fecha"),
        @Index(name = "idx_justif_estado", columnList = "estado")
})
public class Justificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private TipoJustificacion tipo; // TARDANZA, AUSENCIA, SALIDA_TEMPRANA

    @Column(nullable = false, length = 500)
    private String motivo;

    @Column(length = 500)
    private String evidenciaUrl; // URL de la foto/documento adjunto

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private EstadoJustificacion estado = EstadoJustificacion.PENDIENTE;

    @Column(length = 300)
    private String comentarioAdmin; // Comentario del admin al aprobar/rechazar

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revisado_por")
    private Usuario revisadoPor;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null)
            fechaCreacion = LocalDateTime.now();
    }

    public enum TipoJustificacion {
        TARDANZA, AUSENCIA, SALIDA_TEMPRANA
    }

    public enum EstadoJustificacion {
        PENDIENTE, APROBADA, RECHAZADA
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public TipoJustificacion getTipo() {
        return tipo;
    }

    public void setTipo(TipoJustificacion tipo) {
        this.tipo = tipo;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getEvidenciaUrl() {
        return evidenciaUrl;
    }

    public void setEvidenciaUrl(String evidenciaUrl) {
        this.evidenciaUrl = evidenciaUrl;
    }

    public EstadoJustificacion getEstado() {
        return estado;
    }

    public void setEstado(EstadoJustificacion estado) {
        this.estado = estado;
    }

    public String getComentarioAdmin() {
        return comentarioAdmin;
    }

    public void setComentarioAdmin(String comentarioAdmin) {
        this.comentarioAdmin = comentarioAdmin;
    }

    public Usuario getRevisadoPor() {
        return revisadoPor;
    }

    public void setRevisadoPor(Usuario revisadoPor) {
        this.revisadoPor = revisadoPor;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaRevision() {
        return fechaRevision;
    }

    public void setFechaRevision(LocalDateTime fechaRevision) {
        this.fechaRevision = fechaRevision;
    }
}
