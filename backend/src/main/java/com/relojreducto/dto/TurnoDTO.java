package com.relojreducto.dto;

import com.relojreducto.entity.Turno;
import jakarta.validation.constraints.*;
import java.time.LocalTime;
import java.time.LocalDateTime;

public class TurnoDTO {
    private Long id;

    @NotBlank(message = "El nombre del turno es requerido")
    @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
    private String nombre;

    @NotNull(message = "La hora de entrada es requerida")
    private LocalTime horaEntrada;

    @NotNull(message = "La hora de salida es requerida")
    private LocalTime horaSalida;

    @Min(value = 0, message = "La tolerancia no puede ser negativa")
    @Max(value = 480, message = "La tolerancia no puede exceder las 8 horas")
    private Integer toleranciaMinutos;

    @NotBlank(message = "Los días de la semana son requeridos")
    @Pattern(regexp = "^[1-7](,[1-7])*$", message = "Formato de días inválido (ej: 1,2,3,4,5)")
    private String diasSemana;

    private Boolean activo;
    private LocalDateTime fechaCreacion;

    public TurnoDTO() {
    }

    public static TurnoDTO fromEntity(Turno turno) {
        if (turno == null)
            return null;
        TurnoDTO dto = new TurnoDTO();
        dto.setId(turno.getId());
        dto.setNombre(turno.getNombre());
        dto.setHoraEntrada(turno.getHoraEntrada());
        dto.setHoraSalida(turno.getHoraSalida());
        dto.setToleranciaMinutos(turno.getToleranciaMinutos());
        dto.setDiasSemana(turno.getDiasSemana());
        dto.setActivo(turno.getActivo());
        dto.setFechaCreacion(turno.getFechaCreacion());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public LocalTime getHoraEntrada() {
        return horaEntrada;
    }

    public void setHoraEntrada(LocalTime horaEntrada) {
        this.horaEntrada = horaEntrada;
    }

    public LocalTime getHoraSalida() {
        return horaSalida;
    }

    public void setHoraSalida(LocalTime horaSalida) {
        this.horaSalida = horaSalida;
    }

    public Integer getToleranciaMinutos() {
        return toleranciaMinutos;
    }

    public void setToleranciaMinutos(Integer toleranciaMinutos) {
        this.toleranciaMinutos = toleranciaMinutos;
    }

    public String getDiasSemana() {
        return diasSemana;
    }

    public void setDiasSemana(String diasSemana) {
        this.diasSemana = diasSemana;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}
