import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Edit, X, Plus, Download, Loader2, Upload, FileSpreadsheet } from 'lucide-react';
import { adminService, pagosService, sucursalService, importService } from '../services/api';
import * as XLSX from 'xlsx';
import { useModal } from '../context/ModernModalContext';
import ModernModal from './ModernModal';

// ===========================================
// MÓDULO DE PAGOS Y DESCUENTOS
// ===========================================

export function AdminPagos() {
    const { alert } = useModal();
    const [mesSeleccionado, setMesSeleccionado] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editandoSalario, setEditandoSalario] = useState(null);
    const [nuevoSalario, setNuevoSalario] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await pagosService.getResumen(mesSeleccionado);
            setDatos(data);
        } catch (e) {
            console.error('Error cargando pagos:', e);
        }
        setLoading(false);
    };

    useEffect(() => { cargarDatos(); }, [mesSeleccionado]);

    const guardarSalario = async (empId) => {
        if (!nuevoSalario || isNaN(nuevoSalario)) {
            alert('Dato Inválido', 'Por favor, ingresa un monto de salario válido.', 'error');
            return;
        }
        setGuardando(true);
        try {
            await pagosService.actualizarSalario(empId, parseFloat(nuevoSalario));
            setEditandoSalario(null);
            setNuevoSalario('');
            cargarDatos();
            alert('Salario Actualizado', 'El salario se ha modificado correctamente.', 'success');
        } catch (e) {
            alert('Error', e.response?.data?.error || e.message, 'error');
        }
        setGuardando(false);
    };

    const formatMoney = (val) => {
        const num = parseFloat(val) || 0;
        return num.toLocaleString('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 });
    };

    const empleadosFiltrados = datos?.empleados?.filter(e =>
        e.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.username.includes(busqueda)
    ) || [];

    const cardStyle = {
        background: 'white', borderRadius: 16, padding: '1.25rem',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    };

    const thStyle = {
        padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0',
        fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
        letterSpacing: '0.05em', whiteSpace: 'nowrap'
    };

    const tdStyle = {
        padding: '0.7rem 1rem', borderBottom: '1px solid #f1f5f9',
        fontSize: '0.85rem', color: '#334155'
    };

    return (
        <div style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <DollarSign size={26} style={{ color: '#10b981' }} />
                    Gestión de Pagos y Descuentos
                </h2>
                <input
                    type="month"
                    value={mesSeleccionado}
                    onChange={e => setMesSeleccionado(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                        <Loader2 size={32} style={{ color: '#10b981' }} />
                    </div>
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Calculando descuentos...</p>
                </div>
            ) : datos ? (
                <>
                    {/* Cards resumen */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderColor: '#6ee7b7' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', marginBottom: 4 }}>TOTAL SALARIOS</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#047857' }}>{formatMoney(datos.totalSalarios)}</div>
                        </div>
                        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderColor: '#fca5a5' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>TOTAL DESCUENTOS</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#991b1b' }}>{formatMoney(datos.totalDescuentos)}</div>
                        </div>
                        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderColor: '#93c5fd' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', marginBottom: 4 }}>NETO A PAGAR</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e40af' }}>{formatMoney(datos.totalNeto)}</div>
                        </div>
                        <div style={{ ...cardStyle }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>EMPLEADOS</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{datos.totalEmpleados}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {datos.totalTardanzas} tardanzas · {datos.totalAusencias} ausencias
                            </div>
                        </div>
                    </div>

                    {/* Buscador */}
                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="🔍 Buscar por nombre o CI..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Tabla */}
                    <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={thStyle}>Funcionario</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Salario</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Días Lab.</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Trabajados</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Tardanzas</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Ausencias</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Desc. Tard.</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Desc. Aus.</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Total Desc.</th>
                                    <th style={{ ...thStyle, textAlign: 'right', color: '#059669' }}>Neto</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Acc.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empleadosFiltrados.map(emp => (
                                    <tr key={emp.id} style={{ transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{emp.nombreCompleto}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>CI: {emp.username} · {emp.sucursal}</div>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                                            {editandoSalario === emp.id ? (
                                                <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
                                                    <input
                                                        type="number"
                                                        value={nuevoSalario}
                                                        onChange={e => setNuevoSalario(e.target.value)}
                                                        placeholder="Salario"
                                                        style={{ width: 100, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                                                        autoFocus
                                                    />
                                                    <button onClick={() => guardarSalario(emp.id)}
                                                        disabled={guardando}
                                                        style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                        ✓
                                                    </button>
                                                    <button onClick={() => { setEditandoSalario(null); setNuevoSalario(''); }}
                                                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                formatMoney(emp.salarioMensual)
                                            )}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{emp.diasLaborables}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{emp.diasTrabajados}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            {emp.diasTardanza > 0 ? <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: '0.78rem' }}>{emp.diasTardanza}</span> : <span style={{ color: '#10b981' }}>0</span>}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            {emp.diasAusencia > 0 ? <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: '0.78rem' }}>{emp.diasAusencia}</span> : <span style={{ color: '#10b981' }}>0</span>}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', color: emp.descuentoTardanzas > 0 ? '#dc2626' : '#94a3b8', fontSize: '0.82rem' }}>
                                            {emp.descuentoTardanzas > 0 ? `-${formatMoney(emp.descuentoTardanzas)}` : '-'}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', color: emp.descuentoAusencias > 0 ? '#dc2626' : '#94a3b8', fontSize: '0.82rem' }}>
                                            {emp.descuentoAusencias > 0 ? `-${formatMoney(emp.descuentoAusencias)}` : '-'}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: emp.totalDescuento > 0 ? '#dc2626' : '#94a3b8' }}>
                                            {emp.totalDescuento > 0 ? `-${formatMoney(emp.totalDescuento)}` : '-'}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '0.9rem' }}>
                                            {formatMoney(emp.salarioNeto)}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <button
                                                onClick={() => { setEditandoSalario(emp.id); setNuevoSalario(emp.salarioMensual || ''); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 4 }}
                                                title="Editar salario"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {empleadosFiltrados.length === 0 && (
                                    <tr>
                                        <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                            No se encontraron empleados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}
        </div>
    );
}

// ===========================================
// MÓDULO DE GESTIÓN DE USUARIOS + IMPORTACIÓN EXCEL
// ===========================================

export function AdminGestionUsuarios() {
    const { alert } = useModal();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState([]);
    const [importResult, setImportResult] = useState(null);
    const [importando, setImportando] = useState(false);
    const [showCrear, setShowCrear] = useState(false);
    const [nuevoUsuario, setNuevoUsuario] = useState({ ci: '', nombreCompleto: '', email: '', telefono: '', salarioMensual: '', rol: 'EMPLEADO' });
    const [creando, setCreando] = useState(false);
    const [sucursales, setSucursales] = useState([]);
    const [sheetsMap, setSheetsMap] = useState({}); // Mapa de nombre de hoja -> ID de sucursal
    const [loadingSucursales, setLoadingSucursales] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        cargarUsuarios();
        cargarSucursales();
    }, []);

    const cargarSucursales = async () => {
        setLoadingSucursales(true);
        try {
            const data = await sucursalService.getSucursales();
            setSucursales(data);
        } catch (e) {
            console.error('Error cargando sucursales:', e);
        }
        setLoadingSucursales(false);
    };

    const cargarUsuarios = async () => {
        try {
            const data = await adminService.getUsuarios();
            setUsuarios(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const formatearFechaExcel = (val) => {
        if (val === undefined || val === null) return null;
        if (typeof val === 'number') {
            const date = new Date((val - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        let str = String(val).trim();
        // Ej: "25/2/1976" -> "1976-02-25"
        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
                let y = parts[2];
                if (y.length === 2) y = (parseInt(y) > 50 ? '19' : '20') + y;
                return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        // Ej: "lunes, 5 de noviembre de 2012"
        const meses = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
            'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
        };
        for (const mes in meses) {
            if (str.toLowerCase().includes(mes)) {
                const match = str.match(/(\d+).*?de\s+([a-zA-Z]+)\s+de\s+(\d+)/i);
                if (match) {
                    return `${match[3]}-${meses[match[2].toLowerCase()] || '01'}-${match[1].padStart(2, '0')}`;
                }
            }
        }
        return str;
    };

    const processFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const dataArray = new Uint8Array(evt.target.result);
                const wb = XLSX.read(dataArray, { type: 'array' });

                let allData = [];
                const detectedSheetsMap = {};

                wb.SheetNames.forEach(sheetName => {
                    const ws = wb.Sheets[sheetName];
                    const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1 });

                    // Buscar la fila de encabezados
                    let headerIndex = -1;
                    for (let i = 0; i < Math.min(sheetData.length, 15); i++) {
                        const row = sheetData[i] || [];
                        if (row.some(cell => {
                            const c = String(cell || '').toLowerCase().trim();
                            return c.includes('nº de soci') || c === 'ci' || c === 'c.i.';
                        })) {
                            headerIndex = i;
                            break;
                        }
                    }

                    if (headerIndex === -1) return; // Hoja no válida o sin datos

                    const headers = sheetData[headerIndex].map(h => String(h || '').trim().toLowerCase());
                    const rows = sheetData.slice(headerIndex + 1);

                    // Intentar mapear la hoja a una sucursal existente (Normalización solicitada)
                    const normalizedSheet = sheetName.toUpperCase().trim();
                    const matchedSucursal = sucursales.find(s => {
                        const sName = s.nombre.toUpperCase();
                        return sName === normalizedSheet || // Exacto
                            (normalizedSheet === 'CASA MATRIZ' && sName === 'CASA CENTRAL') ||
                            (normalizedSheet === 'SANLORENZO_CENTRO' && sName === 'SUC. SAN LORENZO') ||
                            (normalizedSheet === 'SUCURSAL 5' && sName === 'SUC.5 REDUCTO') ||
                            (normalizedSheet === 'C.D.E' && sName === 'SUC. CDE') ||
                            (normalizedSheet === 'HERNANDARIAS' && sName === 'SUC HERNANDARIAS') ||
                            (normalizedSheet === 'VILLARRICA' && sName === 'SUCURSAL VILLARRICA') ||
                            (normalizedSheet === 'CENTRO MEDICO REDUCTO' && sName === 'CENTRO MEDICO REDUCTO');
                    });

                    if (matchedSucursal) {
                        detectedSheetsMap[sheetName] = matchedSucursal.id;
                    }

                    rows.forEach((rowValues) => {
                        const row = { sheetSource: sheetName };
                        headers.forEach((h, idx) => {
                            const val = rowValues[idx];
                            if (val === undefined || val === null || val === '') return;

                            const header = h.trim();
                            if (header === 'ci' || header === 'c.i.') row.ci = String(val).replace(/[^0-9]/g, '').trim();
                            else if (header.includes('nombre') && header.includes('apellido')) row.nombreCompleto = String(val).trim();
                            else if (header.includes('socio')) row.numeroSocio = String(val).trim();
                            else if (header === 'cargo') row.cargo = String(val).trim();
                            else if (header === 'nomina' || header === 'sueldo' || header === 'nómina') row.nomina = parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
                            else if (header === 'plus') row.plus = parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
                            else if (header === 'email' || header.includes('correo')) row.email = String(val).trim();
                            else if (header.includes('tel')) row.telefono = String(val).trim();
                            else if (header === 'cumpleaños' || header.includes('nacimiento') || header === 'fecha de nacimiento') row.fechaNacimiento = formatearFechaExcel(val);
                            else if (header.includes('fecha de ingreso') || header.includes('ingreso')) row.fechaIngreso = formatearFechaExcel(val);
                        });

                        if (row.nomina !== undefined || row.plus !== undefined) {
                            row.salarioMensual = (row.nomina || 0) + (row.plus || 0);
                        }

                        if (row.ci && row.nombreCompleto) {
                            allData.push(row);
                        }
                    });
                });

                setImportData(allData);
                setSheetsMap(detectedSheetsMap);
                setImportResult(null);
            } catch (err) {
                console.error(err);
                alert('Error de Lectura', 'Hubo un problema al procesar el archivo Excel: ' + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const ejecutarImportacion = async () => {
        if (importData.length === 0) return;
        setImportando(true);
        try {
            // Asignar sucursales según el mapa antes de enviar
            const finalData = importData.map(row => ({
                ...row,
                sucursalId: sheetsMap[row.sheetSource] || null
            }));
            const result = await importService.importarUsuarios(finalData);
            setImportResult(result);
            cargarUsuarios();
        } catch (e) {
            alert('Error en Importación', e.response?.data?.error || e.message, 'error');
        }
        setImportando(false);
    };

    const crearUsuario = async () => {
        if (!nuevoUsuario.ci || !nuevoUsuario.nombreCompleto) {
            alert('Campos Requeridos', 'El CI y el Nombre Completo son obligatorios para registrar a un funcionario.', 'warning');
            return;
        }
        setCreando(true);
        try {
            await adminService.createUsuario({
                username: nuevoUsuario.ci.replace(/[^0-9]/g, ''),
                nombreCompleto: nuevoUsuario.nombreCompleto,
                email: nuevoUsuario.email || null,
                telefono: nuevoUsuario.telefono || null,
                salarioMensual: nuevoUsuario.salarioMensual ? parseFloat(nuevoUsuario.salarioMensual) : 0,
                rol: nuevoUsuario.rol,
                password: nuevoUsuario.ci.replace(/[^0-9]/g, ''),
                activo: true,
                requiereGeolocalizacion: true
            });
            setShowCrear(false);
            setNuevoUsuario({ ci: '', nombreCompleto: '', email: '', telefono: '', salarioMensual: '', rol: 'EMPLEADO' });
            cargarUsuarios();
            alert('Funcionario Creado', 'El usuario se ha registrado correctamente. La contraseña inicial es su número de CI.', 'success');
        } catch (e) {
            alert('Error al Crear', e.response?.data?.error || e.message, 'error');
        }
        setCreando(false);
    };

    const filtrados = usuarios.filter(u =>
        (u.nombreCompleto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.username || '').includes(busqueda)
    );

    const cardStyle = {
        background: 'white', borderRadius: 16, padding: '1.25rem',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    };

    const inputStyle = {
        width: '100%', padding: '0.6rem 0.75rem', borderRadius: 10,
        border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box'
    };

    const thStyle = {
        padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0',
        fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
        letterSpacing: '0.05em', whiteSpace: 'nowrap'
    };

    const tdStyle = {
        padding: '0.7rem 1rem', borderBottom: '1px solid #f1f5f9',
        fontSize: '0.85rem', color: '#334155'
    };

    return (
        <div style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users size={26} style={{ color: '#3b82f6' }} />
                    Gestión de Funcionarios
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setShowImport(!showImport); setShowCrear(false); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0.5rem 1rem', borderRadius: 10, border: 'none',
                            background: showImport ? '#ef4444' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                        {showImport ? <><X size={16} /> Cerrar</> : <><Download size={16} /> Importar Excel</>}
                    </button>
                    <button onClick={() => { setShowCrear(!showCrear); setShowImport(false); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0.5rem 1rem', borderRadius: 10, border: 'none',
                            background: showCrear ? '#ef4444' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                        {showCrear ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo</>}
                    </button>
                </div>
            </div>

            {/* Crear individualmente */}
            {showCrear && (
                <div style={{ ...cardStyle, marginBottom: '1rem', background: '#f8fafc' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>➕ Nuevo Funcionario</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>CI (Cédula)*</label>
                            <input style={inputStyle} value={nuevoUsuario.ci} onChange={e => setNuevoUsuario({ ...nuevoUsuario, ci: e.target.value })} placeholder="ej: 4567890" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Nombre Completo*</label>
                            <input style={inputStyle} value={nuevoUsuario.nombreCompleto} onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombreCompleto: e.target.value })} placeholder="Juan Pérez" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Email</label>
                            <input style={inputStyle} type="email" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })} placeholder="juan@email.com" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Teléfono</label>
                            <input style={inputStyle} value={nuevoUsuario.telefono} onChange={e => setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })} placeholder="0981..." />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Salario Mensual</label>
                            <input style={inputStyle} type="number" value={nuevoUsuario.salarioMensual} onChange={e => setNuevoUsuario({ ...nuevoUsuario, salarioMensual: e.target.value })} placeholder="3500000" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Rol</label>
                            <select style={inputStyle} value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}>
                                <option value="EMPLEADO">Empleado</option>
                                <option value="ADMIN_SUCURSAL">Admin Sucursal</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.75rem 0 0' }}>
                        ℹ️ La contraseña inicial será el número de CI del funcionario.
                    </p>
                    <button onClick={crearUsuario} disabled={creando}
                        style={{
                            marginTop: '1rem', padding: '0.65rem 2rem', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                            fontWeight: 700, cursor: 'pointer', opacity: creando ? 0.7 : 1
                        }}>
                        {creando ? 'Creando...' : 'Crear Funcionario'}
                    </button>
                </div>
            )}

            {/* IMPORTACIÓN EXCEL */}
            {showImport && (
                <div style={{ ...cardStyle, marginBottom: '1rem', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderColor: '#fcd34d' }}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#92400e' }}>📊 Importar Funcionarios desde Excel/CSV</h3>
                    <p style={{ fontSize: '0.82rem', color: '#78716c', margin: '0 0 0.75rem' }}>
                        Sube un archivo CSV con columnas: <strong>CI, Nombre Completo</strong> (obligatorios),
                        Email, Teléfono, Salario (opcionales). Separador: coma (,) o punto y coma (;).
                    </p>

                    {/* Plantilla descargable */}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <button onClick={() => {
                            const ws_data = [
                                ["COOPERATIVA REDUCTO LTDA"],
                                ["PLANILLA DE FUNCIONARIOS POR SUCURSAL - CASA MATRIZ"],
                                [""], [""], [""], [""],
                                ["Nº DE SOCIO", "CI", "CUMPLEAÑOS", "DIAS PARA CUMPLEAÑOS", "FECHA DE INGRESO", "CARGO", "NOMINA", "PLUS", "NOMBRE Y APELLIDO * CENTRAL"],
                                [24256, 2210018, "25/2/1976", 4, "05/11/2012", "Oficial", 6000000, 1000000, "Lilian Marlene Ocampos"]
                            ];
                            const wb = XLSX.utils.book_new();
                            const ws = XLSX.utils.aoa_to_sheet(ws_data);
                            XLSX.utils.book_append_sheet(wb, ws, "CASA MATRIZ");
                            XLSX.writeFile(wb, "plantilla_cooperativa.xlsx");
                        }}
                            style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #d97706', background: 'white', color: '#92400e', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                            📥 Descargar plantilla Excel (Formato Planilla)
                        </button>
                    </div>

                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('excel-upload').click()}
                        style={{
                            border: `2px dashed ${dragActive ? '#d97706' : '#fcd34d'}`,
                            borderRadius: 16,
                            padding: '2.5rem 1.5rem',
                            textAlign: 'center',
                            background: dragActive ? 'rgba(217, 119, 6, 0.05)' : 'rgba(255, 255, 255, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '1rem',
                            position: 'relative'
                        }}
                    >
                        <input
                            id="excel-upload"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        <div style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: dragActive ? '#d97706' : '#fffbeb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: dragActive ? 'white' : '#d97706',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)'
                        }}>
                            {importData.length > 0 ? <FileSpreadsheet size={32} /> : <Upload size={32} />}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: '1rem' }}>
                                {importData.length > 0 ? `${importData.length} funcionarios detectados` : 'Arrastra tu archivo aquí'}
                            </p>
                            <p style={{ margin: '4px 0 0', color: '#b45309', fontSize: '0.82rem' }}>
                                o haz clic para buscar en tu equipo
                            </p>
                        </div>

                        {importData.length > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); ejecutarImportacion(); }} disabled={importando}
                                style={{
                                    marginTop: '8px',
                                    padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: 'white', fontWeight: 700, cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                    opacity: importando ? 0.7 : 1,
                                    zIndex: 10
                                }}>
                                {importando ? 'Importando...' : `🚀 Procesar e Importar`}
                            </button>
                        )}
                    </div>

                    {/* Mapeo de Hojas a Sucursales */}
                    {importData.length > 0 && Object.keys(sheetsMap).length > 0 && !importResult && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: 12, border: '1px solid #ffedb3' }}>
                            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#92400e' }}>📍 Mapeo de Hojas a Sucursales Detectadas:</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                {Array.from(new Set(importData.map(d => d.sheetSource))).map(sheetName => (
                                    <div key={sheetName} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Hoja: {sheetName}</span>
                                        <select
                                            value={sheetsMap[sheetName] || ''}
                                            onChange={(e) => setSheetsMap({ ...sheetsMap, [sheetName]: e.target.value })}
                                            style={{ ...inputStyle, padding: '4px 8px', fontSize: '0.8rem' }}
                                        >
                                            <option value="">Seleccionar Sucursal...</option>
                                            {sucursales.map(s => (
                                                <option key={s.id} value={s.id}>{s.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {importData.length > 0 && !importResult && (
                        <div style={{ marginTop: '1rem', maxHeight: 250, overflow: 'auto', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                                        <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Hoja</th>
                                        <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>CI</th>
                                        <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nombre</th>
                                        <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Salario</th>
                                        <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Plus</th>
                                        <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importData.slice(0, 50).map((row, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '4px 10px', borderBottom: '1px solid #f3f4f6', color: '#6d7278', fontSize: '0.7rem' }}>{row.sheetSource}</td>
                                            <td style={{ padding: '4px 10px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace' }}>{row.ci || '-'}</td>
                                            <td style={{ padding: '4px 10px', borderBottom: '1px solid #f3f4f6' }}>{row.nombreCompleto || '-'}</td>
                                            <td style={{ padding: '4px 10px', borderBottom: '1px solid #f3f4f6' }}>{row.nomina ? row.nomina.toLocaleString('es-PY') : '-'}</td>
                                            <td style={{ padding: '4px 10px', borderBottom: '1px solid #f3f4f6' }}>{row.plus ? row.plus.toLocaleString('es-PY') : '-'}</td>
                                            <td style={{ padding: '4px 10px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>{row.salarioMensual ? row.salarioMensual.toLocaleString('es-PY') : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {importData.length > 50 && <p style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>... y {importData.length - 50} más</p>}
                        </div>
                    )}

                    {/* Resultado */}
                    {importResult && (
                        <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#166534' }}>✅ Importación completada</h4>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                <span><strong style={{ color: '#10b981' }}>{importResult.creados}</strong> creados</span>
                                <span><strong style={{ color: '#3b82f6' }}>{importResult.actualizados}</strong> actualizados</span>
                                <span><strong style={{ color: '#ef4444' }}>{importResult.omitidos}</strong> omitidos</span>
                            </div>
                            {importResult.errores?.length > 0 && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#991b1b' }}>
                                    {importResult.errores.map((err, i) => (
                                        <div key={i}>Fila {err.fila}: {err.error}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Buscador */}
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o CI..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ ...cardStyle, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{usuarios.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Funcionarios</div>
                </div>
                <div style={{ ...cardStyle, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{usuarios.filter(u => u.activo).length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Activos</div>
                </div>
                <div style={{ ...cardStyle, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{usuarios.filter(u => !u.activo).length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Inactivos</div>
                </div>
            </div>

            {/* Tabla */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                        <Loader2 size={32} style={{ color: '#3b82f6' }} />
                    </div>
                </div>
            ) : (
                <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={thStyle}>CI</th>
                                <th style={thStyle}>Nombre Completo</th>
                                <th style={thStyle}>Rol</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Estado</th>
                                <th style={thStyle}>Sucursal</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Salario</th>
                                <th style={thStyle}>Creado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map(u => (
                                <tr key={u.id}
                                    style={{ transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{u.username}</td>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{u.nombreCompleto}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                                            background: u.rol === 'ADMIN' ? '#dbeafe' : u.rol === 'ADMIN_SUCURSAL' ? '#fef3c7' : '#f1f5f9',
                                            color: u.rol === 'ADMIN' ? '#1e40af' : u.rol === 'ADMIN_SUCURSAL' ? '#92400e' : '#475569'
                                        }}>
                                            {u.rol === 'ADMIN' ? 'Admin' : u.rol === 'ADMIN_SUCURSAL' ? 'Admin Suc.' : 'Empleado'}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                                            background: u.activo ? '#d1fae5' : '#fee2e2',
                                            color: u.activo ? '#065f46' : '#991b1b'
                                        }}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '0.82rem', color: '#64748b' }}>
                                        {u.sucursal?.nombre || 'Sin asignar'}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                                        {u.salarioMensual ? parseFloat(u.salarioMensual).toLocaleString('es-PY') : '-'}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: '0.78rem', color: '#94a3b8' }}>
                                        {u.fechaCreacion ? new Date(u.fechaCreacion).toLocaleDateString('es-PY') : '-'}
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        No se encontraron funcionarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
