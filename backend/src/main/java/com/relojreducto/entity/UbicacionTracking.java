package com.relojreducto.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Registro de ubicaciones de empleados para rastreo de seguridad.
 * Guarda un historial periódico de las posiciones GPS cuando la app está
 * abierta.
 * Solo visible para administradores.
 */
@Entity
@Table(name = "ubicacion_tracking", indexes = {
        @Index(name = "idx_tracking_usuario_fecha", columnList = "usuario_id, fecha_hora"),
        @Index(name = "idx_tracking_fecha", columnList = "fecha_hora")
})
public class UbicacionTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "latitud", nullable = false)
    private Double latitud;

    @Column(name = "longitud", nullable = false)
    private Double longitud;

    @Column(name = "precision_gps")
    private Double precisionGps;

    @Column(name = "velocidad")
    private Double velocidad;

    @Column(name = "bateria")
    private Integer bateria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @PrePersist
    protected void onCreate() {
        if (fechaHora == null) {
            fechaHora = LocalDateTime.now();
        }
    }

    public UbicacionTracking() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }

    public Double getPrecisionGps() {
        return precisionGps;
    }

    public void setPrecisionGps(Double precisionGps) {
        this.precisionGps = precisionGps;
    }

    public Double getVelocidad() {
        return velocidad;
    }

    public void setVelocidad(Double velocidad) {
        this.velocidad = velocidad;
    }

    public Integer getBateria() {
        return bateria;
    }

    public void setBateria(Integer bateria) {
        this.bateria = bateria;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
