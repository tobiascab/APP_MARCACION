package com.relojreducto.repository;

import com.relojreducto.entity.UbicacionTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository para tracking de ubicaciones de empleados.
 */
@Repository
public interface UbicacionTrackingRepository extends JpaRepository<UbicacionTracking, Long> {

    /**
     * Última ubicación de cada usuario activo (para mapa en tiempo real).
     */
    @Query("SELECT u FROM UbicacionTracking u WHERE u.id IN " +
            "(SELECT MAX(u2.id) FROM UbicacionTracking u2 " +
            "WHERE u2.fechaHora >= :desde GROUP BY u2.usuario.id) " +
            "ORDER BY u.fechaHora DESC")
    List<UbicacionTracking> findUltimaUbicacionPorUsuario(@Param("desde") LocalDateTime desde);

    /**
     * Historial de ubicaciones de un usuario en un rango de tiempo.
     */
    List<UbicacionTracking> findByUsuarioIdAndFechaHoraBetweenOrderByFechaHoraAsc(
            Long usuarioId, LocalDateTime desde, LocalDateTime hasta);

    /**
     * Ubicaciones de hoy de un usuario.
     */
    @Query("SELECT u FROM UbicacionTracking u WHERE u.usuario.id = :usuarioId " +
            "AND DATE(u.fechaHora) = CURRENT_DATE ORDER BY u.fechaHora ASC")
    List<UbicacionTracking> findUbicacionesDeHoy(@Param("usuarioId") Long usuarioId);

    /**
     * Última ubicación de un usuario.
     */
    @Query("SELECT u FROM UbicacionTracking u WHERE u.usuario.id = :usuarioId " +
            "ORDER BY u.fechaHora DESC LIMIT 1")
    UbicacionTracking findUltimaUbicacion(@Param("usuarioId") Long usuarioId);

    /**
     * Contar registros de hoy para un usuario (para limitar frecuencia).
     */
    @Query("SELECT COUNT(u) FROM UbicacionTracking u WHERE u.usuario.id = :usuarioId " +
            "AND DATE(u.fechaHora) = CURRENT_DATE")
    long countUbicacionesHoy(@Param("usuarioId") Long usuarioId);
}
