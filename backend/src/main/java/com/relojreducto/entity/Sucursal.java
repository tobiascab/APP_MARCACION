package com.relojreducto.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sucursales")
public class Sucursal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 255)
    private String direccion;

    private Double latitud;
    private Double longitud;

    @Column(name = "radio_geocerca")
    private Integer radioGeocerca = 200; // Radio en metros por defecto

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @OneToMany(mappedBy = "sucursal")
    private List<Usuario> usuarios;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
    }

    public Sucursal() {
    }

    public Sucursal(Long id, String nombre, String direccion, Double latitud, Double longitud, Integer radioGeocerca) {
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.radioGeocerca = radioGeocerca;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
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

    public Integer getRadioGeocerca() {
        return radioGeocerca;
    }

    public void setRadioGeocerca(Integer radioGeocerca) {
        this.radioGeocerca = radioGeocerca;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nombre;
        private String direccion;
        private Double latitud;
        private Double longitud;
        private Integer radioGeocerca = 200;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder nombre(String nombre) {
            this.nombre = nombre;
            return this;
        }

        public Builder direccion(String direccion) {
            this.direccion = direccion;
            return this;
        }

        public Builder latitud(Double latitud) {
            this.latitud = latitud;
            return this;
        }

        public Builder longitud(Double longitud) {
            this.longitud = longitud;
            return this;
        }

        public Builder radioGeocerca(Integer radioGeocerca) {
            this.radioGeocerca = radioGeocerca;
            return this;
        }

        public Sucursal build() {
            return new Sucursal(id, nombre, direccion, latitud, longitud, radioGeocerca);
        }
    }
}
