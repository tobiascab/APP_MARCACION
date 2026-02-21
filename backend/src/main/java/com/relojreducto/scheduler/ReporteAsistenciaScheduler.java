package com.relojreducto.scheduler;

import com.relojreducto.entity.Marcacion;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.MarcacionRepository;
import com.relojreducto.repository.UsuarioRepository;
import com.relojreducto.service.NotificationService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Tarea programada que se ejecuta a las 8:30 AM (lunes a viernes)
 * y envía un reporte automático de asistencia a los administradores.
 *
 * El reporte incluye:
 * - Funcionarios que llegaron puntualmente
 * - Funcionarios que llegaron tarde (con minutos de retraso)
 * - Funcionarios ausentes (sin marcación de ENTRADA)
 */
@Component
public class ReporteAsistenciaScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ReporteAsistenciaScheduler.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MarcacionRepository marcacionRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Se ejecuta de lunes a viernes a las 8:30 AM.
     * Cron: segundo minuto hora díaMes mes díaSemana
     * MON-FRI = días laborables
     */
    @Scheduled(cron = "0 30 8 * * MON-FRI")
    public void generarReporteDiario() {
        logger.info("⏰ Ejecutando reporte automático de asistencia...");

        LocalDate hoy = LocalDate.now();
        DayOfWeek dow = hoy.getDayOfWeek();

        // Seguridad extra: no ejecutar en fin de semana
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            logger.info("Hoy es fin de semana, saltando reporte.");
            return;
        }

        try {
            // Obtener empleados activos (no admins puros, solo EMPLEADO y ADMIN_SUCURSAL
            // podrían tener horario)
            List<Usuario> empleadosActivos = usuarioRepository.findByActivoTrue();
            // Filtrar solo empleados con rol EMPLEADO (los que marcan asistencia)
            List<Usuario> empleados = empleadosActivos.stream()
                    .filter(u -> u.getRol() == Usuario.Rol.EMPLEADO || u.getRol() == Usuario.Rol.ADMIN_SUCURSAL)
                    .collect(Collectors.toList());

            if (empleados.isEmpty()) {
                logger.info("No hay empleados activos para reportar");
                return;
            }

            // Rangos de tiempo para hoy
            LocalDateTime inicioHoy = hoy.atStartOfDay();
            LocalDateTime finHoy = hoy.atTime(LocalTime.MAX);

            // Clasificar empleados
            List<Map<String, Object>> puntuales = new ArrayList<>();
            List<Map<String, Object>> tardanzas = new ArrayList<>();
            List<Map<String, Object>> ausentes = new ArrayList<>();

            for (Usuario emp : empleados) {
                Long empId = emp.getId();
                if (empId == null)
                    continue;

                List<Marcacion> marcacionesHoy = marcacionRepository
                        .findByUsuarioIdAndFechaHoraBetweenOrderByFechaHoraDesc(empId, inicioHoy, finHoy);

                // Buscar la primera marcación de ENTRADA
                Optional<Marcacion> primeraEntrada = marcacionesHoy.stream()
                        .filter(m -> m.getTipo() == Marcacion.TipoMarcacion.ENTRADA)
                        .min(Comparator.comparing(Marcacion::getFechaHora));

                if (primeraEntrada.isEmpty()) {
                    // AUSENTE: no tiene marcación de entrada
                    Map<String, Object> info = new HashMap<>();
                    info.put("nombre", emp.getNombreCompleto());
                    info.put("ci", emp.getUsername());
                    info.put("sucursal", emp.getSucursal() != null ? emp.getSucursal().getNombre() : "Sin asignar");
                    ausentes.add(info);
                } else {
                    Marcacion entrada = primeraEntrada.get();
                    LocalTime horaEntradaMarcada = entrada.getFechaHora().toLocalTime();

                    // Determinar hora de entrada esperada del turno
                    LocalTime horaEntradaEsperada = LocalTime.of(8, 0); // por defecto: 08:00
                    int toleranciaMin = 10; // tolerancia por defecto
                    if (emp.getTurno() != null) {
                        if (emp.getTurno().getHoraEntrada() != null) {
                            horaEntradaEsperada = emp.getTurno().getHoraEntrada();
                        }
                        if (emp.getTurno().getToleranciaMinutos() != null) {
                            toleranciaMin = emp.getTurno().getToleranciaMinutos();
                        }
                    }

                    // Calcular minutos de retraso
                    long minutosRetraso = java.time.Duration.between(horaEntradaEsperada, horaEntradaMarcada)
                            .toMinutes();

                    Map<String, Object> info = new HashMap<>();
                    info.put("nombre", emp.getNombreCompleto());
                    info.put("ci", emp.getUsername());
                    info.put("sucursal", emp.getSucursal() != null ? emp.getSucursal().getNombre() : "Sin asignar");
                    info.put("horaEntrada", horaEntradaMarcada.format(DateTimeFormatter.ofPattern("HH:mm")));

                    if (minutosRetraso > toleranciaMin) {
                        // TARDANZA (supera tolerancia del turno)
                        info.put("minutosRetraso", minutosRetraso);
                        info.put("horaEsperada", horaEntradaEsperada.format(DateTimeFormatter.ofPattern("HH:mm")));
                        info.put("tolerancia", toleranciaMin);
                        tardanzas.add(info);
                    } else {
                        // PUNTUAL
                        puntuales.add(info);
                    }
                }
            }

            // Construir mensaje de texto para la notificación
            StringBuilder msg = new StringBuilder();
            msg.append("📊 REPORTE DE ASISTENCIA - ")
                    .append(hoy.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .append("\n\n");

            msg.append("✅ Puntuales: ").append(puntuales.size());
            msg.append(" | ⚠️ Tardanzas: ").append(tardanzas.size());
            msg.append(" | ❌ Ausentes: ").append(ausentes.size());
            msg.append("\n");

            if (!tardanzas.isEmpty()) {
                msg.append("\n⚠️ LLEGADAS TARDÍAS:\n");
                for (Map<String, Object> t : tardanzas) {
                    msg.append("• ").append(t.get("nombre"))
                            .append(" - llegó a las ").append(t.get("horaEntrada"))
                            .append(" (").append(t.get("minutosRetraso")).append(" min tarde)")
                            .append(" [").append(t.get("sucursal")).append("]\n");
                }
            }

            if (!ausentes.isEmpty()) {
                msg.append("\n❌ AUSENTES (sin marcación):\n");
                for (Map<String, Object> a : ausentes) {
                    msg.append("• ").append(a.get("nombre"))
                            .append(" (CI: ").append(a.get("ci")).append(")")
                            .append(" [").append(a.get("sucursal")).append("]\n");
                }
            }

            // Preparar data struct para el frontend
            Map<String, Object> reporteData = new HashMap<>();
            reporteData.put("fecha", hoy.toString());
            reporteData.put("puntuales", puntuales);
            reporteData.put("tardanzas", tardanzas);
            reporteData.put("ausentes", ausentes);
            reporteData.put("totalEmpleados", empleados.size());
            reporteData.put("totalPuntuales", puntuales.size());
            reporteData.put("totalTardanzas", tardanzas.size());
            reporteData.put("totalAusentes", ausentes.size());

            // Enviar a todos los admins via WebSocket
            notificationService.sendAdminAlert("DAILY_REPORT", msg.toString(), reporteData);

            logger.info("✅ Reporte de asistencia enviado: {} puntuales, {} tardanzas, {} ausentes",
                    puntuales.size(), tardanzas.size(), ausentes.size());

        } catch (Exception e) {
            logger.error("❌ Error generando reporte de asistencia: {}", e.getMessage(), e);
        }
    }
}
