package com.relojreducto;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Clase principal de la aplicación RelojReducto.
 * Sistema de Control de Marcaciones con Geolocalización.
 * 
 * @author RelojReducto Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableScheduling
public class RelojReductoApplication {

    public static void main(String[] args) {
        SpringApplication.run(RelojReductoApplication.class, args);
        System.out.println("===========================================");
        System.out.println("   🕐 RELOJ REDUCTO - API REST INICIADA    ");
        System.out.println("   📍 https://localhost:8443/api           ");
        System.out.println("===========================================");
    }
}
