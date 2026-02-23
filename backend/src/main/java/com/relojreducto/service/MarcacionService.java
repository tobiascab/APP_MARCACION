package com.relojreducto.service;

import com.relojreducto.dto.MarcacionDTO;
import com.relojreducto.dto.MarcacionRequest;
import com.relojreducto.entity.Marcacion;
import com.relojreducto.entity.Sucursal;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.MarcacionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de marcaciones con validación de horarios.
 */
@Service
@SuppressWarnings("null")
public class MarcacionService {

    private static final Logger log = LoggerFactory.getLogger(MarcacionService.class);

    private final MarcacionRepository marcacionRepository;
    private final UsuarioService usuarioService;
    private final NotificationService notificationService;

    public MarcacionService(MarcacionRepository marcacionRepository,
            UsuarioService usuarioService,
            NotificationService notificationService) {
        this.marcacionRepository = marcacionRepository;
        this.usuarioService = usuarioService;
        this.notificationService = notificationService;
    }

    // ===============================
    // CONFIGURACIÓN DE REGLAS BASES
    // ===============================
    private static final int MIN_MINUTOS_JORNADA = 480; // 8 horas por defecto si no hay turno
    private static final int DIAS_LABORALES_MES = 26; 
    private static final int MINUTOS_COOLDOWN = 120; // Reducido a 2 horas mínimo entre marcaciones
    private static final int MAX_MARCACIONES_DIA = 2;

    /**
     * Crea una nueva marcación para el usuario actual.
     * Valida horarios y calcula descuentos por tardanza.
     */
    @Transactional
    public MarcacionDTO registrarMarcacion(Long usuarioId, MarcacionRequest request) {
        Usuario usuario = usuarioService.getEntityById(usuarioId);

        // Validar geolocalización si es requerida
        if (Boolean.TRUE.equals(usuario.getRequiereGeolocalizacion())) {
            if (request.getLatitud() == null || request.getLongitud() == null) {
                throw new RuntimeException("La geolocalización es obligatoria para este usuario.");
            }

            // --- DETECCIÓN DE UBICACIÓN FALSA (ANTI-MOCK GPS) ---
            // 1. Si el dispositivo reporta explícitamente que es falsa
            if (Boolean.TRUE.equals(request.getIsMocked())) {
                throw new RuntimeException(
                        "¡Actividad sospechosa detectada! Por favor, desactive las aplicaciones de 'Ubicación Falsa' (Mock Location) para marcar.");
            }

            // 2. Validar precisión (si es demasiado baja o sospechosamente exacta)
            if (request.getAccuracy() != null) {
                // Una precisión de 0 es imposible en un GPS real, es típico de simuladores
                if (request.getAccuracy() == 0) {
                    throw new RuntimeException("Precisión de GPS inválida. Asegúrese de tener buena señal.");
                }
                // Si la precisión es muy mala (> 200m), no es confiable para geocerca
                if (request.getAccuracy() > 200) {
                    throw new RuntimeException("La precisión de su GPS es insuficiente (" + request.getAccuracy()
                            + "m). Acerquese a un lugar despejado.");
                }
            }

            // Validar geocerca de sucursal
            if (!Boolean.TRUE.equals(usuario.getSiempreEnUbicacion())) {
                validarGeocerca(usuario, request.getLatitud(), request.getLongitud());
            }
        }

        LocalDateTime ahora = LocalDateTime.now();
        LocalTime horaActual = ahora.toLocalTime();

        // === VALIDACIÓN ANTI-SPAM: Límite de marcaciones por día ===
        List<Marcacion> marcacionesHoy = marcacionRepository.findMarcacionesDeHoy(usuarioId);

        if (marcacionesHoy.size() >= MAX_MARCACIONES_DIA) {
            throw new RuntimeException(
                    "Ya completaste tu jornada de hoy (entrada y salida registradas). " +
                            "Solo puedes realizar " + MAX_MARCACIONES_DIA + " marcaciones por día.");
        }

        // === VALIDACIÓN ANTI-SPAM: Cooldown entre marcaciones ===
        if (!marcacionesHoy.isEmpty()) {
            Marcacion ultimaMarcacion = marcacionesHoy.get(0); // La más reciente
            long minutosDesdeUltima = ChronoUnit.MINUTES.between(
                    ultimaMarcacion.getFechaHora(), ahora);

            if (minutosDesdeUltima < MINUTOS_COOLDOWN) {
                long minutosRestantes = MINUTOS_COOLDOWN - minutosDesdeUltima;
                long horasRestantes = minutosRestantes / 60;
                long minsRestantes = minutosRestantes % 60;

                String tiempoRestante = horasRestantes > 0
                        ? horasRestantes + "h " + minsRestantes + "min"
                        : minsRestantes + " minutos";

                throw new RuntimeException(
                        "Ya registraste tu marcación de " + ultimaMarcacion.getTipo().name() +
                                ". Podrás marcar nuevamente en " + tiempoRestante + ".");
            }
        }

        // Determinar el tipo de marcación (Entrada o Salida)
        Marcacion.TipoMarcacion tipo = determinarTipoMarcacion(usuarioId);

        // Turno del usuario
        com.relojreducto.entity.Turno turno = usuario.getTurno();
        LocalTime shiftEntrada = (turno != null) ? turno.getHoraEntrada() : LocalTime.of(8, 0);
        LocalTime shiftSalida = (turno != null) ? turno.getHoraSalida() : LocalTime.of(17, 0);

        // Calcular tardanza y descuento para ENTRADA
        boolean esTardia = false;
        int minutosTarde = 0;
        BigDecimal descuento = BigDecimal.ZERO;

        if (tipo == Marcacion.TipoMarcacion.ENTRADA) {
            // Se permite marcar entrada a cualquier hora (incluso muy temprano como pidió el usuario)
            if (horaActual.isAfter(shiftEntrada)) {
                esTardia = true;
                minutosTarde = (int) ChronoUnit.MINUTES.between(shiftEntrada, horaActual);
                
                // Margen de tolerancia
                int tolerancia = (turno != null) ? turno.getToleranciaMinutos() : 10;
                if (minutosTarde <= tolerancia) {
                    esTardia = false;
                    minutosTarde = 0;
                } else {
                    descuento = calcularDescuento(usuario, minutosTarde);
                }
            }
        }
        
        // La marcación de SALIDA se permite siempre, ya sea antes o después del horario oficial
        // Esto permite registrar horas extra y salidas flexibles solicitadas.

        // Detectar dispositivo compartido
        boolean esDispositivoCompartido = false;
        String compartidoCon = null;
        String fingerprint = request.getDeviceFingerprint();

        if (fingerprint != null && !fingerprint.isEmpty()) {
            List<Marcacion> otrosMismoDispositivo = marcacionRepository
                    .findByDeviceFingerprintAndNotUsuarioHoy(fingerprint, usuarioId);
            if (!otrosMismoDispositivo.isEmpty()) {
                esDispositivoCompartido = true;
                StringBuilder nombres = new StringBuilder();
                java.util.Set<String> nombresUnicos = new java.util.HashSet<>();
                for (Marcacion m : otrosMismoDispositivo) {
                    String nombre = m.getUsuario().getNombreCompleto();
                    if (nombresUnicos.add(nombre)) {
                        if (nombres.length() > 0) nombres.append(", ");
                        nombres.append(nombre);
                    }
                }
                compartidoCon = nombres.toString();
                log.warn("⚠️ DISPOSITIVO COMPARTIDO: {} usó el mismo dispositivo ({}) que: {}",
                        usuario.getNombreCompleto(), fingerprint, compartidoCon);
            }
        }

        Marcacion marcacion = Marcacion.builder()
                .fechaHora(ahora)
                .tipo(tipo)
                .latitud(request.getLatitud())
                .longitud(request.getLongitud())
                .direccion(request.getDireccion())
                .dispositivo(request.getDispositivo())
                .observacion(request.getObservacion())
                .esTardia(esTardia)
                .minutosTarde(minutosTarde)
                .descuentoCalculado(descuento)
                .usuario(usuario)
                .deviceFingerprint(fingerprint)
                .dispositivoCompartido(esDispositivoCompartido)
                .dispositivoCompartidoCon(compartidoCon)
                .build();

        Marcacion saved = marcacionRepository.save(marcacion);

        // Notificación en tiempo real para el admin
        String alertMsg = String.format("%s marcó %s en %s",
                usuario.getNombreCompleto(),
                tipo == Marcacion.TipoMarcacion.ENTRADA ? "ENTRADA" : "SALIDA",
                usuario.getSucursal() != null ? usuario.getSucursal().getNombre() : "Ubicación General");

        if (esDispositivoCompartido) {
            alertMsg += " ⚠️ DISPOSITIVO COMPARTIDO con " + compartidoCon;
        }

        notificationService.sendAdminAlert("MARKING", alertMsg, MarcacionDTO.fromEntity(saved));

        return MarcacionDTO.fromEntity(saved);
    }

    /**
     * Calcula el descuento por tardanza basado en:
     * descuento = (minutosTarde / minutosJornada) * (salarioMensual /
     * diasLaborales)
     * El descuento NUNCA puede superar el jornal diario.
     */
    private BigDecimal calcularDescuento(Usuario usuario, int minutosTarde) {
        if (usuario.getSalarioMensual() == null ||
                usuario.getSalarioMensual().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        // Jornal diario = salario mensual / días laborales
        BigDecimal jornalDiario = usuario.getSalarioMensual()
                .divide(BigDecimal.valueOf(DIAS_LABORALES_MES), 4, RoundingMode.HALF_UP);

        // Minutos de jornada del turno
        int minsJornada = MIN_MINUTOS_JORNADA;
        if (usuario.getTurno() != null) {
            minsJornada = (int) ChronoUnit.MINUTES.between(
                usuario.getTurno().getHoraEntrada(), 
                usuario.getTurno().getHoraSalida()
            );
            if (minsJornada <= 0) minsJornada = MIN_MINUTOS_JORNADA;
        }

        // Valor por minuto = jornal diario / minutos de jornada
        BigDecimal valorMinuto = jornalDiario
                .divide(BigDecimal.valueOf(minsJornada), 4, RoundingMode.HALF_UP);

        // Descuento = minutos tarde * valor por minuto
        BigDecimal descuentoCalculado = valorMinuto.multiply(BigDecimal.valueOf(minutosTarde))
                .setScale(0, RoundingMode.HALF_UP);

        // LIMITAR: El descuento NO puede superar el jornal diario
        if (descuentoCalculado.compareTo(jornalDiario) > 0) {
            return jornalDiario.setScale(0, RoundingMode.HALF_UP);
        }

        return descuentoCalculado;
    }

    /**
     * Determina el tipo de marcación según el historial del día.
     */
    public Marcacion.TipoMarcacion determinarTipoMarcacion(Long usuarioId) {
        List<Marcacion> marcacionesHoy = marcacionRepository.findMarcacionesDeHoy(usuarioId);

        if (marcacionesHoy.isEmpty()) {
            return Marcacion.TipoMarcacion.ENTRADA;
        }

        Marcacion ultimaMarcacion = marcacionesHoy.get(0);

        if (ultimaMarcacion.getTipo() == Marcacion.TipoMarcacion.ENTRADA) {
            return Marcacion.TipoMarcacion.SALIDA;
        } else {
            return Marcacion.TipoMarcacion.ENTRADA;
        }
    }

    /**
     * Obtiene el estado actual de marcación de un usuario.
     */
    public String getEstadoActual(Long usuarioId) {
        return determinarTipoMarcacion(usuarioId).name();
    }

    /**
     * Verifica si se puede marcar en el horario actual.
     */
    public boolean puedeMarcar(Long usuarioId) {
        // Ahora siempre se puede marcar, independientemente del horario, 
        // eliminando bloqueos de salida temprana o entrada muy anticipada.
        return true; 
    }

    /**
     * Obtiene información del horario configurado.
     */
    public java.util.Map<String, Object> getInfoHorario(Long usuarioId) {
        Usuario usuario = usuarioService.getEntityById(usuarioId);
        Marcacion.TipoMarcacion tipo = determinarTipoMarcacion(usuarioId);
        LocalTime horaActual = LocalTime.now();
        
        com.relojreducto.entity.Turno turno = usuario.getTurno();
        LocalTime shiftEntrada = (turno != null) ? turno.getHoraEntrada() : LocalTime.of(8, 0);
        LocalTime shiftSalida = (turno != null) ? turno.getHoraSalida() : LocalTime.of(17, 0);

        java.util.Map<String, Object> info = new java.util.HashMap<>();
        info.put("proximaMarcacion", tipo.name());
        info.put("horaEntrada", shiftEntrada.toString());
        info.put("horaSalida", shiftSalida.toString());
        info.put("puedeMarcar", true);

        if (tipo == Marcacion.TipoMarcacion.ENTRADA && horaActual.isAfter(shiftEntrada)) {
            int minutosTarde = (int) ChronoUnit.MINUTES.between(shiftEntrada, horaActual);
            int t = (turno != null) ? turno.getToleranciaMinutos() : 10;
            if (minutosTarde > t) {
                info.put("esTarde", true);
                info.put("minutosTarde", minutosTarde);
            } else {
                info.put("esTarde", false);
                info.put("minutosTarde", 0);
            }
        } else {
            info.put("esTarde", false);
            info.put("minutosTarde", 0);
        }

        // Eliminamos la lógica de minutos restates bloqueantes para salida
        info.put("minutosParaSalida", 0);

        return info;
    }

    /**
     * Obtiene las marcaciones del día actual para un usuario.
     */
    public List<MarcacionDTO> getMarcacionesDeHoy(Long usuarioId) {
        return marcacionRepository.findMarcacionesDeHoy(usuarioId).stream()
                .map(MarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las marcaciones de un usuario.
     */
    public List<MarcacionDTO> getMarcacionesByUsuario(Long usuarioId) {
        return marcacionRepository.findByUsuarioIdOrderByFechaHoraDesc(usuarioId).stream()
                .map(MarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene marcaciones en un rango de fechas.
     */
    public List<MarcacionDTO> getMarcacionesByRango(LocalDate inicio, LocalDate fin) {
        if (ChronoUnit.DAYS.between(inicio, fin) > 90) {
            throw new IllegalArgumentException("El rango de fechas no puede superar los 90 días.");
        }
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);

        return marcacionRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(inicioDateTime, finDateTime)
                .stream()
                .map(MarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene marcaciones de un usuario en un rango de fechas.
     */
    public List<MarcacionDTO> getMarcacionesByUsuarioAndRango(Long usuarioId, LocalDate inicio, LocalDate fin) {
        if (ChronoUnit.DAYS.between(inicio, fin) > 90) {
            throw new IllegalArgumentException("El rango de fechas no puede superar los 90 días.");
        }
        LocalDateTime inicioDateTime = inicio.atStartOfDay();
        LocalDateTime finDateTime = fin.atTime(LocalTime.MAX);

        return marcacionRepository.findByUsuarioIdAndFechaHoraBetweenOrderByFechaHoraDesc(
                usuarioId, inicioDateTime, finDateTime)
                .stream()
                .map(MarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene la última marcación de un usuario.
     */
    public Optional<MarcacionDTO> getUltimaMarcacion(Long usuarioId) {
        return marcacionRepository.findTopByUsuarioIdOrderByFechaHoraDesc(usuarioId)
                .map(MarcacionDTO::fromEntity);
    }

    /**
     * Obtiene todas las marcaciones (para admin).
     */
    public List<MarcacionDTO> getAllMarcaciones() {
        return marcacionRepository.findAll().stream()
                .map(MarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las marcaciones de una sucursal.
     */
    public List<MarcacionDTO> getMarcacionesBySucursal(Long sucursalId) {
        return marcacionRepository.findByUsuario_Sucursal_IdOrderByFechaHoraDesc(sucursalId).stream()
                .map(MarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene marcaciones de una sucursal en un rango de fechas.
     */
    public List<MarcacionDTO> getMarcacionesBySucursalAndRango(Long sucursalId, LocalDate inicio, LocalDate fin) {
        LocalDateTime inicioDT = inicio.atStartOfDay();
        LocalDateTime finDT = fin.atTime(LocalTime.MAX);
        return marcacionRepository
                .findByUsuario_Sucursal_IdAndFechaHoraBetweenOrderByFechaHoraDesc(sucursalId, inicioDT, finDT)
                .stream()
                .map(MarcacionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Valida si el usuario está dentro del radio permitido de su sucursal.
     */
    private void validarGeocerca(Usuario usuario, Double latUsuario, Double lonUsuario) {
        Sucursal sucursal = usuario.getSucursal();
        if (sucursal == null)
            return; // Si no tiene sucursal, no validamos geocerca específica

        if (sucursal.getLatitud() == null || sucursal.getLongitud() == null) {
            return; // Sucursal sin coordenadas definidas
        }

        double distancia = calcularDistancia(
                latUsuario, lonUsuario,
                sucursal.getLatitud(), sucursal.getLongitud());

        int radioMaximo = sucursal.getRadioGeocerca() != null ? sucursal.getRadioGeocerca() : 200;

        if (distancia > radioMaximo) {
            String distFormateada = distancia > 1000 ? String.format("%.2f km", distancia / 1000)
                    : String.format("%d metros", (int) distancia);

            String errorMsg = "Estás fuera del radio permitido de tu sucursal (" + sucursal.getNombre() + "). " +
                    "Distancia actual: " + distFormateada + ". Radio permitido: " + radioMaximo + "m.";

            // Alerta de seguridad para el admin
            notificationService.sendAdminAlert("SECURITY_WARNING",
                    usuario.getNombreCompleto() + " intentó marcar fuera de rango.",
                    java.util.Map.of("usuario", usuario.getNombreCompleto(), "sucursal", sucursal.getNombre(),
                            "distancia", distFormateada));

            throw new RuntimeException(errorMsg);
        }
    }

    /**
     * Calcula la distancia en metros entre dos coordenadas (Haversine).
     */
    private double calcularDistancia(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Radio de la Tierra en metros

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Calcula el total de descuentos por tardanzas en un período.
     */
    public BigDecimal getTotalDescuentos(Long usuarioId, LocalDate inicio, LocalDate fin) {
        List<Marcacion> marcaciones = marcacionRepository.findByUsuarioIdAndFechaHoraBetweenOrderByFechaHoraDesc(
                usuarioId, inicio.atStartOfDay(), fin.atTime(LocalTime.MAX));

        return marcaciones.stream()
                .filter(m -> m.getEsTardia() != null && m.getEsTardia())
                .map(m -> m.getDescuentoCalculado() != null ? m.getDescuentoCalculado() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Obtiene el número de llegadas tardías del usuario en el mes actual.
     */
    public long getLlegadasTardiasMes(Long usuarioId) {
        LocalDate inicioMes = LocalDate.now().withDayOfMonth(1);
        LocalDate finMes = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        List<Marcacion> marcacionesMes = marcacionRepository.findByUsuarioIdAndFechaHoraBetweenOrderByFechaHoraDesc(
                usuarioId, inicioMes.atStartOfDay(), finMes.atTime(LocalTime.MAX));

        return marcacionesMes.stream()
                .filter(m -> Boolean.TRUE.equals(m.getEsTardia()))
                .count();
    }

    /**
     * Resetea todas las marcaciones del sistema.
     * Únicamente para fines de desarrollo y pruebas.
     */
    @Transactional
    public void resetAllMarcaciones() {
        marcacionRepository.deleteAll();
    }
}
