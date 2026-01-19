package com.relojreducto.controller;

import com.relojreducto.dto.UsuarioDTO;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UsuarioRepository;
import com.relojreducto.service.UsuarioService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller para operaciones del usuario autenticado.
 */
@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = { "http://localhost:5173", "https://localhost:5173" })
@SuppressWarnings("null")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioService usuarioService, UsuarioRepository usuarioRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Obtiene los datos del usuario autenticado.
     * GET /api/usuarios/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getUsuarioActual() {
        try {
            Long usuarioId = getUsuarioIdActual();
            UsuarioDTO usuario = usuarioService.findById(usuarioId);
            return ResponseEntity.ok(usuario);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al obtener usuario",
                    "message", "No se pudo recuperar la información del perfil."));
        }
    }

    /**
     * Actualiza el perfil del usuario autenticado.
     * PUT /api/usuarios/perfil
     */
    @PutMapping("/perfil")
    public ResponseEntity<?> actualizarPerfil(@RequestBody Map<String, Object> request) {
        try {
            Long usuarioId = getUsuarioIdActual();
            Usuario usuario = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Lista blanca de campos permitidos para actualización por el propio usuario
            if (request.containsKey("nombreCompleto")) {
                usuario.setNombreCompleto((String) request.get("nombreCompleto"));
            }
            if (request.containsKey("email")) {
                usuario.setEmail((String) request.get("email"));
            }
            if (request.containsKey("telefono")) {
                usuario.setTelefono((String) request.get("telefono"));
            }
            if (request.containsKey("fotoPerfil")) {
                usuario.setFotoPerfil((String) request.get("fotoPerfil"));
            }

            // Cambio de contraseña con validación mínima
            if (request.containsKey("password") && request.get("password") != null) {
                String newPass = (String) request.get("password");
                if (!newPass.isEmpty()) {
                    if (newPass.length() < 6) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "La contraseña debe tener al menos 6 caracteres"));
                    }
                    usuario.setPassword(passwordEncoder.encode(newPass));
                }
            }

            usuarioRepository.save(usuario);

            return ResponseEntity.ok(Map.of(
                    "message", "Perfil actualizado exitosamente",
                    "usuario", UsuarioDTO.fromEntity(usuario)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al actualizar perfil",
                    "message", "Asegúrese de que los datos sean válidos."));
        }
    }

    /**
     * Habilita la autenticación biométrica para el usuario.
     * PUT /api/usuarios/biometrico
     */
    @PutMapping("/biometrico")
    public ResponseEntity<?> habilitarBiometrico(@RequestBody Map<String, Boolean> request) {
        try {
            Boolean habilitar = request.get("habilitar");
            if (habilitar == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Parámetro requerido",
                        "message", "Debe indicar si habilitar o deshabilitar biométrico"));
            }

            Long usuarioId = getUsuarioIdActual();
            Usuario usuario = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            usuario.setBiometricoHabilitado(habilitar);
            usuarioRepository.save(usuario);

            return ResponseEntity.ok(Map.of(
                    "message",
                    habilitar ? "Autenticación biométrica habilitada" : "Autenticación biométrica deshabilitada",
                    "usuario", UsuarioDTO.fromEntity(usuario)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al configurar biométrico",
                    "message", "Hubo un problema al procesar la solicitud."));
        }
    }

    /**
     * Obtiene el ID del usuario autenticado actualmente.
     */
    private Long getUsuarioIdActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return usuario.getId();
    }
}
