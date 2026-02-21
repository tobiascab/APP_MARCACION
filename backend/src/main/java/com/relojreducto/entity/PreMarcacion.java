package com.relojreducto.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Pre-marcación automática por geofence.
 * Registra el momento exacto en que un empleado entra al rango de la sucursal.
 * Solo visible para administradores.
 */
@Entity
@Table(name = "pre_marcaciones")
public class PreMarcacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha_hora_deteccion", nullable = false)
    private LocalDateTime fechaHoraDeteccion;

    @Column(name = "latitud")
    private Double latitud;

    @Column(name = "longitud")
    private Double longitud;

    @Column(name = "distancia_metros")
    private Double distanciaMetros;

    @Column(name = "precision_gps")
    private Double precisionGps;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id")
    private Sucursal sucursal;

    @PrePersist
    protected void onCreate() {
        if (fechaHoraDeteccion == null) {
            fechaHoraDeteccion = LocalDateTime.now();
        }
    }

    public PreMarcacion() {
    }

    public PreMarcacion(Long id, LocalDateTime fechaHoraDeteccion, Double latitud, Double longitud,
            Double distanciaMetros, Double precisionGps, Usuario usuario, Sucursal sucursal) {
        this.id = id;
        this.fechaHoraDeteccion = fechaHoraDeteccion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.distanciaMetros = distanciaMetros;
        this.precisionGps = precisionGps;
        this.usuario = usuario;
        this.sucursal = sucursal;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getFechaHoraDeteccion() {
        return fechaHoraDeteccion;
    }

    public void setFechaHoraDeteccion(LocalDateTime fechaHoraDeteccion) {
        this.fechaHoraDeteccion = fechaHoraDeteccion;
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

    public Double getDistanciaMetros() {
        return distanciaMetros;
    }

    public void setDistanciaMetros(Double distanciaMetros) {
        this.distanciaMetros = distanciaMetros;
    }

    public Double getPrecisionGps() {
        return precisionGps;
    }

    public void setPrecisionGps(Double precisionGps) {
        this.precisionGps = precisionGps;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Sucursal getSucursal() {
        return sucursal;
    }

    public void setSucursal(Sucursal sucursal) {
        this.sucursal = sucursal;
    }
}
