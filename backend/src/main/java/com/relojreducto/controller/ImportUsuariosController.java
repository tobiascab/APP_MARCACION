package com.relojreducto.controller;

import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.SucursalRepository;
import com.relojreducto.repository.TurnoRepository;
import com.relojreducto.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

/**
 * Controller para importación masiva de usuarios desde Excel/CSV.
 * Recibe un array JSON de objetos con los datos de cada funcionario.
 */
@RestController
@RequestMapping("/api/admin/usuarios")
@PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
public class ImportUsuariosController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SucursalRepository sucursalRepository;

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * POST /api/admin/usuarios/importar
     * Importación masiva de usuarios.
     *
     * Body: Array de objetos con campos:
     * - ci (String, requerido) → se usa como username
     * - nombreCompleto (String, requerido)
     * - email (String, opcional)
     * - telefono (String, opcional)
     * - salarioMensual (Number, opcional)
     * - sucursalId (Long, opcional)
     * - turnoId (Long, opcional)
     * - rol (String, opcional: EMPLEADO|ADMIN|ADMIN_SUCURSAL, default: EMPLEADO)
     */
    @PostMapping("/importar")
    public ResponseEntity<?> importarUsuarios(@RequestBody List<Map<String, Object>> usuarios) {
        int creados = 0;
        int actualizados = 0;
        int omitidos = 0;
        List<Map<String, String>> errores = new ArrayList<>();
        List<Map<String, Object>> resultados = new ArrayList<>();

        for (int i = 0; i < usuarios.size(); i++) {
            Map<String, Object> row = usuarios.get(i);
            int fila = i + 1;

            try {
                String ci = getString(row, "ci");
                String nombre = getString(row, "nombreCompleto");

                if (ci == null || ci.isBlank() || nombre == null || nombre.isBlank()) {
                    errores.add(Map.of(
                            "fila", String.valueOf(fila),
                            "error", "CI y Nombre Completo son requeridos"));
                    omitidos++;
                    continue;
                }

                // Limpiar CI (quitar puntos, espacios)
                ci = ci.replaceAll("[^0-9]", "").trim();

                // Verificar si ya existe
                Optional<Usuario> existente = usuarioRepository.findByUsername(ci);
                Usuario usuario;

                if (existente.isPresent()) {
                    // Actualizar datos del existente
                    usuario = existente.get();
                    usuario.setNombreCompleto(nombre);
                    updateOptionalFields(usuario, row);
                    usuarioRepository.save(usuario);
                    actualizados++;

                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("fila", fila);
                    r.put("ci", ci);
                    r.put("nombre", nombre);
                    r.put("accion", "ACTUALIZADO");
                    resultados.add(r);
                } else {
                    // Crear nuevo
                    usuario = new Usuario();
                    usuario.setUsername(ci);
                    usuario.setNombreCompleto(nombre);
                    // Password por defecto: CI del empleado
                    usuario.setPassword(passwordEncoder.encode(ci));
                    usuario.setActivo(true);
                    usuario.setRequiereGeolocalizacion(true);
                    usuario.setBiometricoHabilitado(false);
                    usuario.setSiempreEnUbicacion(false);

                    // Rol
                    String rolStr = getString(row, "rol");
                    if (rolStr != null && !rolStr.isBlank()) {
                        try {
                            usuario.setRol(Usuario.Rol.valueOf(rolStr.toUpperCase()));
                        } catch (Exception e) {
                            usuario.setRol(Usuario.Rol.EMPLEADO);
                        }
                    } else {
                        usuario.setRol(Usuario.Rol.EMPLEADO);
                    }

                    updateOptionalFields(usuario, row);
                    usuarioRepository.save(usuario);
                    creados++;

                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("fila", fila);
                    r.put("ci", ci);
                    r.put("nombre", nombre);
                    r.put("accion", "CREADO");
                    resultados.add(r);
                }
            } catch (Exception e) {
                errores.add(Map.of(
                        "fila", String.valueOf(fila),
                        "error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
                omitidos++;
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalProcesados", usuarios.size());
        response.put("creados", creados);
        response.put("actualizados", actualizados);
        response.put("omitidos", omitidos);
        response.put("errores", errores);
        response.put("resultados", resultados);

        return ResponseEntity.ok(response);
    }

    // Actualizar campos opcionales del usuario
    private void updateOptionalFields(Usuario usuario, Map<String, Object> row) {
        String email = getString(row, "email");
        if (email != null && !email.isBlank()) {
            usuario.setEmail(email);
        }

        String telefono = getString(row, "telefono");
        if (telefono != null && !telefono.isBlank()) {
            usuario.setTelefono(telefono);
        }

        String emailInst = getString(row, "emailInstitucional");
        if (emailInst != null && !emailInst.isBlank()) {
            usuario.setEmailInstitucional(emailInst);
        }

        String telCorp = getString(row, "telefonoCorporativo");
        if (telCorp != null && !telCorp.isBlank()) {
            usuario.setTelefonoCorporativo(telCorp);
        }

        String numSocio = getString(row, "numeroSocio");
        if (numSocio != null && !numSocio.isBlank()) {
            usuario.setNumeroSocio(numSocio);
        }

        // Salario
        Object salarioObj = row.get("salarioMensual");
        if (salarioObj != null) {
            try {
                usuario.setSalarioMensual(new BigDecimal(salarioObj.toString()));
            } catch (Exception ignored) {
            }
        }

        // Sucursal
        Object sucursalObj = row.get("sucursalId");
        if (sucursalObj != null) {
            try {
                Long sucId = Long.parseLong(sucursalObj.toString());
                sucursalRepository.findById(sucId).ifPresent(usuario::setSucursal);
            } catch (Exception ignored) {
            }
        }

        // Turno
        Object turnoObj = row.get("turnoId");
        if (turnoObj != null) {
            try {
                Long turnoId = Long.parseLong(turnoObj.toString());
                turnoRepository.findById(turnoId).ifPresent(usuario::setTurno);
            } catch (Exception ignored) {
            }
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString().trim() : null;
    }
}
