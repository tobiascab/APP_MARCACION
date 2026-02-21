package com.relojreducto.service;

import com.relojreducto.dto.PreMarcacionDTO;
import com.relojreducto.entity.PreMarcacion;
import com.relojreducto.entity.Sucursal;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.PreMarcacionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para pre-marcaciones automáticas por geofence.
 * Detecta cuando un empleado entra al rango de su sucursal y registra
 * la hora exacta de llegada. Invisible para el empleado, visible para admin.
 */
@Service
@SuppressWarnings("null")
public class PreMarcacionService {

    private final PreMarcacionRepository preMarcacionRepository;
    private final UsuarioService usuarioService;
    private final NotificationService notificationService;

    public PreMarcacionService(PreMarcacionRepository preMarcacionRepository,
            UsuarioService usuarioService,
            NotificationService notificationService) {
        this.preMarcacionRepository = preMarcacionRepository;
        this.usuarioService = usuarioService;
        this.notificationService = notificationService;
    }

    /**
     * Procesa un check-in de ubicación del empleado.
     * Si el empleado está dentro del geofence de su sucursal y no tiene
     * pre-marcación hoy, crea una automáticamente.
     * 
     * @return Map con el resultado (registrado, ya_existe, fuera_de_rango)
     */
    @Transactional
    public Map<String, Object> procesarCheckIn(Long usuarioId, Double latitud, Double longitud, Double accuracy) {
        Usuario usuario = usuarioService.getEntityById(usuarioId);

        Sucursal sucursal = usuario.getSucursal();
        if (sucursal == null || sucursal.getLatitud() == null || sucursal.getLongitud() == null) {
            return Map.of("status", "sin_sucursal", "message", "Usuario sin sucursal configurada");
        }

        // Calcular distancia al punto central de la sucursal
        double distancia = calcularDistancia(
                latitud, longitud,
                sucursal.getLatitud(), sucursal.getLongitud());

        int radioMaximo = sucursal.getRadioGeocerca() != null ? sucursal.getRadioGeocerca() : 200;

        // ¿Está dentro del geofence?
        if (distancia > radioMaximo) {
            return Map.of(
                    "status", "fuera_de_rango",
                    "distancia", Math.round(distancia),
                    "radioPermitido", radioMaximo);
        }

        // Ya está dentro del rango — ¿ya tiene pre-marcación hoy?
        if (preMarcacionRepository.existsPreMarcacionHoy(usuarioId)) {
            return Map.of("status", "ya_registrado", "message", "Pre-marcación ya existe para hoy");
        }

        // Crear pre-marcación
        PreMarcacion preMarcacion = new PreMarcacion();
        preMarcacion.setFechaHoraDeteccion(LocalDateTime.now());
        preMarcacion.setLatitud(latitud);
        preMarcacion.setLongitud(longitud);
        preMarcacion.setDistanciaMetros(distancia);
        preMarcacion.setPrecisionGps(accuracy);
        preMarcacion.setUsuario(usuario);
        preMarcacion.setSucursal(sucursal);

        PreMarcacion saved = preMarcacionRepository.save(preMarcacion);

        // Notificar al admin silenciosamente
        String msg = String.format("📍 %s detectado en %s (distancia: %dm)",
                usuario.getNombreCompleto(),
                sucursal.getNombre(),
                Math.round(distancia));
        notificationService.sendAdminAlert("PRE_MARKING", msg, PreMarcacionDTO.fromEntity(saved));

        return Map.of(
                "status", "registrado",
                "preMarcacionId", saved.getId(),
                "hora", saved.getFechaHoraDeteccion().toString());
    }

    /**
     * Obtiene las pre-marcaciones de hoy con comparación de marcaciones oficiales.
     * Solo para admin.
     */
    public List<PreMarcacionDTO> getPreMarcacionesDeHoy() {
        return preMarcacionRepository.findAllPreMarcacionesDeHoy().stream()
                .map(PreMarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene pre-marcaciones por rango de fechas.
     */
    public List<PreMarcacionDTO> getPreMarcacionesByRango(LocalDate inicio, LocalDate fin) {
        LocalDateTime inicioDT = inicio.atStartOfDay();
        LocalDateTime finDT = fin.atTime(LocalTime.MAX);
        return preMarcacionRepository
                .findByFechaHoraDeteccionBetweenOrderByFechaHoraDeteccionDesc(inicioDT, finDT)
                .stream()
                .map(PreMarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene la primera pre-marcación del día para un usuario (hora real de
     * llegada).
     */
    public PreMarcacionDTO getPrimeraPreMarcacion(Long usuarioId) {
        List<PreMarcacion> lista = preMarcacionRepository.findPrimeraPreMarcacionDeHoy(usuarioId);
        if (lista.isEmpty())
            return null;
        return PreMarcacionDTO.fromEntity(lista.get(0));
    }

    /**
     * Obtiene pre-marcaciones por sucursal y rango.
     */
    public List<PreMarcacionDTO> getPreMarcacionesBySucursalAndRango(Long sucursalId, LocalDate inicio, LocalDate fin) {
        LocalDateTime inicioDT = inicio.atStartOfDay();
        LocalDateTime finDT = fin.atTime(LocalTime.MAX);
        return preMarcacionRepository
                .findBySucursalIdAndFechaHoraDeteccionBetweenOrderByFechaHoraDeteccionDesc(sucursalId, inicioDT, finDT)
                .stream()
                .map(PreMarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Calcula distancia Haversine en metros.
     */
    private double calcularDistancia(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
