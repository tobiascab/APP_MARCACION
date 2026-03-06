package com.relojreducto.service;

import com.relojreducto.repository.UbicacionTrackingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Servicio de limpieza automática de datos de tracking antiguos.
 * Ejecuta cada día a las 3:00 AM y elimina registros con más de 90 días.
 */
@Service
public class TrackingCleanupService {

    private static final Logger log = LoggerFactory.getLogger(TrackingCleanupService.class);
    private static final int DIAS_RETENCION = 90;

    private final UbicacionTrackingRepository trackingRepository;

    public TrackingCleanupService(UbicacionTrackingRepository trackingRepository) {
        this.trackingRepository = trackingRepository;
    }

    /**
     * Limpieza programada: cada día a las 3:00 AM (hora local Paraguay).
     * Elimina registros de tracking con más de 90 días.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void limpiarTrackingAntiguo() {
        LocalDateTime fechaCorte = LocalDateTime.now().minusDays(DIAS_RETENCION);
        log.info("[Cleanup] Eliminando registros de tracking anteriores a {}", fechaCorte);

        try {
            int eliminados = trackingRepository.deleteOlderThan(fechaCorte);
            log.info("[Cleanup] {} registros de tracking eliminados (>{} días)", eliminados, DIAS_RETENCION);
        } catch (Exception e) {
            log.error("[Cleanup] Error eliminando tracking antiguo: {}", e.getMessage());
        }
    }
}
