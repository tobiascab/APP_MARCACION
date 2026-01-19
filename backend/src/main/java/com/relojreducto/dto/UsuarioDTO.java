package com.relojreducto.dto;

import com.relojreducto.entity.Usuario;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class UsuarioDTO {
    private Long id;

    @NotBlank(message = "El nombre de usuario es requerido")
    @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
    private String username;

    @NotBlank(message = "El nombre completo es requerido")
    @Size(max = 100)
    private String nombreCompleto;

    @NotBlank(message = "El rol es requerido")
    private String rol;

    private Boolean activo;

    @Email(message = "El formato del email no es válido")
    private String email;

    @Size(max = 20)
    private String telefono;

    private BigDecimal salarioMensual;

    @Email(message = "El formato del email institucional no es válido")
    private String emailInstitucional;

    private String telefonoCorporativo;
    private String numeroSocio;
    private String fotoPerfil;
    private Boolean biometricoHabilitado;
    private Boolean siempreEnUbicacion;
    private Long sucursalId;
    private SucursalDTO sucursal;
    private Long turnoId;
    private TurnoDTO turno;

    public UsuarioDTO() {
    }

    public UsuarioDTO(Long id, String username, String nombreCompleto, String rol, Boolean activo, String email,
            String telefono, BigDecimal salarioMensual, String emailInstitucional, String telefonoCorporativo,
            String numeroSocio, String fotoPerfil, Boolean biometricoHabilitado,
            Boolean siempreEnUbicacion, Long sucursalId, SucursalDTO sucursal, Long turnoId, TurnoDTO turno) {
        this.id = id;
        this.username = username;
        this.nombreCompleto = nombreCompleto;
        this.rol = rol;
        this.activo = activo;
        this.email = email;
        this.telefono = telefono;
        this.salarioMensual = salarioMensual;
        this.emailInstitucional = emailInstitucional;
        this.telefonoCorporativo = telefonoCorporativo;
        this.numeroSocio = numeroSocio;
        this.fotoPerfil = fotoPerfil;
        this.biometricoHabilitado = biometricoHabilitado;
        this.siempreEnUbicacion = siempreEnUbicacion;
        this.sucursalId = sucursalId;
        this.sucursal = sucursal;
        this.turnoId = turnoId;
        this.turno = turno;
    }

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

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
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

    public Long getSucursalId() {
        return sucursalId;
    }

    public void setSucursalId(Long sucursalId) {
        this.sucursalId = sucursalId;
    }

    public SucursalDTO getSucursal() {
        return sucursal;
    }

    public void setSucursal(SucursalDTO sucursal) {
        this.sucursal = sucursal;
    }

    public Long getTurnoId() {
        return turnoId;
    }

    public void setTurnoId(Long turnoId) {
        this.turnoId = turnoId;
    }

    public TurnoDTO getTurno() {
        return turno;
    }

    public void setTurno(TurnoDTO turno) {
        this.turno = turno;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String username;
        private String nombreCompleto;
        private String rol;
        private Boolean activo;
        private String email;
        private String telefono;
        private BigDecimal salarioMensual;
        private String emailInstitucional;
        private String telefonoCorporativo;
        private String numeroSocio;
        private String fotoPerfil;
        private Boolean biometricoHabilitado;
        private Boolean siempreEnUbicacion;
        private Long sucursalId;
        private SucursalDTO sucursal;
        private Long turnoId;
        private TurnoDTO turno;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder nombreCompleto(String nombreCompleto) {
            this.nombreCompleto = nombreCompleto;
            return this;
        }

        public Builder rol(String rol) {
            this.rol = rol;
            return this;
        }

        public Builder activo(Boolean activo) {
            this.activo = activo;
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

        public Builder siempreEnUbicacion(Boolean siempreEnUbicacion) {
            this.siempreEnUbicacion = siempreEnUbicacion;
            return this;
        }

        public Builder sucursalId(Long sucursalId) {
            this.sucursalId = sucursalId;
            return this;
        }

        public Builder sucursal(SucursalDTO sucursal) {
            this.sucursal = sucursal;
            return this;
        }

        public Builder turnoId(Long turnoId) {
            this.turnoId = turnoId;
            return this;
        }

        public Builder turno(TurnoDTO turno) {
            this.turno = turno;
            return this;
        }

        public UsuarioDTO build() {
            return new UsuarioDTO(id, username, nombreCompleto, rol, activo, email, telefono, salarioMensual,
                    emailInstitucional, telefonoCorporativo, numeroSocio,
                    fotoPerfil, biometricoHabilitado, siempreEnUbicacion, sucursalId, sucursal, turnoId, turno);
        }
    }

    public static UsuarioDTO fromEntity(Usuario usuario) {
        return new Builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombreCompleto())
                .rol(usuario.getRol().name())
                .activo(usuario.getActivo())
                .email(usuario.getEmail())
                .telefono(usuario.getTelefono())
                .salarioMensual(usuario.getSalarioMensual())
                .emailInstitucional(usuario.getEmailInstitucional())
                .telefonoCorporativo(usuario.getTelefonoCorporativo())
                .numeroSocio(usuario.getNumeroSocio())
                .fotoPerfil(usuario.getFotoPerfil())
                .biometricoHabilitado(usuario.getBiometricoHabilitado())
                .siempreEnUbicacion(usuario.getSiempreEnUbicacion())
                .sucursalId(usuario.getSucursal() != null ? usuario.getSucursal().getId() : null)
                .sucursal(SucursalDTO.fromEntity(usuario.getSucursal()))
                .turnoId(usuario.getTurno() != null ? usuario.getTurno().getId() : null)
                .turno(usuario.getTurno() != null ? TurnoDTO.fromEntity(usuario.getTurno()) : null)
                .build();
    }
}
