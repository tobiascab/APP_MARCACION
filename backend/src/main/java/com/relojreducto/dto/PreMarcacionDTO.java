package com.relojreducto.dto;

import com.relojreducto.entity.PreMarcacion;
import java.time.LocalDateTime;

/**
 * DTO para pre-marcaciones (solo visible para admin).
 */
public class PreMarcacionDTO {

    private Long id;
    private LocalDateTime fechaHoraDeteccion;
    private Double latitud;
    private Double longitud;
    private Double distanciaMetros;
    private Double precisionGps;
    private Long usuarioId;
    private String nombreUsuario;
    private Long sucursalId;
    private String nombreSucursal;

    public PreMarcacionDTO() {
    }

    public static PreMarcacionDTO fromEntity(PreMarcacion entity) {
        PreMarcacionDTO dto = new PreMarcacionDTO();
        dto.setId(entity.getId());
        dto.setFechaHoraDeteccion(entity.getFechaHoraDeteccion());
        dto.setLatitud(entity.getLatitud());
        dto.setLongitud(entity.getLongitud());
        dto.setDistanciaMetros(entity.getDistanciaMetros());
        dto.setPrecisionGps(entity.getPrecisionGps());
        if (entity.getUsuario() != null) {
            dto.setUsuarioId(entity.getUsuario().getId());
            dto.setNombreUsuario(entity.getUsuario().getNombreCompleto());
        }
        if (entity.getSucursal() != null) {
            dto.setSucursalId(entity.getSucursal().getId());
            dto.setNombreSucursal(entity.getSucursal().getNombre());
        }
        return dto;
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

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public void setNombreUsuario(String nombreUsuario) {
        this.nombreUsuario = nombreUsuario;
    }

    public Long getSucursalId() {
        return sucursalId;
    }

    public void setSucursalId(Long sucursalId) {
        this.sucursalId = sucursalId;
    }

    public String getNombreSucursal() {
        return nombreSucursal;
    }

    public void setNombreSucursal(String nombreSucursal) {
        this.nombreSucursal = nombreSucursal;
    }
}
