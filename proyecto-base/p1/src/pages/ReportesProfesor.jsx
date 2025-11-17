import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import '../styles/ReportesProfesor.css';


const API_RESP = 'http://localhost:8081/api/respuestas/all';

function leerEnsayosDesdeLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem('ensayos') || '[]');
  } catch {
    return [];
  }
}

function normalizarRespuestaAPI(data) {
  if (!Array.isArray(data)) return [];
  return data.map(row => ({
    ensayoId: row.ensayoId,
    respuestas: row.respuestas || {},
    fechaIso: row.fechaIso,
    username: row.username
  }));
}

function cargarRespuestasDesdeLocalStorage() {
  const keys = Object.keys(localStorage).filter(k =>
    k.startsWith('respuestasAlumno_')
  );

  return keys.flatMap(k => {
    try {
      return JSON.parse(localStorage.getItem(k) || '[]');
    } catch {
      return [];
    }
  });
}

function obtenerRespuestasDePregunta(respuestasAlumnos, ensayoId, idx) {
  return respuestasAlumnos
    .filter(r => String(r.ensayoId) === String(ensayoId))
    .map(r => (r.respuestas?.[idx] || ''));
}

function contarCorrectas(preg, respuestasPreg) {
  if (!respuestasPreg.length) return 0;

  if (preg.tipo === 'desarrollo') {
    const correcta = (preg.respuestaCorrecta || '').trim().toLowerCase();
    return respuestasPreg.reduce((acc, rAlumno) => {
      const normalizada = (rAlumno || '').trim().toLowerCase();
      return acc + (normalizada === correcta ? 1 : 0);
    }, 0);
  }

  return respuestasPreg.reduce(
    (acc, rAlumno) => acc + (rAlumno === preg.respuestaCorrecta ? 1 : 0),
    0
  );
}

function calcularRespuestasPorAlternativa(preg, respuestasPreg, total) {
  if (preg.tipo !== 'cuestionario' || !preg.alternativas) return [];

  return preg.alternativas.map(alt => {
    const count = respuestasPreg.filter(r => r === alt).length;
    const porcentaje = total ? Math.round((count / total) * 100) : 0;
    return { alternativa: alt, porcentaje };
  });
}

function generarStatsPorPregunta(ensayos, respuestasAlumnos) {
  const stats = [];

  ensayos.forEach(ensayo => {
    const preguntas = ensayo.preguntas || [];

    preguntas.forEach((preg, idx) => {
      const respuestasPreg = obtenerRespuestasDePregunta(
        respuestasAlumnos,
        ensayo.id,
        idx
      );

      const total = respuestasPreg.length;
      if (total === 0) return;

      const correctas = contarCorrectas(preg, respuestasPreg);
      const respuestasPorAlternativa = calcularRespuestasPorAlternativa(
        preg,
        respuestasPreg,
        total
      );

      const porcentaje = total
        ? Math.round((correctas / total) * 100)
        : null;

      stats.push({
        id: `${ensayo.id}-${idx}`,
        ensayoId: ensayo.id,
        tituloEnsayo: ensayo.titulo,
        enunciado: preg.enunciado,
        tema: preg.tema || 'Sin asignatura',
        tipo: preg.tipo,
        total,
        correctas,
        porcentaje,
        respuestasPorAlternativa,
        respuestaCorrecta: preg.respuestaCorrecta
      });
    });
  });

  return stats;
}

function filtrarStats(stats, filtroTema, filtroEvaluacion, preguntaSeleccionada) {
  let resultado = stats;

  if (filtroTema !== 'Todos') {
    resultado = resultado.filter(s => s.tema === filtroTema);
  }

  if (filtroEvaluacion !== 'Todas') {
    resultado = resultado.filter(s => s.tituloEnsayo === filtroEvaluacion);
  }

  if (preguntaSeleccionada) {
    resultado = resultado.filter(s => s.id === preguntaSeleccionada);
  }

  return resultado;
}

function buildDataAprobacionPorTema(statsFiltrados, temas, preguntaSeleccionada) {
  if (preguntaSeleccionada) {
    return statsFiltrados.map(p => {
      const aprobacion = p.porcentaje ?? 0;
      const desaprobacion = p.porcentaje != null ? 100 - p.porcentaje : 0;
      return { tema: p.tema, Aprobación: aprobacion, Desaprobación: desaprobacion };
    });
  }

  return temas
    .filter(t => t !== 'Todos')
    .map(tema => {
      const preguntasTema = statsFiltrados.filter(s => s.tema === tema);
      const totalRespuestas = preguntasTema.reduce(
        (acc, s) => acc + s.total,
        0
      );
      const totalCorrectas = preguntasTema.reduce(
        (acc, s) => acc + s.correctas,
        0
      );

      const porcentajeAprobacion = totalRespuestas
        ? Math.round((totalCorrectas / totalRespuestas) * 100)
        : null;

      return {
        tema,
        Aprobación: porcentajeAprobacion ?? 0,
        Desaprobación:
          porcentajeAprobacion != null ? 100 - porcentajeAprobacion : 0
      };
    });
}

function buildDataPorTipo(statsFiltrados) {
  return ['cuestionario', 'desarrollo'].map(tipo => {
    const preguntasTipo = statsFiltrados.filter(p => p.tipo === tipo);
    const totalCorrectas = preguntasTipo.reduce(
      (acc, p) => acc + p.correctas,
      0
    );
    const totalRespuestas = preguntasTipo.reduce(
      (acc, p) => acc + p.total,
      0
    );

    return {
      name: tipo,
      value: totalRespuestas
        ? Math.round((totalCorrectas / totalRespuestas) * 100)
        : 0
    };
  });
}

function buildDataPreguntaSeleccionada(preguntaSeleccionada, statSeleccionada) {
  if (!preguntaSeleccionada || !statSeleccionada) return [];

  return [
    {
      name: 'Correctas',
      value: statSeleccionada.correctas,
      fill: '#86efac'
    },
    {
      name: 'Incorrectas',
      value: statSeleccionada.total - statSeleccionada.correctas,
      fill: '#fca5a5'
    }
  ];
}

function renderTickEnunciado({ x, y, payload }) {
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
}


function useRespuestasAlumnos(apiUrl) {
  const [respuestasAlumnos, setRespuestasAlumnos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let cancel = false;

    async function cargar() {
      setCargando(true);
      try {
        const r = await fetch(apiUrl);
        if (!r.ok) throw new Error('fetch failed');

        const data = await r.json();
        const normalizado = normalizarRespuestaAPI(data);

        if (!cancel) setRespuestasAlumnos(normalizado);
      } catch {
        const fallback = cargarRespuestasDesdeLocalStorage();
        if (!cancel) setRespuestasAlumnos(fallback);
      } finally {
        if (!cancel) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancel = true;
    };
  }, [apiUrl]);

  return { respuestasAlumnos, cargando };
}


function FiltrosReportes({
  temas,
  evaluaciones,
  filtroTema,
  filtroEvaluacion,
  preguntaSeleccionada,
  preguntasFiltradas,
  onChangeTema,
  onChangeEvaluacion,
  onChangePregunta
}) {
  return (
    <div className="filtros-linea">
      <div className="filtro-tema">
        <label>Asignatura:</label>
        <select value={filtroTema} onChange={onChangeTema}>
          {temas.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="filtro-evaluacion">
        <label>Evaluación:</label>
        <select value={filtroEvaluacion} onChange={onChangeEvaluacion}>
          {evaluaciones.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {filtroEvaluacion !== 'Todas' && (
        <div className="filtro-pregunta">
          <label>Pregunta:</label>
          <select
            value={preguntaSeleccionada}
            onChange={onChangePregunta}
          >
            <option value="">Seleccione una pregunta</option>
            {preguntasFiltradas.map(p => (
              <option key={p.id} value={p.id}>{p.enunciado}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function AprobacionPorTemaChart({ data }) {
  return (
    <div className="grafico-item">
      <h2>Aprobación por asignatura</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tema" />
          <YAxis unit="%" />
          <Tooltip formatter={value => `${value}%`} />
          <Legend />
          <Bar dataKey="Aprobación" fill="#60a5fa" />
          <Bar dataKey="Desaprobación" fill="#f87171" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AciertosPorTipoChart({ data }) {
  return (
    <div className="grafico-item">
      <h2>% de aciertos por tipo de pregunta</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={({ name, value }) => `${name}: ${value}%`}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? '#93c5fd' : '#fb923c'}
              />
            ))}
          </Pie>
          <Tooltip formatter={value => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function CorrectasIncorrectasPie({ data }) {
  if (!data.length) return null;

  return (
    <div className="grafico-item">
      <h2>Correctas vs Incorrectas</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
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
  );
}

function DetallePreguntaChart({ pregunta }) {
  if (!pregunta) return null;

  const esCuestionario = pregunta.tipo === 'cuestionario';

  const dataDesarrollo = [
    {
      name: 'Correctas',
      value: pregunta.total
        ? Math.round((pregunta.correctas / pregunta.total) * 100)
        : 0,
      fill: '#86efac'
    },
    {
      name: 'Incorrectas',
      value: pregunta.total
        ? Math.round(
            ((pregunta.total - pregunta.correctas) / pregunta.total) * 100
          )
        : 0,
      fill: '#fca5a5'
    }
  ];

  const data = esCuestionario
    ? pregunta.respuestasPorAlternativa || []
    : dataDesarrollo;

  const dataKey = esCuestionario ? 'porcentaje' : 'value';

  return (
    <div className="grafico-item">
      <h2>
        {esCuestionario
          ? '% por alternativa'
          : '% Correctas vs Incorrectas'}
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 10, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" unit="%" />
          <YAxis
            dataKey={esCuestionario ? 'alternativa' : 'name'}
            type="category"
          />
          <Tooltip formatter={value => (esCuestionario ? `${value}%` : value)} />
          <Bar dataKey={dataKey}>
            {esCuestionario
              ? (pregunta.respuestasPorAlternativa || []).map(
                  (entry, idx) => {
                    const esCorrecta =
                      String(entry.alternativa) ===
                      String(pregunta.respuestaCorrecta);
                    return (
                      <Cell
                        key={`cell-alt-${idx}`}
                        fill={esCorrecta ? '#86efac' : '#fca5a5'}
                      />
                    );
                  }
                )
              : (
                <>
                  <Cell fill="#86efac" />
                  <Cell fill="#fca5a5" />
                </>
                )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResultadosPorPreguntaChart({ data }) {
  return (
    <div className="grafico-item-full">
      <h2>Resultados individuales por pregunta</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="enunciado"
            interval={0}
            height={80}
            tick={renderTickEnunciado}
          />
          <YAxis unit="%" />
          <Tooltip formatter={value => `${value}%`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="porcentaje"
            stroke="#ff9800"
            name="Porcentaje de aciertos"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ReportesProfesor() {
  const [filtroTema, setFiltroTema] = useState('Todos');
  const [filtroEvaluacion, setFiltroEvaluacion] = useState('Todas');
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState('');

  const ensayos = useMemo(leerEnsayosDesdeLocalStorage, []);
  const { respuestasAlumnos, cargando } = useRespuestasAlumnos(API_RESP);

  const statsPorPregunta = useMemo(
    () => generarStatsPorPregunta(ensayos, respuestasAlumnos),
    [ensayos, respuestasAlumnos]
  );

  const temas = useMemo(
    () => ['Todos', ...new Set(statsPorPregunta.map(s => s.tema))],
    [statsPorPregunta]
  );

  const evaluaciones = useMemo(
    () => ['Todas', ...new Set(statsPorPregunta.map(s => s.tituloEnsayo))],
    [statsPorPregunta]
  );

  const statsFiltrados = useMemo(
    () =>
      filtrarStats(
        statsPorPregunta,
        filtroTema,
        filtroEvaluacion,
        preguntaSeleccionada
      ),
    [statsPorPregunta, filtroTema, filtroEvaluacion, preguntaSeleccionada]
  );

  const cantidadPreguntas = statsFiltrados.length;

  const preguntasFiltradas = useMemo(
    () =>
      filtroEvaluacion !== 'Todas'
        ? statsPorPregunta.filter(p => p.tituloEnsayo === filtroEvaluacion)
        : [],
    [statsPorPregunta, filtroEvaluacion]
  );

  const dataAprobacionPorTema = useMemo(
    () => buildDataAprobacionPorTema(statsFiltrados, temas, preguntaSeleccionada),
    [statsFiltrados, temas, preguntaSeleccionada]
  );

  const dataPorTipo = useMemo(
    () => buildDataPorTipo(statsFiltrados),
    [statsFiltrados]
  );

  const statSeleccionada = statsFiltrados[0] || null;

  const dataPreguntaSeleccionada = useMemo(
    () => buildDataPreguntaSeleccionada(preguntaSeleccionada, statSeleccionada),
    [preguntaSeleccionada, statSeleccionada]
  );

  const hayDatos = statsFiltrados.length > 0;

  return (
    <div className="reportes-page">
      <div className="reportes-container">
        <div className="contador-preguntas">
          {cargando
            ? 'Cargando…'
            : `Total de preguntas: ${cantidadPreguntas}`}
        </div>

        <div className="volver-fijo">
          <Link to="/profesor" className="btn-volver-rojo">
            Volver al menú
          </Link>
        </div>

        <h1>Dashboard de rendimiento</h1>

        {!hayDatos ? (
          <p className="mensaje-vacio">
            No hay datos de respuestas para mostrar gráficos.
          </p>
        ) : (
          <>
            <FiltrosReportes
              temas={temas}
              evaluaciones={evaluaciones}
              filtroTema={filtroTema}
              filtroEvaluacion={filtroEvaluacion}
              preguntaSeleccionada={preguntaSeleccionada}
              preguntasFiltradas={preguntasFiltradas}
              onChangeTema={e => setFiltroTema(e.target.value)}
              onChangeEvaluacion={e => {
                setFiltroEvaluacion(e.target.value);
                setPreguntaSeleccionada('');
              }}
              onChangePregunta={e => setPreguntaSeleccionada(e.target.value)}
            />

            <div className="graficos-grid">
              <AprobacionPorTemaChart data={dataAprobacionPorTema} />

              <AciertosPorTipoChart data={dataPorTipo} />

              {preguntaSeleccionada && dataPreguntaSeleccionada.length > 0 && (
                <CorrectasIncorrectasPie data={dataPreguntaSeleccionada} />
              )}

              {preguntaSeleccionada && statSeleccionada && (
                <DetallePreguntaChart pregunta={statSeleccionada} />
              )}

              <ResultadosPorPreguntaChart data={statsFiltrados} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
