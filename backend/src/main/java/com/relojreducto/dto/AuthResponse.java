package com.relojreducto.dto;

public class AuthResponse {
    private String token;
    private String tipo;
    private UsuarioDTO usuario;

    public AuthResponse() {
    }

    public AuthResponse(String token, String tipo, UsuarioDTO usuario) {
        this.token = token;
        this.tipo = tipo;
        this.usuario = usuario;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public UsuarioDTO getUsuario() {
        return usuario;
    }

    public void setUsuario(UsuarioDTO usuario) {
        this.usuario = usuario;
    }

    public static AuthResponse of(String token, UsuarioDTO usuario) {
        return new Builder()
                .token(token)
                .tipo("Bearer")
                .usuario(usuario)
                .build();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String token;
        private String tipo;
        private UsuarioDTO usuario;

        public Builder token(String token) {
            this.token = token;
            return this;
        }

        public Builder tipo(String tipo) {
            this.tipo = tipo;
            return this;
        }

        public Builder usuario(UsuarioDTO usuario) {
            this.usuario = usuario;
            return this;
        }

        public AuthResponse build() {
            return new AuthResponse(token, tipo, usuario);
        }
    }
}
