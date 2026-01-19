package com.relojreducto.repository;

import com.relojreducto.entity.Feriado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeriadoRepository extends JpaRepository<Feriado, Long> {
    Optional<Feriado> findByFecha(LocalDate fecha);

    @Query("SELECT f FROM Feriado f WHERE f.fecha BETWEEN :inicio AND :fin ORDER BY f.fecha")
    List<Feriado> findByFechaBetween(LocalDate inicio, LocalDate fin);

    @Query("SELECT f FROM Feriado f WHERE YEAR(f.fecha) = :year ORDER BY f.fecha")
    List<Feriado> findByYear(int year);

    boolean existsByFecha(LocalDate fecha);
}
