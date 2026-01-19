package com.relojreducto.controller;

import com.relojreducto.dto.SucursalDTO;
import com.relojreducto.entity.Sucursal;
import com.relojreducto.repository.SucursalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/sucursales")
@PreAuthorize("hasRole('ADMIN')")
@SuppressWarnings("null")
public class SucursalController {

    private final SucursalRepository sucursalRepository;

    public SucursalController(SucursalRepository sucursalRepository) {
        this.sucursalRepository = sucursalRepository;
    }

    @GetMapping
    public ResponseEntity<List<SucursalDTO>> getAll() {
        List<SucursalDTO> sucursales = sucursalRepository.findAll().stream()
                .map(SucursalDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(sucursales);
    }

    @PostMapping
    public ResponseEntity<?> create(@jakarta.validation.Valid @RequestBody SucursalDTO dto) {
        try {
            Sucursal sucursal = new Sucursal();
            sucursal.setNombre(dto.getNombre());
            sucursal.setDireccion(dto.getDireccion());
            sucursal.setLatitud(dto.getLatitud());
            sucursal.setLongitud(dto.getLongitud());
            sucursal.setRadioGeocerca(dto.getRadioGeocerca() != null ? dto.getRadioGeocerca() : 100);

            Sucursal saved = sucursalRepository.save(sucursal);
            return ResponseEntity.ok(SucursalDTO.fromEntity(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error al crear la sucursal. Verifique los datos."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @jakarta.validation.Valid @RequestBody SucursalDTO dto) {
        return sucursalRepository.findById(id).map(sucursal -> {
            if (dto.getNombre() != null)
                sucursal.setNombre(dto.getNombre());
            if (dto.getDireccion() != null)
                sucursal.setDireccion(dto.getDireccion());
            if (dto.getLatitud() != null)
                sucursal.setLatitud(dto.getLatitud());
            if (dto.getLongitud() != null)
                sucursal.setLongitud(dto.getLongitud());
            if (dto.getRadioGeocerca() != null)
                sucursal.setRadioGeocerca(dto.getRadioGeocerca());

            return ResponseEntity.ok(SucursalDTO.fromEntity(sucursalRepository.save(sucursal)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            return sucursalRepository.findById(id).map(sucursal -> {
                sucursalRepository.delete(sucursal);
                return ResponseEntity.ok(Map.of("message", "Sucursal eliminada"));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "No se puede eliminar la sucursal. Asegúrese de que no tenga usuarios o marcaciones asociadas."));
        }
    }
}
