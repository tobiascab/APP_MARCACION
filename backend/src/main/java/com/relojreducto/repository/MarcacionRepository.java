package com.relojreducto.repository;

import com.relojreducto.entity.Marcacion;
import com.relojreducto.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository para la entidad Marcacion.
 * Proporciona operaciones CRUD y consultas personalizadas para marcaciones.
 */
@Repository
public interface MarcacionRepository extends JpaRepository<Marcacion, Long> {

        /**
         * Busca todas las marcaciones de un usuario.
         */
        List<Marcacion> findByUsuarioOrderByFechaHoraDesc(Usuario usuario);

        /**
         * Busca todas las marcaciones de un usuario por su ID.
         */
        List<Marcacion> findByUsuarioIdOrderByFechaHoraDesc(Long usuarioId);

        /**
         * Busca marcaciones en un rango de fechas.
         */
        List<Marcacion> findByFechaHoraBetweenOrderByFechaHoraDesc(
                        LocalDateTime inicio, LocalDateTime fin);

        /**
         * Busca marcaciones de un usuario en un rango de fechas.
         */
        List<Marcacion> findByUsuarioIdAndFechaHoraBetweenOrderByFechaHoraDesc(
                        Long usuarioId, LocalDateTime inicio, LocalDateTime fin);

        /**
         * Busca la última marcación de un usuario.
         */
        Optional<Marcacion> findTopByUsuarioIdOrderByFechaHoraDesc(Long usuarioId);

        /**
         * Busca marcaciones de un usuario en un día específico.
         */
        @Query("SELECT m FROM Marcacion m WHERE m.usuario.id = :usuarioId " +
                        "AND DATE(m.fechaHora) = DATE(:fecha) ORDER BY m.fechaHora DESC")
        List<Marcacion> findByUsuarioIdAndFecha(
                        @Param("usuarioId") Long usuarioId,
                        @Param("fecha") LocalDateTime fecha);

        /**
         * Cuenta marcaciones de hoy para un usuario.
         */
        @Query("SELECT COUNT(m) FROM Marcacion m WHERE m.usuario.id = :usuarioId " +
                        "AND DATE(m.fechaHora) = CURRENT_DATE")
        long countMarcacionesHoy(@Param("usuarioId") Long usuarioId);

        /**
         * Busca la última marcación de un usuario en el día actual.
         */
        @Query("SELECT m FROM Marcacion m WHERE m.usuario.id = :usuarioId " +
                        "AND DATE(m.fechaHora) = CURRENT_DATE ORDER BY m.fechaHora DESC")
        List<Marcacion> findMarcacionesDeHoy(@Param("usuarioId") Long usuarioId);

        /**
         * Busca marcaciones por tipo.
         */
        List<Marcacion> findByTipoOrderByFechaHoraDesc(Marcacion.TipoMarcacion tipo);

        /**
         * Busca marcaciones por sucursal.
         */
        List<Marcacion> findByUsuario_Sucursal_IdOrderByFechaHoraDesc(Long sucursalId);

        /**
         * Busca marcaciones por sucursal en un rango de fechas.
         */
        List<Marcacion> findByUsuario_Sucursal_IdAndFechaHoraBetweenOrderByFechaHoraDesc(
                        Long sucursalId, LocalDateTime inicio, LocalDateTime fin);
}
