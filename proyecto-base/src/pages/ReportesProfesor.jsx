import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import '../styles/ReportesProfesor.css';
import { LabelList } from "recharts";


export default function ReportesProfesor() {
  const [filtroTema, setFiltroTema] = useState('Todos');
  const [filtroEvaluacion, setFiltroEvaluacion] = useState('Todas');
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState('');

  const ensayos = JSON.parse(localStorage.getItem('ensayos') || '[]');
  const keys = Object.keys(localStorage).filter(k => k.startsWith('respuestasAlumno_'));
  const respuestasAlumnos = keys.flatMap(k => JSON.parse(localStorage.getItem(k) || '[]'));

  const generarStatsPorPregunta = () => {
  const stats = [];

  ensayos.forEach(ensayo => {
    (ensayo.preguntas || []).forEach((preg, idx) => {
      const respuestasPreg = respuestasAlumnos
        .filter(r => r.ensayoId === ensayo.id)
        .map(r => r.respuestas[idx] || '');

      const total = respuestasPreg.length;
      if (total === 0) return;

      const correctas = respuestasPreg.reduce((acc, rAlumno) => {
        if (preg.tipo === 'desarrollo') {
          return acc + ((rAlumno || '').trim().toLowerCase() === (preg.respuestaCorrecta || '').trim().toLowerCase() ? 1 : 0);
        } else {
          return acc + (rAlumno === preg.respuestaCorrecta ? 1 : 0);
        }
      }, 0);

      let respuestasPorAlternativa = [];
      if (preg.tipo === 'cuestionario' && preg.alternativas) {
        respuestasPorAlternativa = preg.alternativas.map(alt => {
          const count = respuestasPreg.filter(r => r === alt).length;
          const porcentaje = total ? Math.round((count / total) * 100) : 0;
          return { alternativa: alt, porcentaje };
        });
      }

      stats.push({
        id: `${ensayo.id}-${idx}`,
        ensayoId: ensayo.id,
        tituloEnsayo: ensayo.titulo,
        enunciado: preg.enunciado,
        tema: preg.tema || 'Sin asignatura',
        tipo: preg.tipo,
        total,
        correctas,
        porcentaje: total ? Math.round((correctas / total) * 100) : null, 
        respuestasPorAlternativa 
      });
    });
  });

  return stats;
};


  const statsPorPregunta = generarStatsPorPregunta();

  const temas = ['Todos', ...new Set(statsPorPregunta.map(s => s.tema))];
  const evaluaciones = ['Todas', ...new Set(statsPorPregunta.map(s => s.tituloEnsayo))];

  let statsFiltrados = statsPorPregunta;
  if (filtroTema !== 'Todos') statsFiltrados = statsFiltrados.filter(s => s.tema === filtroTema);
  if (filtroEvaluacion !== 'Todas') statsFiltrados = statsFiltrados.filter(s => s.tituloEnsayo === filtroEvaluacion);
  if (preguntaSeleccionada) statsFiltrados = statsFiltrados.filter(s => s.id === preguntaSeleccionada);
  const cantidadPreguntas = statsFiltrados.length;


  const preguntasFiltradas = filtroEvaluacion !== 'Todas'
    ? statsPorPregunta.filter(p => p.tituloEnsayo === filtroEvaluacion)
    : [];

  const dataAprobacionPorTema = preguntaSeleccionada
    ? statsFiltrados.map(p => {
        const aprobacion = p.porcentaje ?? 0;
        const desaprobacion = p.porcentaje != null ? 100 - p.porcentaje : 0;
        return { tema: p.tema, Aprobación: aprobacion, Desaprobación: desaprobacion };
      })
    : temas
        .filter(t => t !== 'Todos')
        .map(tema => {
          const preguntasTema = statsFiltrados.filter(s => s.tema === tema);
          const totalRespuestas = preguntasTema.reduce((acc, s) => acc + s.total, 0);
          const totalCorrectas = preguntasTema.reduce((acc, s) => acc + s.correctas, 0);
          const porcentajeAprobacion = totalRespuestas ? Math.round((totalCorrectas / totalRespuestas) * 100) : null;
          return {
            tema,
            Aprobación: porcentajeAprobacion ?? 0,
            Desaprobación: porcentajeAprobacion != null ? 100 - porcentajeAprobacion : 0
          };
        });

  const dataPorTipo = ['cuestionario', 'desarrollo'].map(tipo => {
    const preguntasTipo = statsFiltrados.filter(p => p.tipo === tipo);
    const totalCorrectas = preguntasTipo.reduce((acc, p) => acc + p.correctas, 0);
    const totalRespuestas = preguntasTipo.reduce((acc, p) => acc + p.total, 0);
    return {
      name: tipo,
      value: totalRespuestas ? Math.round((totalCorrectas / totalRespuestas) * 100) : 0
    };
  });

  const coloresPastelTipo = ['#a79aff', '#f6a6ff']; 

  const dataPreguntaSeleccionada = preguntaSeleccionada && statsFiltrados[0]
    ? [
        { name: 'Correctas', value: statsFiltrados[0].correctas, fill: '#86efac' },
        { name: 'Incorrectas', value: statsFiltrados[0].total - statsFiltrados[0].correctas, fill: '#fca5a5' }
      ]
    : [];

  return (
    <div className="reportes-page">
      <div className="reportes-container">
        <div className="contador-preguntas">
          Total de preguntas: {cantidadPreguntas}
        </div>
        <div className="volver-fijo">
          <Link to="/profesor" className="btn-volver-rojo">Volver al menú</Link>
        </div>

        <h1>Dashboard de rendimiento</h1>

        {statsFiltrados.length === 0 ? (
          <p className="mensaje-vacio">No hay datos de respuestas para mostrar gráficos.</p>
        ) : (
          <>
            {}
            <div className="filtros-linea">
              <div className="filtro-tema">
                <label>Asignatura:</label>
                <select value={filtroTema} onChange={e => setFiltroTema(e.target.value)}>
                  {temas.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="filtro-evaluacion">
                <label>Evaluación:</label>
                <select value={filtroEvaluacion} onChange={e => {
                  setFiltroEvaluacion(e.target.value);
                  setPreguntaSeleccionada('');
                }}>
                  {evaluaciones.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {filtroEvaluacion !== 'Todas' && (
                <div className="filtro-pregunta">
                  <label>Pregunta:</label>
                  <select value={preguntaSeleccionada} onChange={e => setPreguntaSeleccionada(e.target.value)}>
                    <option value="">Seleccione una pregunta</option>
                    {preguntasFiltradas.map(p => (
                      <option key={p.id} value={p.id}>{p.enunciado}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {}
            <div className="graficos-grid">
              <div className="grafico-item">
                <h2>Aprobación por asignatura</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dataAprobacionPorTema} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tema" />
                    <YAxis unit="%" />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="Aprobación" fill="#60a5fa" />
                    <Bar dataKey="Desaprobación" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grafico-item">
                <h2>% de aciertos por tipo de pregunta</h2>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={dataPorTipo}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, value }) => `${name}: ${value}%`} 
                        >
                          {dataPorTipo.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === 0 ? '#93c5fd' : '#fb923c'} 
                            />
                          ))}
                        </Pie>

                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#93c5fd', borderRadius: '4px' }}></div>
                    <span>Alternativa</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#fb923c', borderRadius: '4px' }}></div>
                    <span>Desarrollo</span>
                  </div>
                </div>
              </div>


              {preguntaSeleccionada && dataPreguntaSeleccionada.length > 0 && (
                <div className="grafico-item">
                  <h2>Correctas vs Incorrectas</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={dataPreguntaSeleccionada}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {preguntaSeleccionada && statsFiltrados[0] && (
                <div className="grafico-item">
                  <h2>{statsFiltrados[0].tipo === 'cuestionario' ? '% por alternativa' : '% Correctas vs Incorrectas'}</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    {statsFiltrados[0].tipo === 'cuestionario' ? (
                      <BarChart
                        layout="vertical"
                        data={statsFiltrados[0].respuestasPorAlternativa || []} 
                        margin={{ top: 10, right: 10, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" unit="%" />
                        <YAxis dataKey="alternativa" type="category" />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="porcentaje" fill="#60a5fa" />
                      </BarChart>
                    ) : (
                      <BarChart
                        layout="vertical"
                        data={[
                          {
                            name: 'Correctas',
                            value: statsFiltrados[0].total
                              ? Math.round((statsFiltrados[0].correctas / statsFiltrados[0].total) * 100)
                              : 0,
                            fill: '#86efac'
                          },
                          {
                            name: 'Incorrectas',
                            value: statsFiltrados[0].total
                              ? Math.round(((statsFiltrados[0].total - statsFiltrados[0].correctas) / statsFiltrados[0].total) * 100)
                              : 0,
                            fill: '#fca5a5'
                          }
                        ]}
                        margin={{ top: 10, right: 10, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" unit="%" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="value">
                          <Cell fill="#86efac" />
                          <Cell fill="#fca5a5" />
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}


              <div className="grafico-item-full">
                <h2>Resultados individuales por pregunta</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={statsFiltrados} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="enunciado"
                      interval={0}
                      height={80}
                      tick={({ x, y, payload }) => {
                        const maxLength = 15; 
                        let displayText = payload.value;
                        if (displayText.length > maxLength) {
                          displayText = displayText.slice(0, maxLength) + '...';
                        }
                        return (
                          <text
                            x={x}
                            y={y + 10}
                            textAnchor="end"
                            transform={`rotate(-40, ${x}, ${y + 10})`}
                            fill="#374151"
                            fontSize={12}
                          >
                            {displayText}
                          </text>
                        );
                      }}
                    />

                    <YAxis unit="%" />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="porcentaje" stroke="#ff9800" name="Porcentaje de aciertos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
