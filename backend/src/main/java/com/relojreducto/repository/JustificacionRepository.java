package com.relojreducto.repository;

import com.relojreducto.entity.Justificacion;
import com.relojreducto.entity.Justificacion.EstadoJustificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface JustificacionRepository extends JpaRepository<Justificacion, Long> {

    @Query("SELECT j FROM Justificacion j JOIN FETCH j.usuario " +
            "WHERE j.estado = :estado ORDER BY j.fechaCreacion DESC")
    List<Justificacion> findByEstado(@Param("estado") EstadoJustificacion estado);

    @Query("SELECT j FROM Justificacion j JOIN FETCH j.usuario " +
            "WHERE j.usuario.id = :usuarioId ORDER BY j.fecha DESC")
    List<Justificacion> findByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT j FROM Justificacion j JOIN FETCH j.usuario " +
            "WHERE j.fecha BETWEEN :inicio AND :fin ORDER BY j.fecha DESC")
    List<Justificacion> findByRango(@Param("inicio") LocalDate inicio,
            @Param("fin") LocalDate fin);

    @Query("SELECT COUNT(j) FROM Justificacion j WHERE j.estado = 'PENDIENTE'")
    long contarPendientes();

    @Query("SELECT j FROM Justificacion j JOIN FETCH j.usuario " +
            "ORDER BY j.fechaCreacion DESC")
    List<Justificacion> findAllOrdered();
}
