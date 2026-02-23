import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { authService } from './services/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import CapturaFoto from './components/CapturaFoto';

// Componente para rutas protegidas
function ProtectedRoute({ children, adminOnly = false }) {
  const isAuth = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

import { useModal } from './context/ModernModalContext';

// Componente principal de la app que maneja la captura de foto
function AppContent() {
  const { alert } = useModal();
  const [showCapturaFoto, setShowCapturaFoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar si el usuario necesita foto de perfil
    const checkFotoPerfil = () => {
      const isAuth = authService.isAuthenticated();
      const usuario = authService.getUsuarioActual();
      const fotoOmitida = sessionStorage.getItem('fotoOmitida') === 'true';

      // Solo mostrar captura si está autenticado, no tiene foto, no es admin y no omitió
      if (isAuth && usuario && !usuario.fotoPerfil && !authService.isAdmin() && location.pathname !== '/login' && !fotoOmitida) {
        setShowCapturaFoto(true);
      } else {
        setShowCapturaFoto(false);
      }
      setLoading(false);
    };

    checkFotoPerfil();
  }, [location.pathname]);

  const handlePhotoCapture = async (data) => {
    try {
      // data contiene { fotoPerfil, emailInstitucional, telefonoCorporativo, numeroSocio }
      await authService.actualizarPerfil(data);
      setShowCapturaFoto(false);
      // Refrescar la página para actualizar el estado del usuario en la app
      window.location.reload();
    } catch (error) {
      console.error('Error al guardar datos:', error);
      alert('Error al Guardar', 'Hubo un problema al guardar tu información corporativa. Por favor, intenta nuevamente.', 'error');
    }
  };

  // En desarrollo: permitir omitir foto si la cámara no está disponible
  const handleSkipPhoto = () => {
    // Guardar en sessionStorage que omitió (solo para esta sesión)
    sessionStorage.setItem('fotoOmitida', 'true');
    setShowCapturaFoto(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e)'
      }}>
        <div style={{ color: '#10b981', fontSize: '1.2rem' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de captura de foto obligatoria */}
      {showCapturaFoto && (
        <CapturaFoto
          onPhotoCapture={handlePhotoCapture}
          onSkip={handleSkipPhoto}
          username={authService.getUsuarioActual()?.nombreCompleto || 'Usuario'}
        />
      )}

      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas de admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

import { ModalProvider } from './context/ModernModalContext';

function App() {
  return (
    <ModalProvider>
      <AppContent />
    </ModalProvider>
  );
}

export default App;
