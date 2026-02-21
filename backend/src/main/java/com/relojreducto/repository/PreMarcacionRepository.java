package com.relojreducto.repository;

import com.relojreducto.entity.PreMarcacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository para pre-marcaciones automáticas por geofence.
 */
@Repository
public interface PreMarcacionRepository extends JpaRepository<PreMarcacion, Long> {

    /**
     * Busca pre-marcaciones de hoy para un usuario (la más reciente primero).
     */
    @Query("SELECT p FROM PreMarcacion p WHERE p.usuario.id = :usuarioId " +
            "AND DATE(p.fechaHoraDeteccion) = CURRENT_DATE ORDER BY p.fechaHoraDeteccion DESC")
    List<PreMarcacion> findPreMarcacionesDeHoy(@Param("usuarioId") Long usuarioId);

    /**
     * Verifica si ya existe una pre-marcación hoy para un usuario.
     */
    @Query("SELECT COUNT(p) > 0 FROM PreMarcacion p WHERE p.usuario.id = :usuarioId " +
            "AND DATE(p.fechaHoraDeteccion) = CURRENT_DATE")
    boolean existsPreMarcacionHoy(@Param("usuarioId") Long usuarioId);

    /**
     * Obtiene la primera pre-marcación del día (la más antigua = hora real de
     * llegada).
     */
    @Query("SELECT p FROM PreMarcacion p WHERE p.usuario.id = :usuarioId " +
            "AND DATE(p.fechaHoraDeteccion) = CURRENT_DATE ORDER BY p.fechaHoraDeteccion ASC")
    List<PreMarcacion> findPrimeraPreMarcacionDeHoy(@Param("usuarioId") Long usuarioId);

    /**
     * Obtiene todas las pre-marcaciones de hoy (todos los usuarios).
     */
    @Query("SELECT p FROM PreMarcacion p WHERE DATE(p.fechaHoraDeteccion) = CURRENT_DATE " +
            "ORDER BY p.fechaHoraDeteccion DESC")
    List<PreMarcacion> findAllPreMarcacionesDeHoy();

    /**
     * Obtiene pre-marcaciones por rango de fechas.
     */
    List<PreMarcacion> findByFechaHoraDeteccionBetweenOrderByFechaHoraDeteccionDesc(
            LocalDateTime inicio, LocalDateTime fin);

    /**
     * Obtiene pre-marcaciones de un usuario por rango de fechas.
     */
    List<PreMarcacion> findByUsuarioIdAndFechaHoraDeteccionBetweenOrderByFechaHoraDeteccionDesc(
            Long usuarioId, LocalDateTime inicio, LocalDateTime fin);

    /**
     * Obtiene la primera pre-marcación del día para un usuario.
     */
    @Query("SELECT p FROM PreMarcacion p WHERE p.usuario.id = :usuarioId " +
            "AND p.fechaHoraDeteccion BETWEEN :inicio AND :fin " +
            "ORDER BY p.fechaHoraDeteccion ASC")
    List<PreMarcacion> findPrimeraPreMarcacionEnRango(
            @Param("usuarioId") Long usuarioId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);

    /**
     * Pre-marcaciones por sucursal.
     */
    List<PreMarcacion> findBySucursalIdAndFechaHoraDeteccionBetweenOrderByFechaHoraDeteccionDesc(
            Long sucursalId, LocalDateTime inicio, LocalDateTime fin);
}
