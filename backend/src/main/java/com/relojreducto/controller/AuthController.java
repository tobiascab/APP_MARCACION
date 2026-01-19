package com.relojreducto.controller;

import com.relojreducto.dto.AuthResponse;
import com.relojreducto.dto.LoginRequest;
import com.relojreducto.dto.UsuarioDTO;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UsuarioRepository;
import com.relojreducto.security.JwtUtils;
import com.relojreducto.service.UsuarioService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller para autenticación de usuarios.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:5173", "https://localhost:5173" }) // Restringido para mayor seguridad
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final com.relojreducto.security.RateLimiterService rateLimiterService;
    private final jakarta.servlet.http.HttpServletRequest request;

    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils, UsuarioService usuarioService,
            UsuarioRepository usuarioRepository, com.relojreducto.security.RateLimiterService rateLimiterService,
            jakarta.servlet.http.HttpServletRequest request) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
        this.rateLimiterService = rateLimiterService;
        this.request = request;
    }

    /**
     * Login de usuario.
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        String ip = request.getRemoteAddr();

        if (rateLimiterService.isBlocked(ip)) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Demasiados intentos",
                    "message", "Su IP ha sido bloqueada temporalmente por seguridad. Intente de nuevo en 15 minutos."));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Login exitoso
            rateLimiterService.resetAttempts(ip);

            // Agregar el rol al token
            Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Map<String, Object> claims = new HashMap<>();
            claims.put("rol", usuario.getRol().name());
            claims.put("id", usuario.getId());

            String token = jwtUtils.generateToken(userDetails, claims);
            UsuarioDTO usuarioDTO = UsuarioDTO.fromEntity(usuario);

            return ResponseEntity.ok(AuthResponse.of(token, usuarioDTO));
        } catch (Exception e) {
            rateLimiterService.addAttempt(ip);
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Credenciales inválidas",
                    "message", "El nombre de usuario o la contraseña son incorrectos."));
        }
    }

    /**
     * Registro de nuevo usuario (solo admin puede registrar).
     * POST /api/auth/register
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(@Valid @RequestBody UsuarioDTO dto) {
        try {
            UsuarioDTO created = usuarioService.create(dto);
            return ResponseEntity.ok(Map.of(
                    "message", "Usuario creado exitosamente",
                    "usuario", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al crear usuario",
                    "message", "Verifique que los datos sean correctos y el username no esté duplicado."));
        }
    }

    /**
     * Verificar token válido.
     * GET /api/auth/verify
     */
    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken() {
        return ResponseEntity.ok(Map.of("valid", true));
    }
}
