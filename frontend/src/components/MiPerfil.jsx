import { useState, useRef } from 'react';
import { X, User, Mail, Phone, Shield, Camera, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/api';
import './MiPerfil.css';

function MiPerfil({ usuario, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        nombreCompleto: usuario?.nombreCompleto || '',
        email: usuario?.email || '',
        telefono: usuario?.telefono || '',
        emailInstitucional: usuario?.emailInstitucional || '',
        telefonoCorporativo: usuario?.telefonoCorporativo || '',
        numeroSocio: usuario?.numeroSocio || '',
        password: ''
    });
    const [fotoPerfil, setFotoPerfil] = useState(usuario?.fotoPerfil || null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    if (!usuario) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoPerfil(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const updateData = { ...formData };
            if (fotoPerfil !== usuario.fotoPerfil) {
                updateData.fotoPerfil = fotoPerfil;
            }

            // Si la contraseña está vacía, no la enviamos
            if (!updateData.password) {
                delete updateData.password;
            }

            await authService.actualizarPerfil(updateData);
            setSuccess(true);
            if (onUpdate) await onUpdate(); // Llamar al callback para refrescar el Dashboard
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Error al actualizar perfil:', err);
            setError(err.response?.data?.message || 'Error al actualizar los datos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="perfil-overlay" onClick={onClose}>
            <div className="perfil-modal" onClick={(e) => e.stopPropagation()}>
                <div className="perfil-header">
                    <h2>Mi Perfil</h2>
                    <button className="perfil-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="perfil-form">
                    {/* Sección de Foto Compacta */}
                    <div className="perfil-avatar-section">
                        <div className="avatar-wrapper" onClick={() => fileInputRef.current.click()}>
                            {fotoPerfil ? (
                                <img src={fotoPerfil} alt="Perfil" className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <User size={40} />
                                </div>
                            )}
                            <div className="avatar-edit-badge">
                                <Camera size={14} />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <div className="user-basics">
                            <h3>{usuario.username}</h3>
                            <span className="user-role">
                                <Shield size={12} />
                                {usuario.rol === 'ADMIN' ? 'Administrador' : 'Empleado'}
                            </span>
                        </div>
                    </div>

                    {error && <div className="perfil-error">{error}</div>}

                    {/* Campos de Formulario Compactos */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label><User size={14} /> Nombre Completo</label>
                            <input
                                type="text"
                                name="nombreCompleto"
                                value={formData.nombreCompleto}
                                onChange={handleChange}
                                placeholder="Tu nombre"
                                readOnly
                                className="input-readonly"
                            />
                        </div>

                        <div className="form-group">
                            <label><Mail size={14} /> Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="correo@ejemplo.com"
                            />
                        </div>

                        <div className="form-group">
                            <label><Mail size={14} /> Correo Institucional</label>
                            <input
                                type="email"
                                name="emailInstitucional"
                                value={formData.emailInstitucional}
                                onChange={handleChange}
                                placeholder="institucional@empresa.com"
                            />
                        </div>

                        <div className="form-group">
                            <label><Phone size={14} /> Teléfono Corporativo</label>
                            <input
                                type="text"
                                name="telefonoCorporativo"
                                value={formData.telefonoCorporativo}
                                onChange={handleChange}
                                placeholder="Interno / Corp"
                            />
                        </div>

                        <div className="form-group">
                            <label><User size={14} /> Número de Socio</label>
                            <input
                                type="text"
                                name="numeroSocio"
                                value={formData.numeroSocio}
                                onChange={handleChange}
                                placeholder="ID Socio"
                            />
                        </div>

                        <div className="form-group">
                            <label><Lock size={14} /> Cambiar Contraseña</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Nueva contraseña (opcional)"
                            />
                        </div>
                    </div>

                    <div className="perfil-actions">
                        <button
                            type="submit"
                            className={`btn-save ${success ? 'success' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : success ? (
                                <CheckCircle2 size={18} />
                            ) : (
                                <Save size={18} />
                            )}
                            {loading ? 'Guardando...' : success ? '¡Guardado!' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MiPerfil;
