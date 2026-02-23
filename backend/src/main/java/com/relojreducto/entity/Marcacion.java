package com.relojreducto.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "marcaciones")
public class Marcacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoMarcacion tipo;

    @Column(name = "latitud")
    private Double latitud;

    @Column(name = "longitud")
    private Double longitud;

    @Column(name = "direccion", length = 255)
    private String direccion; // Dirección aproximada (opcional)

    @Column(name = "dispositivo", length = 100)
    private String dispositivo; // Información del dispositivo

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "observacion", length = 500)
    private String observacion;

    // Campos para control de tardanzas
    @Column(name = "es_tardia")
    private Boolean esTardia = false;

    @Column(name = "minutos_tarde")
    private Integer minutosTarde = 0;

    @Column(name = "descuento_calculado", precision = 12, scale = 2)
    private BigDecimal descuentoCalculado = BigDecimal.ZERO;

    @Column(name = "device_fingerprint", length = 50)
    private String deviceFingerprint;

    @Column(name = "dispositivo_compartido")
    private Boolean dispositivoCompartido = false;

    @Column(name = "dispositivo_compartido_con", length = 200)
    private String dispositivoCompartidoCon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @PrePersist
    protected void onCreate() {
        if (fechaHora == null) {
            fechaHora = LocalDateTime.now();
        }
    }

    public Marcacion() {
    }

    public Marcacion(Long id, LocalDateTime fechaHora, TipoMarcacion tipo, Double latitud, Double longitud,
            String direccion, String dispositivo, String ipAddress, String observacion, Boolean esTardia,
            Integer minutosTarde, BigDecimal descuentoCalculado, Usuario usuario,
            String deviceFingerprint, Boolean dispositivoCompartido, String dispositivoCompartidoCon) {
        this.id = id;
        this.fechaHora = fechaHora;
        this.tipo = tipo;
        this.latitud = latitud;
        this.longitud = longitud;
        this.direccion = direccion;
        this.dispositivo = dispositivo;
        this.ipAddress = ipAddress;
        this.observacion = observacion;
        this.esTardia = esTardia != null ? esTardia : false;
        this.minutosTarde = minutosTarde != null ? minutosTarde : 0;
        this.descuentoCalculado = descuentoCalculado != null ? descuentoCalculado : BigDecimal.ZERO;
        this.usuario = usuario;
        this.deviceFingerprint = deviceFingerprint;
        this.dispositivoCompartido = dispositivoCompartido != null ? dispositivoCompartido : false;
        this.dispositivoCompartidoCon = dispositivoCompartidoCon;
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

    public TipoMarcacion getTipo() {
        return tipo;
    }

    public void setTipo(TipoMarcacion tipo) {
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

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
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

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getDeviceFingerprint() {
        return deviceFingerprint;
    }

    public void setDeviceFingerprint(String deviceFingerprint) {
        this.deviceFingerprint = deviceFingerprint;
    }

    public Boolean getDispositivoCompartido() {
        return dispositivoCompartido;
    }

    public void setDispositivoCompartido(Boolean dispositivoCompartido) {
        this.dispositivoCompartido = dispositivoCompartido;
    }

    public String getDispositivoCompartidoCon() {
        return dispositivoCompartidoCon;
    }

    public void setDispositivoCompartidoCon(String dispositivoCompartidoCon) {
        this.dispositivoCompartidoCon = dispositivoCompartidoCon;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private LocalDateTime fechaHora;
        private TipoMarcacion tipo;
        private Double latitud;
        private Double longitud;
        private String direccion;
        private String dispositivo;
        private String ipAddress;
        private String observacion;
        private Boolean esTardia = false;
        private Integer minutosTarde = 0;
        private BigDecimal descuentoCalculado = BigDecimal.ZERO;
        private Usuario usuario;
        private String deviceFingerprint;
        private Boolean dispositivoCompartido = false;
        private String dispositivoCompartidoCon;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder fechaHora(LocalDateTime fechaHora) {
            this.fechaHora = fechaHora;
            return this;
        }

        public Builder tipo(TipoMarcacion tipo) {
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

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder observacion(String observacion) {
            this.observacion = observacion;
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

        public Builder usuario(Usuario usuario) {
            this.usuario = usuario;
            return this;
        }

        public Builder deviceFingerprint(String deviceFingerprint) {
            this.deviceFingerprint = deviceFingerprint;
            return this;
        }

        public Builder dispositivoCompartido(Boolean dispositivoCompartido) {
            this.dispositivoCompartido = dispositivoCompartido;
            return this;
        }

        public Builder dispositivoCompartidoCon(String dispositivoCompartidoCon) {
            this.dispositivoCompartidoCon = dispositivoCompartidoCon;
            return this;
        }

        public Marcacion build() {
            return new Marcacion(id, fechaHora, tipo, latitud, longitud, direccion, dispositivo, ipAddress, observacion,
                    esTardia, minutosTarde, descuentoCalculado, usuario,
                    deviceFingerprint, dispositivoCompartido, dispositivoCompartidoCon);
        }
    }

    /**
     * Enum para los tipos de marcación.
     */
    public enum TipoMarcacion {
        ENTRADA,
        SALIDA
    }
}
