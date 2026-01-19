package com.relojreducto.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Size;

public class MarcacionRequest {

    @NotNull(message = "La latitud es requerida")
    @DecimalMin(value = "-90.0", message = "La latitud debe ser mayor o igual a -90")
    @DecimalMax(value = "90.0", message = "La latitud debe ser menor o igual a 90")
    private Double latitud;

    @NotNull(message = "La longitud es requerida")
    @DecimalMin(value = "-180.0", message = "La longitud debe ser mayor o igual a -180")
    @DecimalMax(value = "180.0", message = "La longitud debe ser menor o igual a 180")
    private Double longitud;

    @Size(max = 255, message = "La dirección no puede exceder los 255 caracteres")
    private String direccion;

    @Size(max = 100, message = "El dispositivo no puede exceder los 100 caracteres")
    private String dispositivo;

    @Size(max = 500, message = "La observación no puede exceder los 500 caracteres")
    private String observacion;
    private Double accuracy; // Precisión del GPS
    private Boolean isMocked; // Indicador de ubicación falsa (si el dispositivo lo reporta)

    public MarcacionRequest() {
    }

    public MarcacionRequest(Double latitud, Double longitud, String direccion, String dispositivo, String observacion) {
        this.latitud = latitud;
        this.longitud = longitud;
        this.direccion = direccion;
        this.dispositivo = dispositivo;
        this.observacion = observacion;
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

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getDispositivo() {
        return dispositivo;
    }

    public void setDispositivo(String dispositivo) {
        this.dispositivo = dispositivo;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public Boolean getIsMocked() {
        return isMocked;
    }

    public void setIsMocked(Boolean isMocked) {
        this.isMocked = isMocked;
    }
}
