package com.relojreducto.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "permisos")
public class Permiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPermiso tipo;

    @Column(nullable = false)
    private LocalDateTime fechaInicio;

    @Column(nullable = false)
    private LocalDateTime fechaFin;

    @Column(length = 500)
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPermiso estado = EstadoPermiso.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprobado_por_id")
    private Usuario aprobadoPor;

    private String comentarioAprobacion;

    private LocalDateTime fechaSolicitud;

    private LocalDateTime fechaResolucion;

    @PrePersist
    protected void onCreate() {
        fechaSolicitud = LocalDateTime.now();
    }

    // Enums
    public enum TipoPermiso {
        VACACION,
        LICENCIA_MEDICA,
        PERMISO_PERSONAL,
        CAPACITACION,
        DUELO,
        MATERNIDAD,
        PATERNIDAD,
        OTRO
    }

    public enum EstadoPermiso {
        PENDIENTE,
        APROBADO,
        RECHAZADO
    }

    // Constructors
    public Permiso() {
    }

    // Getters and Setters
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

    public TipoPermiso getTipo() {
        return tipo;
    }

    public void setTipo(TipoPermiso tipo) {
        this.tipo = tipo;
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDateTime fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDateTime getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDateTime fechaFin) {
        this.fechaFin = fechaFin;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public EstadoPermiso getEstado() {
        return estado;
    }

    public void setEstado(EstadoPermiso estado) {
        this.estado = estado;
    }

    public Usuario getAprobadoPor() {
        return aprobadoPor;
    }

    public void setAprobadoPor(Usuario aprobadoPor) {
        this.aprobadoPor = aprobadoPor;
    }

    public String getComentarioAprobacion() {
        return comentarioAprobacion;
    }

    public void setComentarioAprobacion(String comentarioAprobacion) {
        this.comentarioAprobacion = comentarioAprobacion;
    }

    public LocalDateTime getFechaSolicitud() {
        return fechaSolicitud;
    }

    public void setFechaSolicitud(LocalDateTime fechaSolicitud) {
        this.fechaSolicitud = fechaSolicitud;
    }

    public LocalDateTime getFechaResolucion() {
        return fechaResolucion;
    }

    public void setFechaResolucion(LocalDateTime fechaResolucion) {
        this.fechaResolucion = fechaResolucion;
    }
}
