package com.relojreducto.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", unique = true, nullable = false, length = 20)
    private String username; // Cédula de identidad

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "nombre_completo", nullable = false, length = 150)
    private String nombreCompleto;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false)
    private Rol rol;

    @Column(name = "requiere_geolocalizacion", nullable = false)
    private Boolean requiereGeolocalizacion = true;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "salario_mensual", precision = 12, scale = 2)
    private BigDecimal salarioMensual = BigDecimal.ZERO;

    @Column(name = "email_institucional", length = 100)
    private String emailInstitucional;

    @Column(name = "telefono_corporativo", length = 20)
    private String telefonoCorporativo;

    @Column(name = "numero_socio", length = 50)
    private String numeroSocio;

    @Column(name = "foto_perfil", columnDefinition = "LONGTEXT")
    private String fotoPerfil;

    @Column(name = "biometrico_habilitado", nullable = false)
    private Boolean biometricoHabilitado = false;

    @Column(name = "siempre_en_ubicacion", nullable = false)
    private Boolean siempreEnUbicacion = false;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Marcacion> marcaciones;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sucursal_id")
    private Sucursal sucursal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "turno_id")
    private Turno turno;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    public Usuario() {
    }

    public Usuario(Long id, String username, String password, String nombreCompleto, Rol rol, Boolean activo,
            Boolean requiereGeolocalizacion, String email, String telefono, BigDecimal salarioMensual,
            String emailInstitucional, String telefonoCorporativo, String numeroSocio,
            String fotoPerfil, Boolean biometricoHabilitado,
            LocalDateTime fechaCreacion,
            LocalDateTime fechaActualizacion, List<Marcacion> marcaciones, Sucursal sucursal, Turno turno) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.nombreCompleto = nombreCompleto;
        this.rol = rol;
        this.activo = activo != null ? activo : true;
        this.requiereGeolocalizacion = requiereGeolocalizacion != null ? requiereGeolocalizacion : true;
        this.email = email;
        this.telefono = telefono;
        this.salarioMensual = salarioMensual != null ? salarioMensual : BigDecimal.ZERO;
        this.emailInstitucional = emailInstitucional;
        this.telefonoCorporativo = telefonoCorporativo;
        this.numeroSocio = numeroSocio;
        this.fotoPerfil = fotoPerfil;
        this.biometricoHabilitado = biometricoHabilitado != null ? biometricoHabilitado : false;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
        this.marcaciones = marcaciones;
        this.sucursal = sucursal;
        this.turno = turno;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public Boolean getRequiereGeolocalizacion() {
        return requiereGeolocalizacion;
    }

    public void setRequiereGeolocalizacion(Boolean requiereGeolocalizacion) {
        this.requiereGeolocalizacion = requiereGeolocalizacion;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public BigDecimal getSalarioMensual() {
        return salarioMensual;
    }

    public void setSalarioMensual(BigDecimal salarioMensual) {
        this.salarioMensual = salarioMensual;
    }

    public String getEmailInstitucional() {
        return emailInstitucional;
    }

    public void setEmailInstitucional(String emailInstitucional) {
        this.emailInstitucional = emailInstitucional;
    }

    public String getTelefonoCorporativo() {
        return telefonoCorporativo;
    }

    public void setTelefonoCorporativo(String telefonoCorporativo) {
        this.telefonoCorporativo = telefonoCorporativo;
    }

    public String getNumeroSocio() {
        return numeroSocio;
    }

    public void setNumeroSocio(String numeroSocio) {
        this.numeroSocio = numeroSocio;
    }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
    }

    public Boolean getBiometricoHabilitado() {
        return biometricoHabilitado;
    }

    public void setBiometricoHabilitado(Boolean biometricoHabilitado) {
        this.biometricoHabilitado = biometricoHabilitado;
    }

    public Boolean getSiempreEnUbicacion() {
        return siempreEnUbicacion;
    }

    public void setSiempreEnUbicacion(Boolean siempreEnUbicacion) {
        this.siempreEnUbicacion = siempreEnUbicacion;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public List<Marcacion> getMarcaciones() {
        return marcaciones;
    }

    public void setMarcaciones(List<Marcacion> marcaciones) {
        this.marcaciones = marcaciones;
    }

    public Sucursal getSucursal() {
        return sucursal;
    }

    public void setSucursal(Sucursal sucursal) {
        this.sucursal = sucursal;
    }

    public Turno getTurno() {
        return turno;
    }

    public void setTurno(Turno turno) {
        this.turno = turno;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String username;
        private String password;
        private String nombreCompleto;
        private Rol rol;
        private Boolean activo = true;
        private Boolean requiereGeolocalizacion = true;
        private String email;
        private String telefono;
        private BigDecimal salarioMensual = BigDecimal.ZERO;
        private String emailInstitucional;
        private String telefonoCorporativo;
        private String numeroSocio;
        private String fotoPerfil;
        private Boolean biometricoHabilitado = false;
        private LocalDateTime fechaCreacion;
        private LocalDateTime fechaActualizacion;
        private List<Marcacion> marcaciones;
        private Sucursal sucursal;
        private Turno turno;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder password(String password) {
            this.password = password;
            return this;
        }

        public Builder nombreCompleto(String nombreCompleto) {
            this.nombreCompleto = nombreCompleto;
            return this;
        }

        public Builder rol(Rol rol) {
            this.rol = rol;
            return this;
        }

        public Builder activo(Boolean activo) {
            this.activo = activo;
            return this;
        }

        public Builder requiereGeolocalizacion(Boolean requiereGeolocalizacion) {
            this.requiereGeolocalizacion = requiereGeolocalizacion;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder telefono(String telefono) {
            this.telefono = telefono;
            return this;
        }

        public Builder salarioMensual(BigDecimal salarioMensual) {
            this.salarioMensual = salarioMensual;
            return this;
        }

        public Builder emailInstitucional(String emailInstitucional) {
            this.emailInstitucional = emailInstitucional;
            return this;
        }

        public Builder telefonoCorporativo(String telefonoCorporativo) {
            this.telefonoCorporativo = telefonoCorporativo;
            return this;
        }

        public Builder numeroSocio(String numeroSocio) {
            this.numeroSocio = numeroSocio;
            return this;
        }

        public Builder fotoPerfil(String fotoPerfil) {
            this.fotoPerfil = fotoPerfil;
            return this;
        }

        public Builder biometricoHabilitado(Boolean biometricoHabilitado) {
            this.biometricoHabilitado = biometricoHabilitado;
            return this;
        }

        public Builder fechaCreacion(LocalDateTime fechaCreacion) {
            this.fechaCreacion = fechaCreacion;
            return this;
        }

        public Builder fechaActualizacion(LocalDateTime fechaActualizacion) {
            this.fechaActualizacion = fechaActualizacion;
            return this;
        }

        public Builder marcaciones(List<Marcacion> marcaciones) {
            this.marcaciones = marcaciones;
            return this;
        }

        public Builder sucursal(Sucursal sucursal) {
            this.sucursal = sucursal;
            return this;
        }

        public Builder turno(Turno turno) {
            this.turno = turno;
            return this;
        }

        public Usuario build() {
            return new Usuario(id, username, password, nombreCompleto, rol, activo, requiereGeolocalizacion, email,
                    telefono, salarioMensual, emailInstitucional, telefonoCorporativo, numeroSocio,
                    fotoPerfil, biometricoHabilitado,
                    fechaCreacion, fechaActualizacion, marcaciones, sucursal, turno);
        }
    }

    /**
     * Enum para los roles del sistema.
     */
    public enum Rol {
        ADMIN,
        ADMIN_SUCURSAL,
        EMPLEADO
    }
}
