import axios from 'axios';

const getBaseURL = () => {
    // Detectar si estamos en un dispositivo móvil en la red local
    const isLocalData = window.location.hostname !== 'localhost';
    // Usar la ruta relativa /api para que el proxy de Vite maneje la redirección
    return '/api';
};

// Configuración base de Axios
const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token JWT a las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==========================================
// SERVICIOS DE AUTENTICACIÓN
// ==========================================

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    },

    getUsuarioActual: () => {
        const usuario = localStorage.getItem('usuario');
        return usuario ? JSON.parse(usuario) : null;
    },

    getCurrentUser: () => authService.getUsuarioActual(),

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    isAdmin: () => {
        const usuario = authService.getUsuarioActual();
        return usuario?.rol === 'ADMIN' || usuario?.rol === 'ADMIN_SUCURSAL';
    },

    isPrincipalAdmin: () => {
        const usuario = authService.getUsuarioActual();
        return usuario?.rol === 'ADMIN';
    },

    // Verificar si el usuario necesita foto de perfil
    necesitaFotoPerfil: () => {
        const usuario = authService.getUsuarioActual();
        return usuario && !usuario.fotoPerfil;
    },

    // Actualizar foto de perfil
    actualizarFotoPerfil: async (fotoBase64) => {
        const usuario = authService.getUsuarioActual();
        if (!usuario) throw new Error('Usuario no autenticado');

        const response = await api.put(`/usuarios/perfil`, { fotoPerfil: fotoBase64 });

        // Actualizar usuario en localStorage
        const usuarioActualizado = { ...usuario, fotoPerfil: fotoBase64 };
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

        return response.data;
    },

    // Actualizar datos del perfil
    actualizarPerfil: async (datos) => {
        const usuario = authService.getUsuarioActual();
        if (!usuario) throw new Error('Usuario no autenticado');

        const response = await api.put(`/usuarios/perfil`, datos);

        if (response.data.usuario) {
            // Actualizar usuario en localStorage con los nuevos datos recibidos
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        }

        return response.data;
    },

    // Refrescar datos del usuario desde el servidor
    refrescarUsuario: async () => {
        const response = await api.get('/usuarios/me');
        if (response.data) {
            localStorage.setItem('usuario', JSON.stringify(response.data));
        }
        return response.data;
    },
};

// ==========================================
// SERVICIOS DE MARCACIONES
// ==========================================

export const marcacionService = {
    // Registrar una nueva marcación
    registrar: async (latitud, longitud, dispositivo = null, accuracy = null, isMocked = false) => {
        const response = await api.post('/marcaciones', {
            latitud,
            longitud,
            dispositivo,
            accuracy,
            isMocked
        });
        return response.data;
    },

    // Obtener el estado actual (ENTRADA o SALIDA)
    getEstado: async () => {
        const response = await api.get('/marcaciones/estado');
        return response.data;
    },

    // Obtener las marcaciones del día
    getHoy: async () => {
        const response = await api.get('/marcaciones/hoy');
        return response.data;
    },

    // Obtener historial completo
    getHistorial: async () => {
        const response = await api.get('/marcaciones/historial');
        return response.data;
    },

    // Obtener marcaciones por rango de fechas
    getByRango: async (inicio, fin) => {
        const response = await api.get(`/marcaciones/rango?inicio=${inicio}&fin=${fin}`);
        return response.data;
    },

    // Obtener última marcación
    getUltima: async () => {
        const response = await api.get('/marcaciones/ultima');
        return response.data;
    },
};

// ==========================================
// SERVICIOS DE ADMINISTRACIÓN
// ==========================================

export const adminService = {
    // USUARIOS
    getUsuarios: async () => {
        const response = await api.get('/admin/usuarios');
        return response.data;
    },

    getUsuariosActivos: async () => {
        const response = await api.get('/admin/usuarios/activos');
        return response.data;
    },

    getUsuario: async (id) => {
        const response = await api.get(`/admin/usuarios/${id}`);
        return response.data;
    },

    createUsuario: async (usuario) => {
        const response = await api.post('/admin/usuarios', usuario);
        return response.data;
    },

    updateUsuario: async (id, usuario) => {
        const response = await api.put(`/admin/usuarios/${id}`, usuario);
        return response.data;
    },

    deactivateUsuario: async (id) => {
        const response = await api.put(`/admin/usuarios/${id}/deactivate`);
        return response.data;
    },

    activateUsuario: async (id) => {
        const response = await api.put(`/admin/usuarios/${id}/activate`);
        return response.data;
    },

    // MARCACIONES (REPORTES)
    getAllMarcaciones: async () => {
        const response = await api.get('/admin/marcaciones');
        return response.data;
    },

    getMarcacionesByUsuario: async (usuarioId) => {
        const response = await api.get(`/admin/marcaciones/usuario/${usuarioId}`);
        return response.data;
    },

    getMarcacionesByRango: async (inicio, fin) => {
        const response = await api.get(`/admin/marcaciones/rango?inicio=${inicio}&fin=${fin}`);
        return response.data;
    },

    getMarcacionesByUsuarioAndRango: async (usuarioId, inicio, fin) => {
        const response = await api.get(
            `/admin/marcaciones/usuario/${usuarioId}/rango?inicio=${inicio}&fin=${fin}`
        );
        return response.data;
    },

    exportUsuarios: async () => {
        const response = await api.get('/admin/usuarios/exportar', {
            responseType: 'blob', // Important for file download
        });
        return response.data;
    },

    resetMarcaciones: async () => {
        const response = await api.delete('/admin/marcaciones/reset');
        return response.data;
    },

    resetPerfil: async (id) => {
        const response = await api.post(`/admin/usuarios/${id}/reset-perfil`);
        return response.data;
    },

    resetAllProfiles: async () => {
        const response = await api.delete('/admin/usuarios/reset-perfiles-global');
        return response.data;
    },
};

// ==========================================
// SERVICIOS DE SUCURSALES
// ==========================================

export const sucursalService = {
    getSucursales: async () => {
        const response = await api.get('/admin/sucursales');
        return response.data;
    },

    createSucursal: async (sucursal) => {
        const response = await api.post('/admin/sucursales', sucursal);
        return response.data;
    },

    updateSucursal: async (id, sucursal) => {
        const response = await api.put(`/admin/sucursales/${id}`, sucursal);
        return response.data;
    },

    deleteSucursal: async (id) => {
        const response = await api.delete(`/admin/sucursales/${id}`);
        return response.data;
    },
};

// ==========================================
// SERVICIOS DE GESTIÓN (TURNOS, PERMISOS, FERIADOS)
// ==========================================

export const gestionService = {
    // TURNOS
    getTurnos: async () => {
        const response = await api.get('/gestion/turnos');
        return response.data;
    },

    getAllTurnos: async () => {
        const response = await api.get('/gestion/turnos/all');
        return response.data;
    },

    createTurno: async (turno) => {
        const response = await api.post('/gestion/turnos', turno);
        return response.data;
    },

    updateTurno: async (id, turno) => {
        const response = await api.put(`/gestion/turnos/${id}`, turno);
        return response.data;
    },

    deleteTurno: async (id) => {
        const response = await api.delete(`/gestion/turnos/${id}`);
        return response.data;
    },

    // PERMISOS
    getPermisos: async (estado = null) => {
        const url = estado ? `/gestion/permisos?estado=${estado}` : '/gestion/permisos';
        const response = await api.get(url);
        return response.data;
    },

    getMisPermisos: async () => {
        const response = await api.get('/gestion/permisos/mis-permisos');
        return response.data;
    },

    solicitarPermiso: async (permiso) => {
        const response = await api.post('/gestion/permisos', permiso);
        return response.data;
    },

    aprobarPermiso: async (id, comentario = '') => {
        const response = await api.put(`/gestion/permisos/${id}/aprobar`, { comentario });
        return response.data;
    },

    rechazarPermiso: async (id, comentario = '') => {
        const response = await api.put(`/gestion/permisos/${id}/rechazar`, { comentario });
        return response.data;
    },

    // FERIADOS
    getFeriados: async (year = null) => {
        const url = year ? `/gestion/feriados?year=${year}` : '/gestion/feriados';
        const response = await api.get(url);
        return response.data;
    },

    createFeriado: async (feriado) => {
        const response = await api.post('/gestion/feriados', feriado);
        return response.data;
    },

    updateFeriado: async (id, feriado) => {
        const response = await api.put(`/gestion/feriados/${id}`, feriado);
        return response.data;
    },

    deleteFeriado: async (id) => {
        const response = await api.delete(`/gestion/feriados/${id}`);
        return response.data;
    },

    checkFeriado: async (fecha) => {
        const response = await api.get(`/gestion/feriados/check/${fecha}`);
        return response.data;
    },
};

export default api;

