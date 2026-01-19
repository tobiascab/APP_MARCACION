// Este es el componente completo de AdminReportes MEJORADO
function AdminReportes() {
    const [reportType, setReportType] = useState('asistencia');
    const [dateRange, setDateRange] = useState({
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });
    const [sucursalFiltro, setSucursalFiltro] = useState('');
    const [sucursales, setSucursales] = useState([]);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportGeneratedAt, setReportGeneratedAt] = useState(null);
    const currentUser = authService.getUsuarioActual();

    const reportTypeNames = {
        'asistencia': 'Reporte de Asistencia General',
        'descuentos': 'Reporte de Descuentos por Tardanza',
        'resumen': 'Resumen Ejecutivo por Sucursal'
    };

    useEffect(() => {
        cargarSucursales();
    }, []);

    const cargarSucursales = async () => {
        try {
            const data = await sucursalService.getSucursales();
            setSucursales(data);
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
        }
    };

    const generarReporte = async () => {
        try {
            setGeneratingReport(true);
            const [usuarios, marcaciones] = await Promise.all([
                adminService.getUsuarios(),
                adminService.getAllMarcaciones()
            ]);

            const marcacionesFiltradas = marcaciones.filter(m => {
                const fecha = m.fechaHora.split('T')[0];
                return fecha >= dateRange.inicio && fecha <= dateRange.fin;
            });

            let data = {};
            if (reportType === 'asistencia') {
                data = generarReporteAsistencia(marcacionesFiltradas, usuarios, sucursalFiltro);
            } else if (reportType === 'descuentos') {
                data = generarReporteDescuentos(marcacionesFiltradas, usuarios, sucursalFiltro);
            } else if (reportType === 'resumen') {
                data = generarReporteResumen(marcacionesFiltradas, usuarios, sucursalFiltro);
            }

            setReportData(data);
            setReportGeneratedAt(new Date());
        } catch (error) {
            console.error('Error al generar reporte:', error);
        } finally {
            setGeneratingReport(false);
        }
    };

    const generarReporteAsistencia = (marcaciones, usuarios, sucursalId) => {
        let usuariosFiltrados = usuarios;
        if (sucursalId) {
            usuariosFiltrados = usuarios.filter(u => u.sucursalId === parseInt(sucursalId));
        }

        return usuariosFiltrados.map(usuario => {
            const marcacionesUsuario = marcaciones.filter(m => m.usuarioId === usuario.id);
            const diasTrabajados = new Set(marcacionesUsuario.filter(m => m.tipo === 'ENTRADA').map(m => m.fechaHora.split('T')[0])).size;
            const tardanzas = marcacionesUsuario.filter(m => m.esTardia).length;

            return {
                nombre: usuario.nombreCompleto,
                cedula: usuario.username,
                sucursal: usuario.sucursal?.nombre || 'S/N',
                diasTrabajados,
                tardanzas,
                puntualidad: diasTrabajados > 0 ? Math.round(((diasTrabajados - tardanzas) / diasTrabajados) * 100) : 100
            };
        });
    };

    const generarReporteDescuentos = (marcaciones, usuarios, sucursalId) => {
        let usuariosFiltrados = usuarios;
        if (sucursalId) {
            usuariosFiltrados = usuarios.filter(u => u.sucursalId === parseInt(sucursalId));
        }

        return usuariosFiltrados.map(usuario => {
            const marcacionesUsuario = marcaciones.filter(m => m.usuarioId === usuario.id && m.esTardia);
            const totalDescuentos = marcacionesUsuario.reduce((sum, m) => sum + (m.descuentoCalculado || 0), 0);
            const totalMinutosTarde = marcacionesUsuario.reduce((sum, m) => sum + (m.minutosTarde || 0), 0);

            return {
                nombre: usuario.nombreCompleto,
                cedula: usuario.username,
                sucursal: usuario.sucursal?.nombre || 'S/N',
                cantidadTardanzas: marcacionesUsuario.length,
                totalMinutos: totalMinutosTarde,
                totalDescuentos
            };
        }).filter(u => u.cantidadTardanzas > 0).sort((a, b) => b.totalDescuentos - a.totalDescuentos);
    };

    const generarReporteResumen = (marcaciones, usuarios, sucursalId) => {
        const sucursalesData = sucursalId
            ? sucursales.filter(s => s.id === parseInt(sucursalId))
            : sucursales;

        return sucursalesData.map(sucursal => {
            const usuariosSucursal = usuarios.filter(u => u.sucursalId === sucursal.id);
            const marcacionesSucursal = marcaciones.filter(m => {
                const usuario = usuarios.find(u => u.id === m.usuarioId);
                return usuario && usuario.sucursalId === sucursal.id;
            });

            const tardias = marcacionesSucursal.filter(m => m.esTardia);
            const totalDescuentos = tardias.reduce((sum, m) => sum + (m.descuentoCalculado || 0), 0);

            return {
                sucursal: sucursal.nombre,
                totalEmpleados: usuariosSucursal.length,
                totalMarcaciones: marcacionesSucursal.length,
                totalTardanzas: tardias.length,
                totalDescuentos
            };
        });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const exportarPDF = () => {
        if (!reportData || reportData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const reportElement = document.getElementById('report-content');
        const opt = {
            margin: [15, 10, 15, 10],
            filename: `COOP_REDUCTO_${reportType.toUpperCase()}_${dateRange.inicio}_${dateRange.fin}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(reportElement).save();
    };

    const getSucursalNombre = () => {
        if (!sucursalFiltro) return 'Todas las Sucursales';
        const suc = sucursales.find(s => s.id === parseInt(sucursalFiltro));
        return suc ? suc.nombre : 'Todas las Sucursales';
    };

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1>Centro de Reportes</h1>
                    <p>Generación de informes detallados para análisis y gestión</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={exportarPDF} disabled={!reportData || reportData.length === 0}>
                        <FileText size={18} /> Descargar PDF
                    </button>
                </div>
            </header>

            <div className="filters-bar" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label>Tipo de Reporte</label>
                        <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                            <option value="asistencia">Asistencia General</option>
                            <option value="descuentos">Descuentos por Tardanza</option>
                            <option value="resumen">Resumen por Sucursal</option>
                        </select>
                    </div>

                    {currentUser?.rol === 'ADMIN' && (
                        <div className="form-group">
                            <label>Sucursal</label>
                            <select className="input" value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)}>
                                <option value="">Todas</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Fecha Inicio</label>
                        <input type="date" className="input" value={dateRange.inicio} onChange={(e) => setDateRange({ ...dateRange, inicio: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Fecha Fin</label>
                        <input type="date" className="input" value={dateRange.fin} onChange={(e) => setDateRange({ ...dateRange, fin: e.target.value })} />
                    </div>
                </div>

                <button className="btn btn-primary" onClick={generarReporte} disabled={generatingReport} style={{ width: '100%' }}>
                    {generatingReport ? <><Loader2 size={18} className="animate-spin" /> Generando...</> : <><TrendingUp size={18} /> Generar Reporte</>}
                </button>
            </div>

            {/* Contenido del Reporte para PDF */}
            <div id="report-content" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden' }}>
                {!reportData ? (
                    <div className="empty-state-large" style={{ padding: '4rem' }}>
                        <FileText size={64} />
                        <h3>Selecciona los filtros y genera un reporte</h3>
                        <p>Los datos aparecerán aquí listos para exportar</p>
                    </div>
                ) : reportData.length === 0 ? (
                    <div className="empty-state-large" style={{ padding: '4rem' }}>
                        <AlertTriangle size={64} style={{ color: '#f59e0b' }} />
                        <h3>No hay datos para el período seleccionado</h3>
                        <p>Intenta ajustar los filtros o el rango de fechas</p>
                    </div>
                ) : (
                    <>
                        {/* ENCABEZADO PROFESIONAL DEL REPORTE */}
                        <div style={{
                            background: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #22c55e 100%)',
                            padding: '2rem',
                            color: 'white',
                            borderBottom: '4px solid #fbbf24'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <img
                                    src="/logo_cooperativa.png"
                                    alt="Logo Cooperativa Reducto"
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        border: '3px solid white',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                        background: 'white'
                                    }}
                                />
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                        COOPERATIVA REDUCTO LTDA.
                                    </h1>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', opacity: 0.9 }}>
                                        de Microfinanza
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.15)',
                                padding: '1.25rem',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                                    📊 {reportTypeNames[reportType]}
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                                    <div>
                                        <strong>Período:</strong><br />
                                        {formatDate(dateRange.inicio)} - {formatDate(dateRange.fin)}
                                    </div>
                                    <div>
                                        <strong>Sucursal:</strong><br />
                                        {getSucursalNombre()}
                                    </div>
                                    <div>
                                        <strong>Generado por:</strong><br />
                                        {currentUser?.nombreCompleto || 'Administrador'}
                                    </div>
                                    <div>
                                        <strong>Fecha y Hora:</strong><br />
                                        {reportGeneratedAt?.toLocaleString('es-PY', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTENIDO DE LA TABLA */}
                        <div style={{ padding: '1.5rem' }}>
                            {reportType === 'asistencia' && (
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Colaborador</th>
                                            <th>Cédula</th>
                                            <th>Sucursal</th>
                                            <th style={{ textAlign: 'center' }}>Días Trabajados</th>
                                            <th style={{ textAlign: 'center' }}>Tardanzas</th>
                                            <th style={{ textAlign: 'center' }}>Puntualidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>{r.nombre}</td>
                                                <td>{r.cedula}</td>
                                                <td>{r.sucursal}</td>
                                                <td style={{ textAlign: 'center' }}>{r.diasTrabajados}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {r.tardanzas > 0 ? (
                                                        <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: '600' }}>
                                                            {r.tardanzas}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        color: r.puntualidad >= 90 ? '#16a34a' : r.puntualidad >= 70 ? '#f59e0b' : '#dc2626',
                                                        fontWeight: '700',
                                                        fontSize: '1.1rem'
                                                    }}>
                                                        {r.puntualidad}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {reportType === 'descuentos' && (
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Colaborador</th>
                                            <th>Cédula</th>
                                            <th>Sucursal</th>
                                            <th style={{ textAlign: 'center' }}>Tardanzas</th>
                                            <th style={{ textAlign: 'center' }}>Minutos Totales</th>
                                            <th style={{ textAlign: 'right' }}>Total Descuento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>{r.nombre}</td>
                                                <td>{r.cedula}</td>
                                                <td>{r.sucursal}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: '600' }}>
                                                        {r.cantidadTardanzas}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{r.totalMinutos} min</td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#dc2626', fontSize: '1.1rem' }}>
                                                    ₲ {r.totalDescuentos.toLocaleString('de-DE')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {reportType === 'resumen' && (
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Sucursal</th>
                                            <th style={{ textAlign: 'center' }}>Total Empleados</th>
                                            <th style={{ textAlign: 'center' }}>Marcaciones</th>
                                            <th style={{ textAlign: 'center' }}>Tardanzas</th>
                                            <th style={{ textAlign: 'right' }}>Total Descuentos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>{r.sucursal}</td>
                                                <td style={{ textAlign: 'center' }}>{r.totalEmpleados}</td>
                                                <td style={{ textAlign: 'center' }}>{r.totalMarcaciones}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: '600' }}>
                                                        {r.totalTardanzas}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#dc2626', fontSize: '1.1rem' }}>
                                                    ₲ {r.totalDescuentos.toLocaleString('de-DE')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* PIE DEL REPORTE */}
                        <div style={{
                            background: '#f8fafc',
                            padding: '1rem 2rem',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            color: '#64748b'
                        }}>
                            <div>
                                <strong>Sistema RelojReducto</strong> - Control de Asistencia
                            </div>
                            <div>
                                Documento generado automáticamente • {reportData.length} registro(s)
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
