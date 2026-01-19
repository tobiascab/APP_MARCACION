import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';
import './Login.css';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login(formData.username, formData.password);

            if (response.token) {
                // Redirigir según el rol
                if (response.usuario.rol === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            console.error('Error de login:', err);
            if (!err.response) {
                setError('Error de conexión con el servidor. Verifica tu conexión a internet.');
            } else {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Credenciales incorrectas. Intente nuevamente.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Fondo decorativo */}
            <div className="login-background">
                <div className="bg-circle bg-circle-1"></div>
                <div className="bg-circle bg-circle-2"></div>
                <div className="bg-circle bg-circle-3"></div>
            </div>

            <div className="login-card animate-slideUp">
                {/* Logo */}
                <div className="login-logo-container">
                    <img
                        src="/logo.png"
                        alt="RelojReducto Logo"
                        className="login-logo animate-float"
                    />
                </div>

                {/* Título */}
                <div className="login-header">
                    <h1>¡Bienvenido!</h1>
                    <p>Ingresa tus credenciales para continuar</p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="login-form">
                    {/* Error */}
                    {error && (
                        <div className="login-error animate-fadeIn">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Username */}
                    <div className="input-group">
                        <label htmlFor="username">Cédula de Identidad</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className="input"
                            placeholder="Ingresa tu cédula"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                    </div>

                    {/* Password */}
                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                className="input"
                                placeholder="Ingresa tu contraseña"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Botón Submit */}
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Ingresando...
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                Ingresar
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <p>Sistema de Control de Marcaciones</p>
                    <p className="text-sm text-gray">© 2026 RelojReducto - Cooperativa</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
