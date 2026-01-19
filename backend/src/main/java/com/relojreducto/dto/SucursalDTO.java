package com.relojreducto.dto;

import com.relojreducto.entity.Sucursal;
import jakarta.validation.constraints.*;

public class SucursalDTO {
    private Long id;

    @NotBlank(message = "El nombre de la sucursal es requerido")
    @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
    private String nombre;

    @NotBlank(message = "La dirección es requerida")
    @Size(max = 255, message = "La dirección no puede exceder los 255 caracteres")
    private String direccion;

    @NotNull(message = "La latitud es requerida")
    @DecimalMin(value = "-90.0", message = "La latitud debe ser mayor o igual a -90")
    @DecimalMax(value = "90.0", message = "La latitud debe ser menor o igual a 90")
    private Double latitud;

    @NotNull(message = "La longitud es requerida")
    @DecimalMin(value = "-180.0", message = "La longitud debe ser mayor o igual a -180")
    @DecimalMax(value = "180.0", message = "La longitud debe ser menor o igual a 180")
    private Double longitud;

    @NotNull(message = "El radio de geocerca es requerido")
    @Min(value = 10, message = "El radio mínimo es 10 metros")
    @Max(value = 5000, message = "El radio máximo es 5000 metros")
    private Integer radioGeocerca;

    public SucursalDTO() {
    }

    public SucursalDTO(Long id, String nombre, String direccion, Double latitud, Double longitud,
            Integer radioGeocerca) {
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.radioGeocerca = radioGeocerca;
    }

    public static SucursalDTO fromEntity(Sucursal sucursal) {
        if (sucursal == null)
            return null;
        return new SucursalDTO(
                sucursal.getId(),
                sucursal.getNombre(),
                sucursal.getDireccion(),
                sucursal.getLatitud(),
                sucursal.getLongitud(),
                sucursal.getRadioGeocerca());
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
}
