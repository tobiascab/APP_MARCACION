package com.relojreducto.repository;

import com.relojreducto.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para la entidad Usuario.
 * Proporciona operaciones CRUD y consultas personalizadas.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Busca un usuario por su username (cédula).
     */
    Optional<Usuario> findByUsername(String username);

    /**
     * Verifica si existe un usuario con el username dado.
     */
    boolean existsByUsername(String username);

    /**
     * Busca usuarios activos.
     */
    List<Usuario> findByActivoTrue();

    /**
     * Busca usuarios por rol.
     */
    List<Usuario> findByRol(Usuario.Rol rol);

    /**
     * Busca usuarios activos por rol.
     */
    List<Usuario> findByRolAndActivoTrue(Usuario.Rol rol);

    /**
     * Busca usuarios por nombre (búsqueda parcial, insensible a mayúsculas).
     */
    @Query("SELECT u FROM Usuario u WHERE LOWER(u.nombreCompleto) LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Usuario> buscarPorNombre(@Param("nombre") String nombre);

    /**
     * Cuenta usuarios activos por rol.
     */
    long countByRolAndActivoTrue(Usuario.Rol rol);

    /**
     * Busca usuarios por sucursal.
     */
    List<Usuario> findBySucursal_Id(Long sucursalId);

    /**
     * Busca usuarios activos por sucursal.
     */
    List<Usuario> findBySucursal_IdAndActivoTrue(Long sucursalId);
}
