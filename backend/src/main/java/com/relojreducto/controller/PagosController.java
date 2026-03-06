package com.relojreducto.controller;

import com.relojreducto.entity.Marcacion;
import com.relojreducto.entity.Usuario;
import com.relojreducto.repository.MarcacionRepository;
import com.relojreducto.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller para el módulo de Pagos y Descuentos.
 * Calcula descuentos por tardanzas y ausencias basados en el salario de cada
 * empleado.
 */
@RestController
@RequestMapping("/api/admin/pagos")
@PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_SUCURSAL')")
public class PagosController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MarcacionRepository marcacionRepository;

    /**
     * GET /api/admin/pagos/resumen?mes=2026-02
     * Retorna el resumen de pagos de todos los empleados para un mes dado.
     */
    @GetMapping("/resumen")
    public Map<String, Object> getResumenPagos(
            @RequestParam String mes) {

        // Parsear mes (formato: YYYY-MM)
        String[] parts = mes.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        LocalDate inicio = LocalDate.of(year, month, 1);
        LocalDate fin = inicio.withDayOfMonth(inicio.lengthOfMonth());

        List<Usuario> empleados = usuarioRepository.findAll().stream()
                .filter(u -> u.getActivo() != null && u.getActivo())
                .collect(Collectors.toList());

        List<Map<String, Object>> listaEmpleados = new ArrayList<>();
        BigDecimal totalSalarios = BigDecimal.ZERO;
        BigDecimal totalDescuentos = BigDecimal.ZERO;
        BigDecimal totalNeto = BigDecimal.ZERO;
        int totalTardanzas = 0;
        int totalAusencias = 0;

        for (Usuario emp : empleados) {
            Map<String, Object> data = calcularDescuentoEmpleado(emp, inicio, fin);
            listaEmpleados.add(data);

            BigDecimal salario = (BigDecimal) data.get("salarioMensual");
            BigDecimal descuento = (BigDecimal) data.get("totalDescuento");
            BigDecimal neto = (BigDecimal) data.get("salarioNeto");

            totalSalarios = totalSalarios.add(salario);
            totalDescuentos = totalDescuentos.add(descuento);
            totalNeto = totalNeto.add(neto);
            totalTardanzas += (int) data.get("diasTardanza");
            totalAusencias += (int) data.get("diasAusencia");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mes", mes);
        result.put("periodoInicio", inicio.toString());
        result.put("periodoFin", fin.toString());
        result.put("totalEmpleados", empleados.size());
        result.put("totalSalarios", totalSalarios);
        result.put("totalDescuentos", totalDescuentos);
        result.put("totalNeto", totalNeto);
        result.put("totalTardanzas", totalTardanzas);
        result.put("totalAusencias", totalAusencias);
        result.put("empleados", listaEmpleados);

        return result;
    }

    /**
     * GET /api/admin/pagos/empleado/{id}?mes=2026-02
     * Retorna el detalle de pago de un empleado.
     */
    @GetMapping("/empleado/{id}")
    public Map<String, Object> getDetalleEmpleado(
            @PathVariable Long id,
            @RequestParam String mes) {

        String[] parts = mes.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        LocalDate inicio = LocalDate.of(year, month, 1);
        LocalDate fin = inicio.withDayOfMonth(inicio.lengthOfMonth());

        Usuario emp = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return calcularDescuentoEmpleado(emp, inicio, fin);
    }

    /**
     * PUT /api/admin/pagos/salario/{id}
     * Actualiza el salario de un empleado.
     */
    @PutMapping("/salario/{id}")
    public Map<String, Object> actualizarSalario(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Usuario emp = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        BigDecimal nuevoSalario = new BigDecimal(body.get("salarioMensual").toString());
        emp.setSalarioMensual(nuevoSalario);
        usuarioRepository.save(emp);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", emp.getId());
        result.put("nombreCompleto", emp.getNombreCompleto());
        result.put("salarioMensual", emp.getSalarioMensual());
        result.put("message", "Salario actualizado correctamente");
        return result;
    }

    /**
     * PUT /api/admin/pagos/salarios-masivo
     * Actualiza salarios de múltiples empleados.
     */
    @PutMapping("/salarios-masivo")
    public Map<String, Object> actualizarSalariosMasivo(
            @RequestBody List<Map<String, Object>> empleados) {

        int actualizados = 0;
        List<String> errores = new ArrayList<>();

        for (Map<String, Object> item : empleados) {
            try {
                Long empId = Long.parseLong(item.get("id").toString());
                BigDecimal salario = new BigDecimal(item.get("salarioMensual").toString());

                Usuario emp = usuarioRepository.findById(empId).orElse(null);
                if (emp != null) {
                    emp.setSalarioMensual(salario);
                    usuarioRepository.save(emp);
                    actualizados++;
                } else {
                    errores.add("Usuario ID " + empId + " no encontrado");
                }
            } catch (Exception e) {
                errores.add("Error: " + e.getMessage());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("actualizados", actualizados);
        result.put("errores", errores);
        return result;
    }

    // =============================================
    // MÉTODO PRIVADO: Calcula descuentos de un empleado
    // =============================================
    private Map<String, Object> calcularDescuentoEmpleado(Usuario emp, LocalDate inicio, LocalDate fin) {
        BigDecimal salario = emp.getSalarioMensual() != null ? emp.getSalarioMensual() : BigDecimal.ZERO;

        // Obtener marcaciones del mes
        List<Marcacion> marcaciones = marcacionRepository
                .findByUsuarioIdAndFechaHoraBetweenOrderByFechaHoraDesc(
                        emp.getId(),
                        inicio.atStartOfDay(),
                        fin.atTime(LocalTime.MAX));

        // Agrupar por día
        Map<LocalDate, List<Marcacion>> porDia = marcaciones.stream()
                .collect(Collectors.groupingBy(m -> m.getFechaHora().toLocalDate()));

        // Contar días laborables (lunes a viernes)
        int diasLaborables = 0;
        int diasTardanza = 0;
        int diasAusencia = 0;
        int minutosTardanzaTotal = 0;

        LocalDate dia = inicio;
        while (!dia.isAfter(fin) && !dia.isAfter(LocalDate.now())) {
            int dow = dia.getDayOfWeek().getValue(); // 1=lun, 7=dom
            if (dow <= 5) { // Lunes a Viernes
                diasLaborables++;
                List<Marcacion> marcsDia = porDia.get(dia);
                if (marcsDia == null || marcsDia.isEmpty()) {
                    diasAusencia++;
                } else {
                    // Buscar si alguna marcación de ENTRADA tiene tardanza
                    for (Marcacion m : marcsDia) {
                        if (m.getTipo() == Marcacion.TipoMarcacion.ENTRADA && m.getEsTardia() != null && m.getEsTardia()) {
                            diasTardanza++;
                            if (m.getMinutosTarde() != null) {
                                minutosTardanzaTotal += m.getMinutosTarde();
                            }
                            break;
                        }
                    }
                }
            }
            dia = dia.plusDays(1);
        }

        // Calcular descuentos
        // Salario diario = salario / díasLaborables del mes
        BigDecimal salarioDiario = diasLaborables > 0
                ? salario.divide(BigDecimal.valueOf(diasLaborables), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Descuento por ausencia: salario diario completo por día
        BigDecimal descuentoAusencias = salarioDiario.multiply(BigDecimal.valueOf(diasAusencia));

        // Descuento por tardanza: proporcional a minutos (salario diario / 480 min *
        // minutos tarde)
        BigDecimal descuentoTardanzas = diasLaborables > 0
                ? salarioDiario.divide(BigDecimal.valueOf(480), 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(minutosTardanzaTotal))
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal totalDescuento = descuentoAusencias.add(descuentoTardanzas);
        BigDecimal salarioNeto = salario.subtract(totalDescuento);
        if (salarioNeto.compareTo(BigDecimal.ZERO) < 0) {
            salarioNeto = BigDecimal.ZERO;
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", emp.getId());
        data.put("username", emp.getUsername());
        data.put("nombreCompleto", emp.getNombreCompleto());
        data.put("sucursal", emp.getSucursal() != null ? emp.getSucursal().getNombre() : "Sin asignar");
        data.put("salarioMensual", salario);
        data.put("diasLaborables", diasLaborables);
        data.put("diasTrabajados", diasLaborables - diasAusencia);
        data.put("diasTardanza", diasTardanza);
        data.put("diasAusencia", diasAusencia);
        data.put("minutosTardanza", minutosTardanzaTotal);
        data.put("descuentoAusencias", descuentoAusencias);
        data.put("descuentoTardanzas", descuentoTardanzas);
        data.put("totalDescuento", totalDescuento);
        data.put("salarioNeto", salarioNeto);

        return data;
    }
}
