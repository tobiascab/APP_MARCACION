package com.relojreducto.repository;

import com.relojreducto.entity.Permiso;
import com.relojreducto.entity.Permiso.EstadoPermiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PermisoRepository extends JpaRepository<Permiso, Long> {
    List<Permiso> findByUsuarioIdOrderByFechaSolicitudDesc(Long usuarioId);

    List<Permiso> findByEstadoOrderByFechaSolicitudDesc(EstadoPermiso estado);

    List<Permiso> findAllByOrderByFechaSolicitudDesc();

    List<Permiso> findByUsuarioSucursalIdAndEstadoOrderByFechaSolicitudDesc(Long sucursalId, EstadoPermiso estado);
}
