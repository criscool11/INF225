import React, { useState, useEffect } from 'react';
import '../styles/DashboardAlumno.css';

export default function DashboardAlumno({ onLogout, loginData }) {
  const username = loginData?.username || 'anonimo';

  const [ensayos, setEnsayos] = useState([]);
  const [ensayoSeleccionado, setEnsayoSeleccionado] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [resumen, setResumen] = useState(null);

  const [temas, setTemas] = useState(['Todos']);
  const [temaPractica, setTemaPractica] = useState('Todos');
  const [cargandoPractica, setCargandoPractica] = useState(false);
  const [errorPractica, setErrorPractica] = useState('');

  useEffect(() => {
    const guardados = localStorage.getItem('ensayos');
    if (guardados) {
      setEnsayos(JSON.parse(guardados));
    }
  }, []);

  useEffect(() => {
    fetch('http://localhost:8080/api/preguntas')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const unicos = Array.from(new Set((data || []).map((p) => p.tema).filter(Boolean)));
        setTemas(['Todos', ...unicos]);
      })
      .catch(() => {});
  }, []);

  const obtenerRespuestasAlumno = () =>
    JSON.parse(localStorage.getItem(`respuestasAlumno_${username}`)) || [];

  const ensayoYaRespondido = (id) =>
    obtenerRespuestasAlumno().some((r) => r.ensayoId === id);

  const seleccionarEnsayo = (ensayo) => {
    const yaRespondido = obtenerRespuestasAlumno().find(
      (r) => r.ensayoId === ensayo.id
    );

    if (yaRespondido) {
      const resumenComparativo = generarResumen(ensayo, yaRespondido.respuestas);
      setResumen({
        ensayo,
        respuestasAlumno: yaRespondido.respuestas,
        resumenComparativo,
      });
    } else {
      const inicial = {};
      ensayo.preguntas.forEach((_, i) => {
        inicial[i] = '';
      });
      setEnsayoSeleccionado(ensayo);
      setRespuestas(inicial);
      setMensaje('');
    }
  };

  const generarEvaluacionLibre = async () => {
    setErrorPractica('');
    setCargandoPractica(true);
    try {
      const res = await fetch('http://localhost:8080/api/preguntas');
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
      }));

      const ensayo = {
        id: `practica-${Date.now()}`,
        titulo: `Evaluación libre${temaPractica && temaPractica !== 'Todos' ? `: ${temaPractica}` : ''}`,
        descripcion: 'Evaluación generada automáticamente con preguntas libres.',
        preguntas,
      };

      seleccionarEnsayo(ensayo);
    } catch (e) {
      setErrorPractica(e.message || 'Error generando evaluación libre');
    } finally {
      setCargandoPractica(false);
    }
  };

  const actualizarRespuesta = (index, valor) => {
    setRespuestas((prev) => ({ ...prev, [index]: valor }));
  };

  const enviarRespuestas = () => {
    const todasRespondidas = Object.values(respuestas).every(
      (r) => r && r.trim() !== ''
    );
    if (!todasRespondidas) {
      setMensaje('Por favor, responde todas las preguntas antes de enviar.');
      return;
    }

    const alumnoRespuestas = obtenerRespuestasAlumno();
    const nuevas = [
      ...alumnoRespuestas,
      {
        ensayoId: ensayoSeleccionado.id,
        respuestas,
        fecha: new Date().toISOString(),
      },
    ];
    localStorage.setItem(`respuestasAlumno_${username}`, JSON.stringify(nuevas));

    const resumenComparativo = generarResumen(ensayoSeleccionado, respuestas);
    setResumen({
      ensayo: ensayoSeleccionado,
      respuestasAlumno: respuestas,
      resumenComparativo,
    });

    setMensaje('');
    setEnsayoSeleccionado(null);
    setRespuestas({});
  };

  const generarResumen = (ensayo, respuestasAlumno) => {
    let correctas = 0;
    const detalles = ensayo.preguntas.map((preg, i) => {
      const rAlumno = respuestasAlumno[i] || '';
      const rCorrecta = preg.respuestaCorrecta || '';
      let esCorrecta = false;

      if (preg.tipo === 'desarrollo') {
        esCorrecta =
          rAlumno.trim().toLowerCase() === rCorrecta.trim().toLowerCase();
      } else {
        esCorrecta = rAlumno === rCorrecta;
      }

      if (esCorrecta) correctas++;

      return {
        enunciado: preg.enunciado,
        tipo: preg.tipo,
        respuestaAlumno: rAlumno,
        respuestaCorrecta: rCorrecta,
        esCorrecta,
      };
    });

    const puntaje = `${correctas} / ${ensayo.preguntas.length}`;
    return { detalles, puntaje };
  };

  const volverAlInicio = () => {
    setResumen(null);
    setMensaje('');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-alumno">
        <button className="btn-logout" onClick={onLogout}>
          Volver al login
        </button>

        {resumen ? (
          <>
            <h1>Resultados de: {resumen.ensayo.titulo}</h1>
            <p className="descripcion">{resumen.ensayo.descripcion}</p>
            <p className="puntaje-final">
              Puntaje obtenido: <strong>{resumen.resumenComparativo.puntaje}</strong>
            </p>

            <ul className="resumen-respuestas">
              {resumen.resumenComparativo.detalles.map((d, i) => (
                <li
                  key={i}
                  className={
                    d.esCorrecta ? 'respuesta-correcta' : 'respuesta-incorrecta'
                  }
                >
                  <strong>Pregunta {i + 1}:</strong> {d.enunciado}
                  <br />
                  <em>Tu respuesta:</em> {d.respuestaAlumno}
                  <br />
                  <em>Respuesta correcta:</em> {d.respuestaCorrecta}
                  <br />
                  <strong>{d.esCorrecta ? '✔ Correcta' : '✘ Incorrecta'}</strong>
                </li>
              ))}
            </ul>

            <button onClick={volverAlInicio} className="btn-volver">
              Volver a las evaluaciones
            </button>
          </>
        ) : !ensayoSeleccionado ? (
          <>
            <h1>Evaluaciones disponibles</h1>

            <div className="card-practica-libre">
              <h2 style={{ marginTop: 0 }}>Evaluación libre</h2>
              <div className="practica-libre-row">
                <div className="tema-wrapper">
                  <label>
                    Tema:
                    <select className="practica-libre-select" value={temaPractica} onChange={(e) => setTemaPractica(e.target.value)}>
                      {temas.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <button onClick={generarEvaluacionLibre} className="btn-practica-libre" disabled={cargandoPractica}>
                  {cargandoPractica ? 'Generando...' : 'Generar evaluación libre'}
                </button>
              </div>
              {errorPractica && <p style={{ color: 'crimson', marginTop: 8 }}>{errorPractica}</p>}
            </div>

            <h2 className="subtitulo-evaluaciones">Evaluaciones</h2>

            {ensayos.length === 0 ? (
              <p className="mensaje-vacio">No hay evaluaciones disponibles.</p>
            ) : (
              <ul className="lista-ensayos">
                {ensayos.map((e) => {
                  const yaRespondido = ensayoYaRespondido(e.id);
                  return (
                    <li key={e.id} className="ensayo-item">
                      <div>
                        <h3>{e.titulo}</h3>
                        <p>{e.descripcion}</p>
                      </div>
                      <button
                        className="btn-resolver"
                        onClick={() => seleccionarEnsayo(e)}
                      >
                        {yaRespondido ? 'Ver resultados' : 'Resolver evaluación'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {mensaje && <p className="mensaje-envio">{mensaje}</p>}
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
                <button type="submit" className="btn-enviar">
                  Enviar respuestas
                </button>
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => {
                    setEnsayoSeleccionado(null);
                    setMensaje('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
