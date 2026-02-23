import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, ChevronRight, X } from 'lucide-react';
import './VistaHistorial.css';

function VistaHistorial({ onBack, marcaciones = [] }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const todayRowRef = useRef(null);

    // Auto-scroll al día actual cuando se abre o cambia el mes
    useEffect(() => {
        if (todayRowRef.current) {
            setTimeout(() => {
                todayRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    }, [selectedDate]);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const formatTime = (fechaHora) => {
        if (!fechaHora) return '--:--';
        return new Date(fechaHora).toLocaleTimeString('es-PY', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const agruparMarcaciones = () => {
        const grupos = {};
        marcaciones.forEach(m => {
            const d = new Date(m.fechaHora);
            const key = d.getDate(); // Usamos solo el día como key para el mes actual

            // Solo agrupar si es del mes y año seleccionado
            if (d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear()) {
                if (!grupos[key]) {
                    grupos[key] = { entrada: null, salida: null };
                }
                if (m.tipo === 'ENTRADA') {
                    if (!grupos[key].entrada || new Date(m.fechaHora) < new Date(grupos[key].entrada.fechaHora)) {
                        grupos[key].entrada = m;
                    }
                } else if (m.tipo === 'SALIDA') {
                    if (!grupos[key].salida || new Date(m.fechaHora) > new Date(grupos[key].salida.fechaHora)) {
                        grupos[key].salida = m;
                    }
                }
            }
        });
        return grupos;
    };

    const marcacionesAgrupadas = agruparMarcaciones();
    const daysCount = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);

    const handleConfirmPicker = () => {
        setSelectedDate(new Date(tempDate));
        setShowPicker(false);
    };

    const changeTempMonth = (delta) => {
        const newDate = new Date(tempDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setTempDate(newDate);
    };

    const changeTempYear = (delta) => {
        const newDate = new Date(tempDate);
        newDate.setFullYear(newDate.getFullYear() + delta);
        setTempDate(newDate);
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === selectedDate.getMonth() &&
            today.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <div className="vista-historial">
            {/* Header */}
            <header className="historial-header-nav">
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={28} />
                </button>
                <h1>Historial de marcaciones</h1>
            </header>

            <div className="historial-content">
                <div className="period-selector-container">
                    <label>Seleccione el periodo</label>
                    <div className="period-field" onClick={() => { setTempDate(new Date(selectedDate)); setShowPicker(true); }}>
                        <span>
                            {(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/{selectedDate.getFullYear()}
                        </span>
                        <CalendarIcon size={20} className="calendar-icon" />
                    </div>
                </div>

                <div className="historial-table-wrapper">
                    <table className="historial-table-custom">
                        <thead>
                            <tr>
                                <th>Historial</th>
                                <th></th>
                                <th className="text-center">Entr.</th>
                                <th className="text-center">Salida</th>
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => {
                                const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                                const dayName = daysOfWeek[date.getDay()];
                                const marc = marcacionesAgrupadas[day] || {};
                                const highlighted = isToday(day);

                                return (
                                    <tr key={day} className={highlighted ? 'highlight' : ''} ref={highlighted ? todayRowRef : null}>
                                        <td className="day-num">{day.toString().padStart(2, '0')}/{(selectedDate.getMonth() + 1).toString().padStart(2, '0')}</td>
                                        <td className="day-name">{dayName}</td>
                                        <td className={`time-val text-center ${marc.entrada?.esTardia ? 'tardia' : ''} ${highlighted ? 'green-text' : ''}`}>
                                            {formatTime(marc.entrada?.fechaHora)}
                                        </td>
                                        <td className={`time-val text-center ${highlighted ? 'green-text' : ''}`}>
                                            {formatTime(marc.salida?.fechaHora)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Picker Modal Premium */}
            {showPicker && (
                <div className="picker-overlay" onClick={() => setShowPicker(false)}>
                    <div className="picker-sheet animate-slideUp" onClick={e => e.stopPropagation()}>
                        <div className="picker-controls">
                            <div className="picker-control-group">
                                <button onClick={() => changeTempMonth(-1)}><ChevronLeft size={20} /></button>
                                <span className="picker-val">{months[tempDate.getMonth()].substring(0, 3)}</span>
                                <button onClick={() => changeTempMonth(1)}><ChevronRight size={20} /></button>
                            </div>
                            <div className="picker-control-group">
                                <button onClick={() => changeTempYear(-1)}><ChevronLeft size={20} /></button>
                                <span className="picker-val">{tempDate.getFullYear()}</span>
                                <button onClick={() => changeTempYear(1)}><ChevronRight size={20} /></button>
                            </div>
                            <button className="picker-today" onClick={() => setTempDate(new Date())}>Hoy</button>
                        </div>
                        <div className="picker-actions">
                            <button className="btn-cancel-premium" onClick={() => setShowPicker(false)}>Cancelar</button>
                            <button className="btn-confirm-premium" onClick={handleConfirmPicker}>
                                Confirmar
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VistaHistorial;
