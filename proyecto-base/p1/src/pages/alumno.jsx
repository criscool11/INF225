import React, { useEffect, useMemo, useState } from 'react';
import '../styles/DashboardAlumno.css';

export default function DashboardAlumno({ onLogout, loginData }) {
  const username = loginData?.username || 'anonimo';
  const API_PREG = 'http://localhost:8080/api/preguntas';
  const API_RESP = 'http://localhost:8081/api/respuestas';

  const [ensayos, setEnsayos] = useState([]);
  const [ensayoSeleccionado, setEnsayoSeleccionado] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [resumen, setResumen] = useState(null);

  const [temas, setTemas] = useState(['Todos']);
  const [temaPractica, setTemaPractica] = useState('Todos');
  const [cargandoPractica, setCargandoPractica] = useState(false);
  const [errorPractica, setErrorPractica] = useState('');

  const [resueltos, setResueltos] = useState([]);
  const [statsAlumno, setStatsAlumno] = useState({ promedioPAES: '—', totalEnsayos: 0, ultimoPAES: '—' });

  useEffect(() => {
    const guardados = localStorage.getItem('ensayos');
    if (guardados) setEnsayos(JSON.parse(guardados));
  }, []);

  useEffect(() => {
    fetch(API_PREG)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const unicos = Array.from(new Set((data || []).map((p) => p.tema).filter(Boolean)));
        setTemas(['Todos', ...unicos]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function cargarResueltos() {
      try {
        const r = await fetch(`${API_RESP}?username=${encodeURIComponent(username)}`);
        if (!r.ok) return;
        const lista = (await r.json()) || [];
        const enriquecidos = await Promise.all(
          lista.map(async (row) => {
            const full = await fetchRespuestasDelEnsayo(username, row.ensayoId);
            if (!full || !full.respuestas) return { ensayoId: row.ensayoId, fechaIso: row.fechaIso, puntajePAES: null };
            const ensayo = buscarEnsayoLocal(row.ensayoId);
            const score = ensayo ? calcularPAESDeEnsayo(ensayo, full.respuestas) : null;
            return { ensayoId: row.ensayoId, fechaIso: row.fechaIso, puntajePAES: score };
          })
        );
        setResueltos(enriquecidos);
        recalcularStats(enriquecidos);
      } catch {}
    }
    cargarResueltos();
  }, [username, ensayos]);

  const ensayosPorId = useMemo(() => {
    const m = new Map();
    ensayos.forEach((e) => m.set(String(e.id), e));
    return m;
  }, [ensayos]);

  function buscarEnsayoLocal(id) {
    return ensayosPorId.get(String(id)) || null;
  }

  async function fetchRespuestasDelEnsayo(u, ensayoId) {
    const url = `${API_RESP}?username=${encodeURIComponent(u)}&ensayoId=${encodeURIComponent(ensayoId)}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  }

  async function guardarRespuestasEnAPI({ username, ensayoId, respuestas }) {
    const payload = { username, ensayoId, fechaIso: new Date().toISOString(), respuestas };
    const r = await fetch(API_RESP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) {
      const msg = await r.text().catch(() => '');
      throw new Error(msg || 'Error al guardar respuestas');
    }
    return true;
  }

  function calcularPAES(correctas, total) {
    if (!total || total <= 0) return 100;
    const frac = Math.max(0, Math.min(1, correctas / total));
    return Math.round(100 + 900 * frac);
  }

  function calcularPAESDeEnsayo(ensayo, respuestasAlumno) {
    let correctas = 0;
    (ensayo.preguntas || []).forEach((preg, i) => {
      const rA = respuestasAlumno[i] || '';
      const rC = preg.respuestaCorrecta || '';
      const ok = preg.tipo === 'desarrollo'
        ? String(rA).trim().toLowerCase() === String(rC).trim().toLowerCase()
        : rA === rC;
      if (ok) correctas++;
    });
    return calcularPAES(correctas, ensayo.preguntas?.length || 0);
  }

  function generarResumen(ensayo, respuestasAlumno) {
    let correctas = 0;
    const detalles = (ensayo.preguntas || []).map((preg, i) => {
      const rAlumno = respuestasAlumno[i] || '';
      const rCorrecta = preg.respuestaCorrecta || '';
      const esCorrecta = preg.tipo === 'desarrollo'
        ? String(rAlumno).trim().toLowerCase() === String(rCorrecta).trim().toLowerCase()
        : rAlumno === rCorrecta;
      if (esCorrecta) correctas++;
      return { enunciado: preg.enunciado, tipo: preg.tipo, respuestaAlumno: rAlumno, respuestaCorrecta: rCorrecta, esCorrecta };
    });
    const puntaje = `${correctas} / ${ensayo.preguntas.length}`;
    const paes = calcularPAES(correctas, ensayo.preguntas.length);
    return { detalles, puntaje, paes };
  }

  function ensayoYaRespondido(id) {
    return resueltos.some((r) => String(r.ensayoId) === String(id));
  }

  async function seleccionarEnsayo(ensayo) {
    try {
      const registro = await fetchRespuestasDelEnsayo(username, ensayo.id);
      if (registro && registro.respuestas) {
        const resumenComparativo = generarResumen(ensayo, registro.respuestas);
        setResumen({ ensayo, respuestasAlumno: registro.respuestas, resumenComparativo });
      } else {
        const inicial = {};
        (ensayo.preguntas || []).forEach((_, i) => { inicial[i] = ''; });
        setEnsayoSeleccionado(ensayo);
        setRespuestas(inicial);
        setMensaje('');
      }
    } catch {
      const inicial = {};
      (ensayo.preguntas || []).forEach((_, i) => { inicial[i] = ''; });
      setEnsayoSeleccionado(ensayo);
      setRespuestas(inicial);
      setMensaje('No se pudo consultar si ya respondiste este ensayo.');
    }
  }

  async function generarEvaluacionLibre() {
    setErrorPractica('');
    setCargandoPractica(true);
    try {
      const res = await fetch(API_PREG);
      if (!res.ok) throw new Error('No se pudieron obtener las preguntas');
      const data = await res.json();
      const libres = (data || []).filter((p) => {
        const esLibre = Boolean(p.es_libre);
        const porTema = temaPractica === 'Todos' ? true : p.tema === temaPractica;
        return esLibre && porTema;
      });
      if (libres.length === 0) {
        setErrorPractica('No hay preguntas libres disponibles para ese tema.');
        return;
      }
      const preguntas = libres.map((p) => ({
        enunciado: p.enunciado,
        alternativas: [p.alternativa_a, p.alternativa_b, p.alternativa_c, p.alternativa_d],
        respuestaCorrecta: p.respuesta_correcta,
        tipo: p.tipo || 'cuestionario',
        tema: p.tema || 'General'
      }));
      const ensayo = {
        id: `practica-${Date.now()}`,
        titulo: `Evaluación libre${temaPractica && temaPractica !== 'Todos' ? `: ${temaPractica}` : ''}`,
        descripcion: 'Evaluación generada automáticamente con preguntas libres.',
        preguntas
      };
      seleccionarEnsayo(ensayo);
    } catch (e) {
      setErrorPractica(e.message || 'Error generando evaluación libre');
    } finally {
      setCargandoPractica(false);
    }
  }

  function actualizarRespuesta(index, valor) {
    setRespuestas((prev) => ({ ...prev, [index]: valor }));
  }

  async function enviarRespuestas() {
    const todasRespondidas = Object.values(respuestas).every((r) => r && String(r).trim() !== '');
    if (!todasRespondidas) {
      setMensaje('Por favor, responde todas las preguntas antes de enviar.');
      return;
    }
    try {
      await guardarRespuestasEnAPI({ username, ensayoId: ensayoSeleccionado.id, respuestas });
      const resumenComparativo = generarResumen(ensayoSeleccionado, respuestas);
      setResumen({ ensayo: ensayoSeleccionado, respuestasAlumno: respuestas, resumenComparativo });
      const nuevo = { ensayoId: ensayoSeleccionado.id, fechaIso: new Date().toISOString(), puntajePAES: resumenComparativo.paes };
      setResueltos((prev) => [nuevo, ...prev]);
      recalcularStats([nuevo, ...resueltos]);
      setMensaje('');
      setEnsayoSeleccionado(null);
      setRespuestas({});
    } catch {
      setMensaje('No se pudo guardar en el servidor. Intenta nuevamente.');
    }
  }

  function recalcularStats(lista) {
    const paes = lista.map((x) => x.puntajePAES).filter((v) => typeof v === 'number');
    const totalEnsayos = lista.length;
    const promedioPAES = paes.length ? Math.round(paes.reduce((a, b) => a + b, 0) / paes.length) : '—';
    const ultimoPAES = lista.length && typeof lista[0].puntajePAES === 'number' ? lista[0].puntajePAES : '—';
    setStatsAlumno({ promedioPAES, totalEnsayos, ultimoPAES });
  }

  function volverAlInicio() {
    setResumen(null);
    setMensaje('');
  }

  const ensayosDisponibles = useMemo(
    () => ensayos.filter((e) => !ensayoYaRespondido(e.id)),
    [ensayos, resueltos]
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-alumno">
        <button className="btn-logout" onClick={onLogout}>Volver al login</button>

        {resumen ? (
          <>
            <h1>Resultados de: {resumen.ensayo.titulo}</h1>
            <p className="descripcion">{resumen.ensayo.descripcion}</p>
            <p className="puntaje-final">Puntaje obtenido: <strong>{resumen.resumenComparativo.puntaje}</strong> &nbsp;|&nbsp; PAES estimado: <strong>{resumen.resumenComparativo.paes}</strong></p>
            <ul className="resumen-respuestas">
              {resumen.resumenComparativo.detalles.map((d, i) => (
                <li key={i} className={d.esCorrecta ? 'respuesta-correcta' : 'respuesta-incorrecta'}>
                  <strong>Pregunta {i + 1}:</strong> {d.enunciado}
                  <br />
                  <em>Tu respuesta:</em> {String(d.respuestaAlumno)}
                  <br />
                  <em>Respuesta correcta:</em> {String(d.respuestaCorrecta)}
                  <br />
                  <strong>{d.esCorrecta ? '✔ Correcta' : '✘ Incorrecta'}</strong>
                </li>
              ))}
            </ul>
            <button onClick={volverAlInicio} className="btn-volver">Volver a las evaluaciones</button>
          </>
        ) : !ensayoSeleccionado ? (
          <>
            <h1>Información general</h1>

            <div className="panel-resumen">
              <div className="panel-card">
                <div className="panel-kpi-titulo">Promedio PAES estimado</div>
                <div className="panel-kpi-valor">{statsAlumno.promedioPAES}</div>
              </div>
              <div className="panel-card">
                <div className="panel-kpi-titulo">Evaluaciones completadas</div>
                <div className="panel-kpi-valor">{statsAlumno.totalEnsayos}</div>
              </div>
              <div className="panel-card">
                <div className="panel-kpi-titulo">Último puntaje PAES</div>
                <div className="panel-kpi-valor">{statsAlumno.ultimoPAES}</div>
              </div>
            </div>

            <div className="card-practica-libre">
              <h2 style={{ marginTop: 0 }}>Evaluación libre</h2>
              <div className="practica-libre-row">
                <div className="tema-wrapper">
                  <label>
                    Tema:
                    <select className="practica-libre-select" value={temaPractica} onChange={(e) => setTemaPractica(e.target.value)}>
                      {temas.map((t, idx) => (<option key={idx} value={t}>{t}</option>))}
                    </select>
                  </label>
                </div>
                <button onClick={generarEvaluacionLibre} className="btn-practica-libre" disabled={cargandoPractica}>
                  {cargandoPractica ? 'Generando...' : 'Generar evaluación libre'}
                </button>
              </div>
              {errorPractica && (<p style={{ color: 'crimson', marginTop: 8 }}>{errorPractica}</p>)}
            </div>

            <h2 className="subtitulo-evaluaciones">Evaluaciones</h2>
            {ensayosDisponibles.length === 0 ? (
              <p className="mensaje-vacio">No hay evaluaciones disponibles. ¡Revisa tu historial más abajo!</p>
            ) : (
              <ul className="lista-ensayos">
                {ensayosDisponibles.map((e) => (
                  <li key={e.id} className="ensayo-item">
                    <div>
                      <h3>{e.titulo}</h3>
                      <p>{e.descripcion}</p>
                    </div>
                    <button className="btn-resolver" onClick={() => seleccionarEnsayo(e)}>
                      Resolver evaluación
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <details className="historial-collapse">
              <summary className="historial-summary">Historial de evaluaciones</summary>
              <div className="historial-content">
                {resueltos?.length ? (
                  <ul className="historial-lista">
                    {resueltos.map((r, idx) => {
                      const ensayo = buscarEnsayoLocal(r.ensayoId);
                      const titulo = ensayo?.titulo || `Ensayo ${r.ensayoId}`;
                      const fecha = r.fechaIso ? new Date(r.fechaIso).toLocaleString() : '—';
                      return (
                        <li key={idx} className="historial-item">
                          <div>
                            <h4 className="historial-titulo">{titulo}</h4>
                            <div className="historial-detalles">
                              <span><strong>Fecha:</strong> {fecha}</span>
                              <span><strong>PAES:</strong> {r.puntajePAES != null ? r.puntajePAES : '—'}</span>
                            </div>
                          </div>
                          {ensayo && (
                            <button className="historial-ver" onClick={() => seleccionarEnsayo(ensayo)}>Ver</button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mensaje-vacio" style={{ marginTop: 6, marginBottom: 6 }}>Aún no hay evaluaciones en tu historial.</p>
                )}
              </div>
            </details>
          </>
        ) : (
          <>
            <h1>{ensayoSeleccionado.titulo}</h1>
            <p className="descripcion">{ensayoSeleccionado.descripcion}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviarRespuestas();
              }}
              className="form-ensayo"
            >
              {ensayoSeleccionado.preguntas.map((preg, i) => (
                <div key={i} className="pregunta-alumno">
                  <p className="enunciado">
                    <strong>Pregunta {i + 1}:</strong> {preg.enunciado}
                  </p>
                  {preg.tipo === 'desarrollo' ? (
                    <textarea
                      className="textarea-respuesta"
                      value={respuestas[i] || ''}
                      onChange={(e) => actualizarRespuesta(i, e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      required
                    />
                  ) : (
                    <div className="opciones-multiple">
                      {preg.alternativas.map((alt, j) => (
                        <label key={j} className="opcion-label">
                          <input
                            type="radio"
                            name={`pregunta-${i}`}
                            value={alt}
                            checked={respuestas[i] === alt}
                            onChange={() => actualizarRespuesta(i, alt)}
                            required
                          />
                          {alt}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {mensaje && <p className="mensaje-error">{mensaje}</p>}
              <div className="botones-ensayo">
                <button type="submit" className="btn-enviar">Enviar respuestas</button>
                <button type="button" className="btn-cancelar" onClick={volverAlInicio}>Cancelar</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
