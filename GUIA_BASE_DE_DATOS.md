# 🗄️ Guía de Configuración de Base de Datos - Reloj Reducto

Este documento contiene toda la información necesaria para configurar el motor de base de datos para el sistema **Reloj Reducto**, tanto en entornos de desarrollo como en producción.

---

## 🚀 1. Requisitos del Sistema
- **Motor**: MySQL 8.0+ o MariaDB 10.4+
- **Base de Datos**: `reloj_reducto_db`
- **Puerto por defecto**: 3306
- **Codificación**: `utf8mb4` (para soporte completo de caracteres y emojis)

---

## 🛠️ 2. Creación Automática (Recomendado para Producción)
El sistema está configurado con **Spring Data JPA** y **Hibernate**. Por defecto, el sistema creará todas las tablas automáticamente la primera vez que se conecte a una base de datos vacía.

### Pasos para preparar la BD:
1. Inicia sesión en tu servidor MySQL.
2. Crea la base de datos:
   ```sql
   CREATE DATABASE reloj_reducto_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Crea un usuario específico (opcional pero recomendado):
   ```sql
   CREATE USER 'reloj_admin'@'localhost' IDENTIFIED BY 'TuPasswordSegura';
   GRANT ALL PRIVILEGES ON reloj_reducto_db.* TO 'reloj_admin'@'localhost';
   FLUSH PRIVILEGES;
   ```
4. Actualiza el archivo `backend/src/main/resources/application.properties` con las credenciales:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/reloj_reducto_db
   spring.datasource.username=reloj_admin
   spring.datasource.password=TuPasswordSegura
   spring.jpa.hibernate.ddl-auto=update
   ```

---

## 📖 3. Diccionario de Tablas
A continuación se detallan las tablas que el sistema crea y su propósito:

### 1. `usuarios`
Es la tabla principal que almacena a los funcionarios y administradores.
- **`username`**: Almacena la Cédula de Identidad (CI). Es único.
- **`password`**: Almacena el hash BCrypt de la contraseña.
- **`rol`**: Puede ser `ADMIN`, `EMPLEADO` o `ADMIN_SUCURSAL`.
- **`salario_mensual`**: Base para el cálculo de descuentos.
- **`foto_perfil`**: Almacena la imagen base64 para el reconocimiento facial.

### 2. `marcaciones`
Registra cada entrada y salida de los trabajadores.
- **`tipo`**: `ENTRADA` o `SALIDA`.
- **`fecha_hora`**: Momento exacto de la marcación.
- **`latitud` / `longitud`**: Ubicación GPS capturada.
- **`es_tardia`**: Flag automático si supera la tolerancia del turno.
- **`descuento_calculado`**: Monto de descuento generado por esa marcación específica.

### 3. `sucursales`
Define las ubicaciones físicas de la empresa.
- **`nombre`**: Nombre de la sucursal o planta.
- **`direccion`**: Dirección física.
- **`radio_geocerca`**: Distancia en metros que se permite para marcar (geofencing).

### 4. `turnos`
Define los horarios laborales.
- **`hora_entrada`** / **`hora_salida`**: Horario esperado.
- **`tolerancia_minutos`**: Tiempo de gracia antes de que se considere llegada tardía.

### 5. `justificaciones`
Almacena los pedidos de los empleados para anular descuentos.
- **`motivo`**: Texto explicando el porqué de la falta o llegada tarde.
- **`estado`**: `PENDIENTE`, `APROBADO`, `RECHAZADO`.
- **`comprobante_url`**: Enlace a la imagen o PDF del justificativo médico/legal.

### 6. `permisos`
Solicitudes de vacaciones o días libres.
- **`tipo_permiso`**: Vacaciones, Salud, Trámites, etc.
- **`fecha_inicio`** / **`fecha_fin`**: Rango de ausencia.

### 7. `feriados`
Calendario de días no laborables para que el sistema no marque ausencias esos días.

### 8. `auditoria`
Logs de seguridad: quién borró qué, quién cambió salarios, quién aprobó permisos.

### 9. `ubicacion_tracking`
Historial de geolocalización en tiempo real para empleados que trabajan en ruta (campo `siempre_en_ubicacion` activo).

---

## 🔑 4. Cómo Crear el Primer Administrador
Si la base de datos está vacía, no podrás iniciar sesión. Para crear el primer usuario administrativo:

### Opción A: Script SQL (Directo en BD)
Ejecuta esto en tu consola MySQL para crear un usuario con CI `1234567` y contraseña `admin123` (hash generado):
```sql
INSERT INTO usuarios (username, password, nombre_completo, rol, activo, requiere_geolocalizacion, biometrico_habilitado, siempre_en_ubicacion, salario_mensual) 
VALUES ('1234567', '$2a$10$8.UnVuG9HHgffUDAlk8q6uy.vGf6E9U8O5/V09z6S9Q39z0771S1C', 'Administrador Inicial', 'ADMIN', 1, 0, 0, 0, 0);
```

---

## 💾 5. Backup y Mantenimiento
Para realizar un respaldo manual desde la terminal:
```bash
mysqldump -u reloj_admin -p reloj_reducto_db > backup_reloj_$(date +%F).sql
```

Para restaurar:
```bash
mysql -u reloj_admin -p reloj_reducto_db < backup_reloj.sql
```

---
*Documentación generada automáticamente para la implantación del sistema Reloj Reducto v1.0.*
