package com.relojreducto.controller;

import org.springframework.lang.NonNull;
import java.util.Objects;

import com.relojreducto.dto.TurnoDTO;
import com.relojreducto.dto.PermisoDTO;
import com.relojreducto.dto.FeriadoDTO;
import com.relojreducto.entity.Turno;
import com.relojreducto.entity.Permiso;
import com.relojreducto.entity.Permiso.EstadoPermiso;
import com.relojreducto.entity.Feriado;

import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.TurnoRepository;
import com.relojreducto.repository.PermisoRepository;
import com.relojreducto.repository.FeriadoRepository;
import com.relojreducto.repository.UsuarioRepository;
import com.relojreducto.repository.SucursalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/gestion")
@CrossOrigin(origins = { "http://localhost:5173", "https://localhost:5173" })
public class GestionController {

    private final TurnoRepository turnoRepository;
    private final PermisoRepository permisoRepository;
    private final FeriadoRepository feriadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalRepository sucursalRepository;

    public GestionController(TurnoRepository turnoRepository, PermisoRepository permisoRepository,
            FeriadoRepository feriadoRepository, UsuarioRepository usuarioRepository,
            SucursalRepository sucursalRepository) {
        this.turnoRepository = turnoRepository;
        this.permisoRepository = permisoRepository;
        this.feriadoRepository = feriadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.sucursalRepository = sucursalRepository;
    }

    // ==================== TURNOS ====================

    @GetMapping("/turnos")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<List<TurnoDTO>> getTurnos() {
        List<TurnoDTO> turnos = turnoRepository.findByActivoTrueOrderByNombreAsc()
                .stream()
                .map(TurnoDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(turnos);
    }

    @GetMapping("/turnos/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TurnoDTO>> getAllTurnos() {
        List<TurnoDTO> turnos = turnoRepository.findAll()
                .stream()
                .map(TurnoDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(turnos);
    }

    @PostMapping("/turnos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TurnoDTO> createTurno(@RequestBody TurnoDTO dto) {
        Turno turno = new Turno();
        turno.setNombre(dto.getNombre());
        turno.setHoraEntrada(dto.getHoraEntrada());
        turno.setHoraSalida(dto.getHoraSalida());
        turno.setToleranciaMinutos(dto.getToleranciaMinutos() != null ? dto.getToleranciaMinutos() : 10);
        turno.setDiasSemana(dto.getDiasSemana() != null ? dto.getDiasSemana() : "1,2,3,4,5");
        turno.setActivo(true);

        Turno saved = turnoRepository.save(turno);
        return ResponseEntity.ok(TurnoDTO.fromEntity(saved));
    }

    @PutMapping("/turnos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TurnoDTO> updateTurno(@PathVariable @NonNull Long id, @RequestBody TurnoDTO dto) {
        return turnoRepository.findById(Objects.requireNonNull(id))
                .map(turno -> {
                    if (dto.getNombre() != null)
                        turno.setNombre(dto.getNombre());
                    if (dto.getHoraEntrada() != null)
                        turno.setHoraEntrada(dto.getHoraEntrada());
                    if (dto.getHoraSalida() != null)
                        turno.setHoraSalida(dto.getHoraSalida());
                    if (dto.getToleranciaMinutos() != null)
                        turno.setToleranciaMinutos(dto.getToleranciaMinutos());
                    if (dto.getDiasSemana() != null)
                        turno.setDiasSemana(dto.getDiasSemana());
                    if (dto.getActivo() != null)
                        turno.setActivo(dto.getActivo());

                    Turno updated = turnoRepository.save(Objects.requireNonNull(turno));
                    return ResponseEntity.ok(TurnoDTO.fromEntity(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/turnos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTurno(@PathVariable @NonNull Long id) {
        return turnoRepository.findById(Objects.requireNonNull(id))
                .map(turno -> {
                    turno.setActivo(false);
                    turnoRepository.save(turno);
                    return ResponseEntity.ok(Map.of("mensaje", "Turno desactivado"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== PERMISOS ====================

    @GetMapping("/permisos")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<List<PermisoDTO>> getPermisos(@RequestParam(required = false) String estado,
            Authentication auth) {
        Usuario actual = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        List<Permiso> permisos;

        if (estado != null && !estado.isEmpty()) {
            permisos = permisoRepository.findByEstadoOrderByFechaSolicitudDesc(EstadoPermiso.valueOf(estado));
        } else {
            permisos = permisoRepository.findAllByOrderByFechaSolicitudDesc();
        }

        // Protección IDOR: El ADMIN_SUCURSAL solo ve permisos de su sucursal
        if (actual != null && actual.getRol() == Usuario.Rol.ADMIN_SUCURSAL && actual.getSucursal() != null) {
            permisos = permisos.stream()
                    .filter(p -> p.getUsuario().getSucursal() != null &&
                            p.getUsuario().getSucursal().getId().equals(actual.getSucursal().getId()))
                    .collect(Collectors.toList());
        }

        List<PermisoDTO> dtos = permisos.stream()
                .map(PermisoDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/permisos/mis-permisos")
    public ResponseEntity<List<PermisoDTO>> getMisPermisos(Authentication auth) {
        Usuario usuario = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        if (usuario == null) {
            return ResponseEntity.notFound().build();
        }

        List<PermisoDTO> permisos = permisoRepository.findByUsuarioIdOrderByFechaSolicitudDesc(usuario.getId())
                .stream()
                .map(PermisoDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(permisos);
    }

    @PostMapping("/permisos")
    public ResponseEntity<PermisoDTO> solicitarPermiso(@RequestBody PermisoDTO dto, Authentication auth) {
        Usuario usuario = usuarioRepository.findByUsername(auth.getName()).orElse(null);
        if (usuario == null) {
            return ResponseEntity.badRequest().build();
        }

        Permiso permiso = new Permiso();
        permiso.setUsuario(usuario);
        permiso.setTipo(dto.getTipo());
        permiso.setFechaInicio(dto.getFechaInicio());
        permiso.setFechaFin(dto.getFechaFin());
        permiso.setMotivo(dto.getMotivo());
        permiso.setEstado(EstadoPermiso.PENDIENTE);

        Permiso saved = permisoRepository.save(permiso);
        return ResponseEntity.ok(PermisoDTO.fromEntity(saved));
    }

    @PutMapping("/permisos/{id}/aprobar")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<?> aprobarPermiso(@PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Usuario aprobador = usuarioRepository.findByUsername(auth.getName()).orElse(null);

        return permisoRepository.findById(Objects.requireNonNull(id))
                .map(permiso -> {
                    // Protección IDOR
                    if (aprobador.getRol() == Usuario.Rol.ADMIN_SUCURSAL) {
                        if (permiso.getUsuario().getSucursal() == null ||
                                !permiso.getUsuario().getSucursal().getId().equals(aprobador.getSucursal().getId())) {
                            return ResponseEntity.status(403).body(
                                    Map.of("error", "No tiene permiso para aprobar este permiso de otra sucursal"));
                        }
                    }

                    permiso.setEstado(EstadoPermiso.APROBADO);
                    permiso.setAprobadoPor(aprobador);
                    permiso.setComentarioAprobacion(body.get("comentario"));
                    permiso.setFechaResolucion(LocalDateTime.now());

                    Permiso updated = permisoRepository.save(permiso);
                    return ResponseEntity.ok(PermisoDTO.fromEntity(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/permisos/{id}/rechazar")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
    public ResponseEntity<?> rechazarPermiso(@PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Usuario aprobador = usuarioRepository.findByUsername(auth.getName()).orElse(null);

        return permisoRepository.findById(Objects.requireNonNull(id))
                .map(permiso -> {
                    // Protección IDOR
                    if (aprobador.getRol() == Usuario.Rol.ADMIN_SUCURSAL) {
                        if (permiso.getUsuario().getSucursal() == null ||
                                !permiso.getUsuario().getSucursal().getId().equals(aprobador.getSucursal().getId())) {
                            return ResponseEntity.status(403).body(
                                    Map.of("error", "No tiene permiso para rechazar este permiso de otra sucursal"));
                        }
                    }

                    permiso.setEstado(EstadoPermiso.RECHAZADO);
                    permiso.setAprobadoPor(aprobador);
                    permiso.setComentarioAprobacion(body.get("comentario"));
                    permiso.setFechaResolucion(LocalDateTime.now());

                    Permiso updated = permisoRepository.save(permiso);
                    return ResponseEntity.ok(PermisoDTO.fromEntity(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== FERIADOS ====================

    @GetMapping("/feriados")
    public ResponseEntity<List<FeriadoDTO>> getFeriados(@RequestParam(required = false) Integer year) {
        List<Feriado> feriados;
        if (year != null) {
            feriados = feriadoRepository.findByYear(year);
        } else {
            feriados = feriadoRepository.findByYear(LocalDate.now().getYear());
        }

        List<FeriadoDTO> dtos = feriados.stream()
                .map(FeriadoDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/feriados")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createFeriado(@RequestBody FeriadoDTO dto) {
        if (feriadoRepository.existsByFecha(dto.getFecha())) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Ya existe un feriado en esa fecha"));
        }

        Feriado feriado = new Feriado();
        feriado.setFecha(dto.getFecha());
        feriado.setDescripcion(dto.getDescripcion());
        feriado.setEsNacional(dto.getEsNacional() != null ? dto.getEsNacional() : true);

        if (dto.getSucursalId() != null) {
            sucursalRepository.findById(Objects.requireNonNull(dto.getSucursalId()))
                    .ifPresent(feriado::setSucursal);
        }

        Feriado saved = feriadoRepository.save(feriado);
        return ResponseEntity.ok(FeriadoDTO.fromEntity(saved));
    }

    @PutMapping("/feriados/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeriadoDTO> updateFeriado(@PathVariable @NonNull Long id, @RequestBody FeriadoDTO dto) {
        return feriadoRepository.findById(Objects.requireNonNull(id))
                .map(feriado -> {
                    if (dto.getFecha() != null)
                        feriado.setFecha(dto.getFecha());
                    if (dto.getDescripcion() != null)
                        feriado.setDescripcion(dto.getDescripcion());
                    if (dto.getEsNacional() != null)
                        feriado.setEsNacional(dto.getEsNacional());

                    Feriado updated = feriadoRepository.save(Objects.requireNonNull(feriado));
                    return ResponseEntity.ok(FeriadoDTO.fromEntity(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/feriados/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteFeriado(@PathVariable @NonNull Long id) {
        return feriadoRepository.findById(Objects.requireNonNull(id))
                .map(feriado -> {
                    feriadoRepository.delete(Objects.requireNonNull(feriado));
                    return ResponseEntity.ok(Map.of("mensaje", "Feriado eliminado"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/feriados/check/{fecha}")
    public ResponseEntity<Map<String, Object>> checkFeriado(@PathVariable String fecha) {
        LocalDate date = LocalDate.parse(fecha);
        boolean esFeriado = feriadoRepository.existsByFecha(date);

        if (esFeriado) {
            Feriado feriado = feriadoRepository.findByFecha(date).orElse(null);
            return ResponseEntity.ok(Map.of(
                    "esFeriado", true,
                    "descripcion", feriado != null ? feriado.getDescripcion() : ""));
        }

        return ResponseEntity.ok(Map.of("esFeriado", false));
    }
}
