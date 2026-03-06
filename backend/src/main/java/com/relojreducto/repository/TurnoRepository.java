package com.relojreducto.repository;

import com.relojreducto.entity.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {
    List<Turno> findByActivoTrue();

    List<Turno> findByActivoTrueOrderByNombreAsc();
    
    java.util.Optional<Turno> findByNombreIgnoreCase(String nombre);
}
