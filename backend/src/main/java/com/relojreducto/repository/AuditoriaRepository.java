package com.relojreducto.repository;

import com.relojreducto.entity.Auditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

    Page<Auditoria> findAllByOrderByFechaHoraDesc(Pageable pageable);

    @Query("SELECT a FROM Auditoria a LEFT JOIN FETCH a.usuario " +
            "WHERE a.fechaHora BETWEEN :inicio AND :fin ORDER BY a.fechaHora DESC")
    List<Auditoria> findByRango(@Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin);

    @Query("SELECT a FROM Auditoria a LEFT JOIN FETCH a.usuario " +
            "WHERE a.usuario.id = :usuarioId ORDER BY a.fechaHora DESC")
    List<Auditoria> findByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT a FROM Auditoria a LEFT JOIN FETCH a.usuario " +
            "WHERE a.tipoAccion = :tipo ORDER BY a.fechaHora DESC")
    List<Auditoria> findByTipoAccion(@Param("tipo") String tipo);

    @Query("SELECT a.tipoAccion, COUNT(a) FROM Auditoria a " +
            "WHERE a.fechaHora >= :desde GROUP BY a.tipoAccion")
    List<Object[]> contarPorTipo(@Param("desde") LocalDateTime desde);
}
