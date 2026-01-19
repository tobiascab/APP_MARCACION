package com.relojreducto.dto;

import com.relojreducto.entity.Marcacion;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MarcacionDTO {
    private Long id;
    private LocalDateTime fechaHora;
    private String tipo;
    private Double latitud;
    private Double longitud;
    private String direccion;
    private String dispositivo;
    private Long usuarioId;
    private String usuarioNombre;

    // Campos de tardanza
    private Boolean esTardia;
    private Integer minutosTarde;
    private BigDecimal descuentoCalculado;

    public MarcacionDTO() {
    }

    public MarcacionDTO(Long id, LocalDateTime fechaHora, String tipo, Double latitud, Double longitud,
            String direccion, String dispositivo, Long usuarioId, String usuarioNombre, Boolean esTardia,
            Integer minutosTarde, BigDecimal descuentoCalculado) {
        this.id = id;
        this.fechaHora = fechaHora;
        this.tipo = tipo;
        this.latitud = latitud;
        this.longitud = longitud;
        this.direccion = direccion;
        this.dispositivo = dispositivo;
        this.usuarioId = usuarioId;
        this.usuarioNombre = usuarioNombre;
        this.esTardia = esTardia;
        this.minutosTarde = minutosTarde;
        this.descuentoCalculado = descuentoCalculado;
    }

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

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
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

    public Boolean getEsTardia() {
        return esTardia;
    }

    public void setEsTardia(Boolean esTardia) {
        this.esTardia = esTardia;
    }

    public Integer getMinutosTarde() {
        return minutosTarde;
    }

    public void setMinutosTarde(Integer minutosTarde) {
        this.minutosTarde = minutosTarde;
    }

    public BigDecimal getDescuentoCalculado() {
        return descuentoCalculado;
    }

    public void setDescuentoCalculado(BigDecimal descuentoCalculado) {
        this.descuentoCalculado = descuentoCalculado;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private LocalDateTime fechaHora;
        private String tipo;
        private Double latitud;
        private Double longitud;
        private String direccion;
        private String dispositivo;
        private Long usuarioId;
        private String usuarioNombre;
        private Boolean esTardia;
        private Integer minutosTarde;
        private BigDecimal descuentoCalculado;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder fechaHora(LocalDateTime fechaHora) {
            this.fechaHora = fechaHora;
            return this;
        }

        public Builder tipo(String tipo) {
            this.tipo = tipo;
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

        public Builder direccion(String direccion) {
            this.direccion = direccion;
            return this;
        }

        public Builder dispositivo(String dispositivo) {
            this.dispositivo = dispositivo;
            return this;
        }

        public Builder usuarioId(Long usuarioId) {
            this.usuarioId = usuarioId;
            return this;
        }

        public Builder usuarioNombre(String usuarioNombre) {
            this.usuarioNombre = usuarioNombre;
            return this;
        }

        public Builder esTardia(Boolean esTardia) {
            this.esTardia = esTardia;
            return this;
        }

        public Builder minutosTarde(Integer minutosTarde) {
            this.minutosTarde = minutosTarde;
            return this;
        }

        public Builder descuentoCalculado(BigDecimal descuentoCalculado) {
            this.descuentoCalculado = descuentoCalculado;
            return this;
        }

        public MarcacionDTO build() {
            return new MarcacionDTO(id, fechaHora, tipo, latitud, longitud, direccion, dispositivo, usuarioId,
                    usuarioNombre, esTardia, minutosTarde, descuentoCalculado);
        }
    }

    public static MarcacionDTO fromEntity(Marcacion marcacion) {
        return new Builder()
                .id(marcacion.getId())
                .fechaHora(marcacion.getFechaHora())
                .tipo(marcacion.getTipo().name())
                .latitud(marcacion.getLatitud())
                .longitud(marcacion.getLongitud())
                .direccion(marcacion.getDireccion())
                .dispositivo(marcacion.getDispositivo())
                .usuarioId(marcacion.getUsuario().getId())
                .usuarioNombre(marcacion.getUsuario().getNombreCompleto())
                .esTardia(marcacion.getEsTardia())
                .minutosTarde(marcacion.getMinutosTarde())
                .descuentoCalculado(marcacion.getDescuentoCalculado())
                .build();
    }
}
