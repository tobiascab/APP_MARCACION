package com.relojreducto.config;

import com.relojreducto.entity.Sucursal;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.SucursalRepository;
import com.relojreducto.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@org.springframework.context.annotation.Profile({ "dev", "test" })
public class DataInitializer implements CommandLineRunner {

        private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

        @org.springframework.beans.factory.annotation.Value("${app.admin.password:admin123}")
        private String adminPassword;

        private final UsuarioRepository usuarioRepository;
        private final SucursalRepository sucursalRepository;
        private final PasswordEncoder passwordEncoder;

        public DataInitializer(UsuarioRepository usuarioRepository, SucursalRepository sucursalRepository,
                        PasswordEncoder passwordEncoder) {
                this.usuarioRepository = usuarioRepository;
                this.sucursalRepository = sucursalRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @Override
        @SuppressWarnings("null")
        public void run(String... args) throws Exception {
                System.out.println(">>> EJECUTANDO DATA INITIALIZER <<<");
                // Inicializar Sucursales
                if (sucursalRepository.count() == 0) {
                        sucursalRepository.save(
                                        Sucursal.builder().nombre("Casa Central").direccion("Esta es la casa Central")
                                                        .latitud(-25.374848855439616).longitud(-57.49254477902137)
                                                        .radioGeocerca(100).build());
                        sucursalRepository
                                        .save(Sucursal.builder().nombre("Sucursal Villarrica")
                                                        .direccion("Esta es la sucursal Villarrica")
                                                        .latitud(-25.77958431896986).longitud(-56.44843046838149)
                                                        .radioGeocerca(100).build());
                        sucursalRepository.save(Sucursal.builder().nombre("SUC.5 REDUCTO").latitud(-25.386696634514145)
                                        .longitud(-57.49774528719085).radioGeocerca(100).build());
                        sucursalRepository.save(Sucursal.builder().nombre("SUC. CDE").latitud(-25.531550883080623)
                                        .longitud(-54.61337452588945).radioGeocerca(100).build());
                        sucursalRepository
                                        .save(Sucursal.builder().nombre("SUC Hernandarias").latitud(-25.402156338646215)
                                                        .longitud(-54.64116888352394).radioGeocerca(100).build());
                        sucursalRepository.save(
                                        Sucursal.builder().nombre("Suc. San Lorenzo")
                                                        .direccion("ESTA ES LA SUCURSAL SAN LORENZO CENTRO")
                                                        .latitud(-25.344243145211808).longitud(-57.51241517752615)
                                                        .radioGeocerca(100).build());

                        log.info("✅ Sucursales inicializadas con coordenadas precisas");
                }

                Sucursal casaCentral = sucursalRepository.findByNombre("Casa Central").orElse(null);

                // Crear/Actualizar usuario admin
                Usuario admin = usuarioRepository.findByUsername("admin").orElse(null);
                if (admin == null) {
                        admin = Usuario.builder()
                                        .username("admin")
                                        .password(passwordEncoder.encode(adminPassword))
                                        .nombreCompleto("Administrador del Sistema")
                                        .rol(Usuario.Rol.ADMIN)
                                        .activo(true)
                                        .email("admin@relojreducto.com")
                                        .sucursal(casaCentral)
                                        .build();
                        usuarioRepository.save(admin);
                        log.info("✅ Usuario ADMIN creado");
                } else {
                        admin.setPassword(passwordEncoder.encode(adminPassword));
                        admin.setSucursal(casaCentral);
                        usuarioRepository.save(admin);
                        log.info("✅ Usuario ADMIN actualizado");
                }

                // Crear usuario empleado de prueba si no existe
                if (!usuarioRepository.existsByUsername("empleado1")) {
                        Usuario empleado = Usuario.builder()
                                        .username("empleado1")
                                        .password(passwordEncoder.encode("empleado123"))
                                        .nombreCompleto("Juan Pérez (Empleado de Prueba)")
                                        .rol(Usuario.Rol.EMPLEADO)
                                        .activo(true)
                                        .email("empleado1@relojreducto.com")
                                        .sucursal(casaCentral)
                                        .build();

                        usuarioRepository.save(empleado);
                        log.info("✅ Usuario EMPLEADO creado");
                }

                log.info("✅ Datos base listos para desarrollo");

                if (!usuarioRepository.existsByUsername("123")) {
                        usuarioRepository.save(Usuario.builder()
                                        .username("123")
                                        .password(passwordEncoder.encode("123"))
                                        .nombreCompleto("Usuario de Prueba")
                                        .rol(Usuario.Rol.EMPLEADO)
                                        .activo(true)
                                        .sucursal(casaCentral)
                                        .build());
                }

                log.info("===========================================");
                log.info("   🕐 RELOJ REDUCTO - DATOS INICIALIZADOS  ");
                log.info("===========================================");
        }
}
