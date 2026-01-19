package com.relojreducto.dto;

import com.relojreducto.entity.Permiso;
import com.relojreducto.entity.Permiso.TipoPermiso;
import com.relojreducto.entity.Permiso.EstadoPermiso;
import java.time.LocalDateTime;

public class PermisoDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private TipoPermiso tipo;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private String motivo;
    private EstadoPermiso estado;
    private Long aprobadoPorId;
    private String aprobadoPorNombre;
    private String comentarioAprobacion;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaResolucion;

    public PermisoDTO() {
    }

    public static PermisoDTO fromEntity(Permiso permiso) {
        PermisoDTO dto = new PermisoDTO();
        dto.setId(permiso.getId());
        dto.setUsuarioId(permiso.getUsuario().getId());
        dto.setUsuarioNombre(permiso.getUsuario().getNombreCompleto());
        dto.setTipo(permiso.getTipo());
        dto.setFechaInicio(permiso.getFechaInicio());
        dto.setFechaFin(permiso.getFechaFin());
        dto.setMotivo(permiso.getMotivo());
        dto.setEstado(permiso.getEstado());
        if (permiso.getAprobadoPor() != null) {
            dto.setAprobadoPorId(permiso.getAprobadoPor().getId());
            dto.setAprobadoPorNombre(permiso.getAprobadoPor().getNombreCompleto());
        }
        dto.setComentarioAprobacion(permiso.getComentarioAprobacion());
        dto.setFechaSolicitud(permiso.getFechaSolicitud());
        dto.setFechaResolucion(permiso.getFechaResolucion());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getUsuarioNombre() {
        return usuarioNombre;
    }

    public void setUsuarioNombre(String usuarioNombre) {
        this.usuarioNombre = usuarioNombre;
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

    public Long getAprobadoPorId() {
        return aprobadoPorId;
    }

    public void setAprobadoPorId(Long aprobadoPorId) {
        this.aprobadoPorId = aprobadoPorId;
    }

    public String getAprobadoPorNombre() {
        return aprobadoPorNombre;
    }

    public void setAprobadoPorNombre(String aprobadoPorNombre) {
        this.aprobadoPorNombre = aprobadoPorNombre;
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
