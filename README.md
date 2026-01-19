# 🕐 RelojReducto - Sistema de Control de Marcaciones

Sistema completo para control de marcaciones de entrada/salida de empleados con geolocalización.

## 📋 Características

### Para Empleados
- ✅ Login seguro con cédula y contraseña
- ✅ Botón de marcación grande e intuitivo
- ✅ Detección automática ENTRADA/SALIDA
- ✅ Captura de geolocalización del navegador
- ✅ Historial de marcaciones del día
- ✅ Reloj en tiempo real

### Para Administradores
- ✅ Dashboard con estadísticas
- ✅ Gestión de usuarios (crear, activar/desactivar)
- ✅ Reporte de marcaciones por fecha
- ✅ **Control de llegadas tardías** (después de 8:00 AM)
- ✅ Filtros por usuario y rango de fechas
- ✅ Enlaces a ubicación en Google Maps

## 🛠️ Tecnologías

### Backend
- **Java 17**
- **Spring Boot 3.2**
- **Spring Security + JWT**
- **Spring Data JPA**
- **MySQL**
- **Maven**

### Frontend
- **React + Vite**
- **React Router DOM**
- **Axios**
- **Lucide React** (iconos)
- **CSS puro** (diseño premium)

## 🚀 Instalación

### 1. Base de Datos

Crear la base de datos MySQL:

```sql
CREATE DATABASE reloj_reducto_db;
```

### 2. Backend

```bash
cd backend

# Configurar conexión en application.properties
# Cambiar spring.datasource.username y spring.datasource.password

# Compilar y ejecutar
./mvnw spring-boot:run

# O en Windows:
mvnw.cmd spring-boot:run
```

El backend estará disponible en: `http://localhost:8080`

### 3. Frontend

```bash
cd frontend

# Instalar dependencias (si no están instaladas)
npm install

# Ejecutar en modo desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 👤 Usuarios de Prueba

Al iniciar el backend, se crean automáticamente:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | ADMIN |
| empleado1 | empleado123 | EMPLEADO |

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Marcaciones (requiere autenticación)
- `POST /api/marcaciones` - Registrar marcación
- `GET /api/marcaciones/estado` - Obtener próximo tipo (ENTRADA/SALIDA)
- `GET /api/marcaciones/hoy` - Marcaciones del día
- `GET /api/marcaciones/historial` - Historial completo

### Administración (solo ADMIN)
- `GET /api/admin/usuarios` - Listar usuarios
- `POST /api/admin/usuarios` - Crear usuario
- `PUT /api/admin/usuarios/{id}` - Actualizar usuario
- `PUT /api/admin/usuarios/{id}/deactivate` - Desactivar usuario
- `GET /api/admin/marcaciones` - Todas las marcaciones
- `GET /api/admin/marcaciones/rango?inicio=YYYY-MM-DD&fin=YYYY-MM-DD` - Por rango

## 🎨 Diseño

- Paleta de **verdes pasteles** que combina con el logo de la cooperativa
- Diseño **glassmorphism** y moderno
- Animaciones suaves y **micro-interacciones**
- Botón de marcación con **efecto pulsante**
- Totalmente **responsivo** (móvil, tablet, desktop)

## 📱 Uso

1. El empleado inicia sesión con su cédula
2. Ve el botón grande (verde = ENTRADA, rojo = SALIDA)
3. Al presionar, se captura su ubicación GPS
4. La marcación queda registrada con fecha, hora y coordenadas
5. El admin puede ver reportes y llegadas tardías

## 📂 Estructura del Proyecto

```
APP_MARCACION/
├── backend/
│   ├── src/main/java/com/relojreducto/
│   │   ├── config/          # Seguridad, inicializador
│   │   ├── controller/      # REST APIs
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── entity/          # Entidades JPA
│   │   ├── repository/      # Interfaces de datos
│   │   ├── security/        # JWT, filtros
│   │   └── service/         # Lógica de negocio
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   └── services/        # API client
│   └── package.json
└── README.md
```

## ⚙️ Configuración

### Hora de llegada tardía
Por defecto se considera tardía la entrada después de las **8:00 AM**.
Para modificar, editar en `AdminPanel.jsx`:

```javascript
const esTardia = m.tipo === 'ENTRADA' && hora.getHours() >= 8 && hora.getMinutes() > 0;
```

### CORS
Orígenes permitidos configurados en `application.properties`:
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

---

**© 2026 RelojReducto - Cooperativa**
