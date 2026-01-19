package com.relojreducto.config;

import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UsuarioRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class AdminResettter {
    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;

    @org.springframework.beans.factory.annotation.Value("${app.admin.password:admin123}")
    private String adminPassword;

    public AdminResettter(UsuarioRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @PostConstruct
    public void resetAdmin() {
        System.out.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        System.out.println("!!! FORZANDO CREACION DE ADMIN: admin123 !!!");
        System.out.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

        Usuario admin = repository.findByUsername("admin").orElse(null);
        if (admin == null) {
            admin = Usuario.builder()
                    .username("admin")
                    .password(encoder.encode(adminPassword))
                    .nombreCompleto("Administrador")
                    .rol(Usuario.Rol.ADMIN)
                    .activo(true)
                    .build();
        } else {
            admin.setPassword(encoder.encode(adminPassword));
            admin.setActivo(true);
        }
        if (admin != null) {
            repository.save(admin);
        }
    }
}
