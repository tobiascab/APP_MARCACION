package com.relojreducto.service;

import com.relojreducto.dto.UsuarioDTO;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.UsuarioRepository;
import com.relojreducto.repository.SucursalRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de usuarios.
 */
@Service
@SuppressWarnings("null")
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;
    private final com.relojreducto.repository.TurnoRepository turnoRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, SucursalRepository sucursalRepository,
            com.relojreducto.repository.TurnoRepository turnoRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
        this.turnoRepository = turnoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Obtiene todos los usuarios.
     */
    public List<UsuarioDTO> findAll() {
        return usuarioRepository.findAll().stream()
                .map(UsuarioDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los usuarios activos.
     */
    public List<UsuarioDTO> findAllActivos() {
        return usuarioRepository.findByActivoTrue().stream()
                .map(UsuarioDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Busca un usuario por ID.
     */
    public UsuarioDTO findById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        return UsuarioDTO.fromEntity(usuario);
    }

    /**
     * Obtiene todos los usuarios de una sucursal.
     */
    public List<UsuarioDTO> findBySucursal(Long sucursalId) {
        return usuarioRepository.findBySucursal_Id(sucursalId).stream()
                .map(UsuarioDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los usuarios activos de una sucursal.
     */
    public List<UsuarioDTO> findActivosBySucursal(Long sucursalId) {
        return usuarioRepository.findBySucursal_IdAndActivoTrue(sucursalId).stream()
                .map(UsuarioDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Busca un usuario por username (cédula).
     */
    public UsuarioDTO findByUsername(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + username));
        return UsuarioDTO.fromEntity(usuario);
    }

    /**
     * Crea un nuevo usuario.
     */
    @Transactional
    public UsuarioDTO create(UsuarioDTO dto) {
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new RuntimeException("Ya existe un usuario con esa cédula: " + dto.getUsername());
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.getUsername());
        usuario.setPassword(passwordEncoder.encode(dto.getUsername())); // Password por defecto la cédula
        usuario.setNombreCompleto(dto.getNombreCompleto());
        usuario.setRol(Usuario.Rol.valueOf(dto.getRol()));
        usuario.setActivo(true);
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());
        usuario.setSalarioMensual(dto.getSalarioMensual());
        usuario.setEmailInstitucional(dto.getEmailInstitucional());
        usuario.setTelefonoCorporativo(dto.getTelefonoCorporativo());
        usuario.setNumeroSocio(dto.getNumeroSocio());
        usuario.setFotoPerfil(dto.getFotoPerfil());
        usuario.setBiometricoHabilitado(dto.getBiometricoHabilitado() != null ? dto.getBiometricoHabilitado() : false);
        usuario.setSiempreEnUbicacion(dto.getSiempreEnUbicacion() != null ? dto.getSiempreEnUbicacion() : false);

        if (dto.getSucursalId() != null) {
            sucursalRepository.findById(dto.getSucursalId()).ifPresent(usuario::setSucursal);
        }

        if (dto.getTurnoId() != null) {
            turnoRepository.findById(dto.getTurnoId()).ifPresent(usuario::setTurno);
        } else {
            // Asignar "HORARIO DIURNO" por defecto
            turnoRepository.findByNombreIgnoreCase("HORARIO DIURNO").ifPresent(usuario::setTurno);
        }

        Usuario saved = usuarioRepository.save(usuario);
        return UsuarioDTO.fromEntity(saved);
    }

    /**
     * Actualiza un usuario existente.
     */
    @Transactional
    public UsuarioDTO update(Long id, UsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        usuario.setNombreCompleto(dto.getNombreCompleto());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());
        usuario.setRol(Usuario.Rol.valueOf(dto.getRol()));
        if (dto.getActivo() != null) {
            usuario.setActivo(dto.getActivo());
        }
        if (dto.getBiometricoHabilitado() != null) {
            usuario.setBiometricoHabilitado(dto.getBiometricoHabilitado());
        }
        if (dto.getSiempreEnUbicacion() != null) {
            usuario.setSiempreEnUbicacion(dto.getSiempreEnUbicacion());
        }
        if (dto.getFotoPerfil() != null) {
            usuario.setFotoPerfil(dto.getFotoPerfil());
        }
        usuario.setSalarioMensual(dto.getSalarioMensual());
        usuario.setEmailInstitucional(dto.getEmailInstitucional());
        usuario.setTelefonoCorporativo(dto.getTelefonoCorporativo());
        usuario.setNumeroSocio(dto.getNumeroSocio());

        if (dto.getSucursalId() != null) {
            sucursalRepository.findById(dto.getSucursalId()).ifPresent(usuario::setSucursal);
        } else {
            usuario.setSucursal(null);
        }

        if (dto.getTurnoId() != null) {
            turnoRepository.findById(dto.getTurnoId()).ifPresent(usuario::setTurno);
        } else {
            usuario.setTurno(null);
        }

        Usuario saved = usuarioRepository.save(usuario);
        return UsuarioDTO.fromEntity(saved);
    }

    /**
     * Cambia la contraseña de un usuario.
     */
    @Transactional
    public void changePassword(Long id, String newPassword) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }

    /**
     * Resetea la contraseña de un usuario a su CI (username).
     */
    @Transactional
    public void resetPasswordToUsername(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        usuario.setPassword(passwordEncoder.encode(usuario.getUsername()));
        usuarioRepository.save(usuario);
    }

    /**
     * Resetea el perfil de un usuario (foto y datos corporativos).
     */
    @Transactional
    public void resetProfile(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        usuario.setFotoPerfil(null);
        usuario.setEmailInstitucional(null);
        usuario.setTelefonoCorporativo(null);
        usuario.setNumeroSocio(null);
        usuario.setBiometricoHabilitado(false);
        usuarioRepository.save(usuario);
    }

    /**
     * Resetea el perfil de TODOS los usuarios (para desarrollo).
     */
    @Transactional
    public void resetAllProfiles() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        com.relojreducto.entity.Turno diurno = turnoRepository.findByNombreIgnoreCase("HORARIO DIURNO").orElse(null);
        
        for (Usuario usuario : usuarios) {
            usuario.setFotoPerfil(null);
            usuario.setEmailInstitucional(null);
            usuario.setTelefonoCorporativo(null);
            usuario.setNumeroSocio(null);
            usuario.setBiometricoHabilitado(false);
            // Asignar horario diurno a todos
            if (diurno != null) {
                usuario.setTurno(diurno);
            }
        }
        usuarioRepository.saveAll(usuarios);
    }

    /**
     * Desactiva un usuario (soft delete).
     */
    @Transactional
    public void deactivate(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    /**
     * Activa un usuario.
     */
    @Transactional
    public void activate(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        usuario.setActivo(true);
        usuarioRepository.save(usuario);
    }

    /**
     * Obtiene la entidad Usuario por username (uso interno).
     */
    public Usuario getEntityByUsername(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + username));
    }

    /**
     * Obtiene la entidad Usuario por ID (uso interno).
     */
    public Usuario getEntityById(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }
}
