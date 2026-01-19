package com.relojreducto.repository;

import com.relojreducto.entity.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SucursalRepository extends JpaRepository<Sucursal, Long> {
    Optional<Sucursal> findByNombre(String nombre);
}
