package com.relojreducto.dto;

import com.relojreducto.entity.UbicacionTracking;
import java.time.LocalDateTime;

/**
 * DTO para ubicaciones de tracking (admin).
 */
public class UbicacionTrackingDTO {

    private Long id;
    private LocalDateTime fechaHora;
    private Double latitud;
    private Double longitud;
    private Double precisionGps;
    private Double velocidad;
    private Integer bateria;
    private Long usuarioId;
    private String nombreUsuario;
    private String fotoPerfilUsuario;

    public UbicacionTrackingDTO() {
    }

    public static UbicacionTrackingDTO fromEntity(UbicacionTracking entity) {
        UbicacionTrackingDTO dto = new UbicacionTrackingDTO();
        dto.setId(entity.getId());
        dto.setFechaHora(entity.getFechaHora());
        dto.setLatitud(entity.getLatitud());
        dto.setLongitud(entity.getLongitud());
        dto.setPrecisionGps(entity.getPrecisionGps());
        dto.setVelocidad(entity.getVelocidad());
        dto.setBateria(entity.getBateria());
        if (entity.getUsuario() != null) {
            dto.setUsuarioId(entity.getUsuario().getId());
            dto.setNombreUsuario(entity.getUsuario().getNombreCompleto());
            dto.setFotoPerfilUsuario(entity.getUsuario().getFotoPerfil());
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

    public String getFotoPerfilUsuario() {
        return fotoPerfilUsuario;
    }

    public void setFotoPerfilUsuario(String fotoPerfilUsuario) {
        this.fotoPerfilUsuario = fotoPerfilUsuario;
    }
}
