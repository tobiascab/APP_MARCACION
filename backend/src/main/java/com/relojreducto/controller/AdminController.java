package com.relojreducto.controller;

import com.relojreducto.dto.MarcacionDTO;
import com.relojreducto.dto.UsuarioDTO;
import com.relojreducto.entity.Usuario;
import com.relojreducto.service.MarcacionService;
import com.relojreducto.service.UsuarioService;
import com.relojreducto.service.ReporteService;
import com.relojreducto.repository.UsuarioRepository;
import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller para administración (solo ADMIN).
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
public class AdminController {

    private final UsuarioService usuarioService;
    private final MarcacionService marcacionService;
    private final ReporteService reporteService;
    private final UsuarioRepository usuarioRepository;

    @org.springframework.beans.factory.annotation.Value("${app.admin.master-key:RELOJ-REDUCTO-MASTER-2024}")
    private String masterKey;

    public AdminController(UsuarioService usuarioService, MarcacionService marcacionService,
            UsuarioRepository usuarioRepository, ReporteService reporteService) {
        this.usuarioService = usuarioService;
        this.marcacionService = marcacionService;
        this.reporteService = reporteService;
        this.usuarioRepository = usuarioRepository;
    }

    // ===============================
    // GESTIÓN DE USUARIOS
    // ===============================

    /**
     * Obtiene todos los usuarios.
     * GET /api/admin/usuarios
     */
    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioDTO>> getAllUsuarios() {
        Usuario actual = getUsuarioActualEntity();
        if (actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
            return ResponseEntity.ok(usuarioService.findBySucursal(actual.getSucursal().getId()));
        }
        return ResponseEntity.ok(usuarioService.findAll());
    }

    /**
     * Obtiene usuarios activos.
     * GET /api/admin/usuarios/activos
     */
    @GetMapping("/usuarios/activos")
    public ResponseEntity<List<UsuarioDTO>> getUsuariosActivos() {
        Usuario actual = getUsuarioActualEntity();
        if (actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
            return ResponseEntity.ok(usuarioService.findActivosBySucursal(actual.getSucursal().getId()));
        }
        return ResponseEntity.ok(usuarioService.findAllActivos());
    }

    /**
     * Obtiene un usuario por ID.
     * GET /api/admin/usuarios/{id}
     */
    @GetMapping("/usuarios/{id}")
    public ResponseEntity<?> getUsuarioById(@PathVariable Long id) {
        try {
            UsuarioDTO dto = usuarioService.findById(id);
            Usuario actual = getUsuarioActualEntity();

            // Protección IDOR: El ADMIN_SUCURSAL solo puede ver usuarios de su sucursal
            if (actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
                if (!actual.getSucursal().getId().equals(dto.getSucursalId())) {
                    return ResponseEntity.status(403)
                            .body(Map.of("error", "Acceso denegado: Usuario pertenece a otra sucursal"));
                }
            }

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Usuario no encontrado",
                    "message", e.getMessage()));
        }
    }

    /**
     * Crea un nuevo usuario.
     * POST /api/admin/usuarios
     */
    @PostMapping("/usuarios")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUsuario(@Valid @RequestBody UsuarioDTO dto) {
        try {
            UsuarioDTO created = usuarioService.create(dto);
            return ResponseEntity.ok(Map.of(
                    "message", "Usuario creado exitosamente",
                    "usuario", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al crear usuario",
                    "message", "Asegúrese de que el username no exista y los datos sean válidos."));
        }
    }

    /**
     * Actualiza un usuario.
     * PUT /api/admin/usuarios/{id}
     */
    @PutMapping("/usuarios/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUsuario(@PathVariable Long id, @Valid @RequestBody UsuarioDTO dto) {
        try {
            UsuarioDTO updated = usuarioService.update(id, dto);
            return ResponseEntity.ok(Map.of(
                    "message", "Usuario actualizado exitosamente",
                    "usuario", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al actualizar usuario",
                    "message", "No se pudo actualizar el usuario."));
        }
    }

    /**
     * Desactiva un usuario.
     * PUT /api/admin/usuarios/{id}/deactivate
     */
    @PutMapping("/usuarios/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateUsuario(@PathVariable Long id) {
        try {
            usuarioService.deactivate(id);
            return ResponseEntity.ok(Map.of("message", "Usuario desactivado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al desactivar usuario",
                    "message", e.getMessage()));
        }
    }

    /**
     * Activa un usuario.
     * PUT /api/admin/usuarios/{id}/activate
     */
    @PutMapping("/usuarios/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> activateUsuario(@PathVariable Long id) {
        try {
            usuarioService.activate(id);
            return ResponseEntity.ok(Map.of("message", "Usuario activado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al activar usuario",
                    "message", e.getMessage()));
        }
    }

    /**
     * Exportar usuarios a Excel.
     * GET /api/admin/usuarios/exportar
     */
    @GetMapping("/usuarios/exportar")
    public ResponseEntity<org.springframework.core.io.Resource> exportarUsuarios() {
        try {
            Usuario actual = getUsuarioActualEntity();
            java.io.ByteArrayInputStream stream;

            if (actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
                stream = reporteService.exportarUsuariosExcelBySucursal(actual.getSucursal().getId());
            } else {
                stream = reporteService.exportarUsuariosExcel();
            }

            if (stream == null) {
                return ResponseEntity.internalServerError().build();
            }
            org.springframework.core.io.InputStreamResource file = new org.springframework.core.io.InputStreamResource(
                    stream);

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=colaboradores.xlsx")
                    .contentType(org.springframework.http.MediaType
                            .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(file);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ===============================
    // GESTIÓN DE MARCACIONES (REPORTES)
    // ===============================

    /**
     * Obtiene todas las marcaciones.
     * GET /api/admin/marcaciones
     */
    @GetMapping("/marcaciones")
    public ResponseEntity<List<MarcacionDTO>> getAllMarcaciones() {
        Usuario actual = getUsuarioActualEntity();
        if (actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
            return ResponseEntity.ok(marcacionService.getMarcacionesBySucursal(actual.getSucursal().getId()));
        }
        return ResponseEntity.ok(marcacionService.getAllMarcaciones());
    }

    /**
     * Obtiene marcaciones de un usuario específico.
     * GET /api/admin/marcaciones/usuario/{usuarioId}
     */
    @GetMapping("/marcaciones/usuario/{usuarioId}")
    public ResponseEntity<List<MarcacionDTO>> getMarcacionesByUsuario(@PathVariable Long usuarioId) {
        Usuario actual = getUsuarioActualEntity();
        UsuarioDTO targetUser = usuarioService.findById(usuarioId);

        // Protección IDOR: Validar sucursal
        if (actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
            if (!actual.getSucursal().getId().equals(targetUser.getSucursalId())) {
                return ResponseEntity.status(403).build();
            }
        }

        return ResponseEntity.ok(marcacionService.getMarcacionesByUsuario(usuarioId));
    }

    /**
     * Obtiene marcaciones por rango de fechas.
     * GET /api/admin/marcaciones/rango?inicio=2024-01-01&fin=2024-01-31
     */
    @GetMapping("/marcaciones/rango")
    public ResponseEntity<List<MarcacionDTO>> getMarcacionesByRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        Usuario actual = getUsuarioActualEntity();
        if (actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
            return ResponseEntity
                    .ok(marcacionService.getMarcacionesBySucursalAndRango(actual.getSucursal().getId(), inicio, fin));
        }
        return ResponseEntity.ok(marcacionService.getMarcacionesByRango(inicio, fin));
    }

    /**
     * Obtiene marcaciones de un usuario por rango de fechas.
     * GET
     * /api/admin/marcaciones/usuario/{usuarioId}/rango?inicio=2024-01-01&fin=2024-01-31
     */
    @GetMapping("/marcaciones/usuario/{usuarioId}/rango")
    public ResponseEntity<List<MarcacionDTO>> getMarcacionesByUsuarioAndRango(
            @PathVariable Long usuarioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        Usuario actual = getUsuarioActualEntity();
        UsuarioDTO targetUser = usuarioService.findById(usuarioId);

        // Protección IDOR: Validar sucursal
        if (actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
            if (!actual.getSucursal().getId().equals(targetUser.getSucursalId())) {
                return ResponseEntity.status(403).build();
            }
        }
        return ResponseEntity.ok(marcacionService.getMarcacionesByUsuarioAndRango(usuarioId, inicio, fin));
    }

    /**
     * Resetea todas las marcaciones (MODO DESARROLLO).
     * DELETE /api/admin/marcaciones/reset
     */
    @DeleteMapping("/marcaciones/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetMarcaciones(
            @RequestHeader(value = "X-Master-Key", required = false) String providedKey) {
        if (!masterKey.equals(providedKey)) {
            return ResponseEntity.status(403).body(Map.of("error", "Llave maestra inválida"));
        }
        try {
            marcacionService.resetAllMarcaciones();
            return ResponseEntity.ok(Map.of("message", "Todas las marcaciones han sido eliminadas correctamente"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Error al resetear marcaciones",
                    "message", "No se pudo realizar el reset de marcaciones."));
        }
    }

    /**
     * Resetea el perfil de un usuario (foto y datos) para pruebas.
     * POST /api/admin/usuarios/{id}/reset-perfil
     */
    @PostMapping("/usuarios/{id}/reset-perfil")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetPerfil(@PathVariable Long id,
            @RequestHeader(value = "X-Master-Key", required = false) String providedKey) {
        if (!masterKey.equals(providedKey)) {
            return ResponseEntity.status(403).body(Map.of("error", "Llave maestra inválida"));
        }
        try {
            usuarioService.resetProfile(id);
            return ResponseEntity.ok(Map.of("message", "Perfil de usuario reseteado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al resetear perfil",
                    "message", "Asegúrese de que el usuario exista."));
        }
    }

    /**
     * Resetea el perfil de TODOS los usuarios.
     * DELETE /api/admin/usuarios/reset-perfiles-global
     */
    @DeleteMapping("/usuarios/reset-perfiles-global")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetAllProfiles(
            @RequestHeader(value = "X-Master-Key", required = false) String providedKey) {
        if (!masterKey.equals(providedKey)) {
            return ResponseEntity.status(403).body(Map.of("error", "Llave maestra inválida"));
        }
        try {
            usuarioService.resetAllProfiles();
            return ResponseEntity.ok(Map.of("message", "Perfiles de TODOS los usuarios reseteados exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Error al resetear perfiles",
                    "message", "No se pudo completar la operación global."));
        }
    }

    private Usuario getUsuarioActualEntity() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        return usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no autenticado"));
    }
}
