package com.relojreducto.dto;

import com.relojreducto.entity.Feriado;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FeriadoDTO {
    private Long id;
    private LocalDate fecha;
    private String descripcion;
    private Boolean esNacional;
    private Long sucursalId;
    private String sucursalNombre;
    private LocalDateTime fechaCreacion;

    public FeriadoDTO() {
    }

    public static FeriadoDTO fromEntity(Feriado feriado) {
        FeriadoDTO dto = new FeriadoDTO();
        dto.setId(feriado.getId());
        dto.setFecha(feriado.getFecha());
        dto.setDescripcion(feriado.getDescripcion());
        dto.setEsNacional(feriado.getEsNacional());
        if (feriado.getSucursal() != null) {
            dto.setSucursalId(feriado.getSucursal().getId());
            dto.setSucursalNombre(feriado.getSucursal().getNombre());
        }
        dto.setFechaCreacion(feriado.getFechaCreacion());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Boolean getEsNacional() {
        return esNacional;
    }

    public void setEsNacional(Boolean esNacional) {
        this.esNacional = esNacional;
    }

    public Long getSucursalId() {
        return sucursalId;
    }

    public void setSucursalId(Long sucursalId) {
        this.sucursalId = sucursalId;
    }

    public String getSucursalNombre() {
        return sucursalNombre;
    }

    public void setSucursalNombre(String sucursalNombre) {
        this.sucursalNombre = sucursalNombre;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}
