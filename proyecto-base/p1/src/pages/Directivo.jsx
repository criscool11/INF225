import React, { useEffect, useMemo, useState } from 'react';
import '../styles/Directivo.css';

export default function Directivo({ onLogout }) {
  const API_RESP = 'http://localhost:8081/api/respuestas/all';

  const [respuestasAll, setRespuestasAll] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const ensayos = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('ensayos') || '[]');
    } catch {
      return [];
    }
  }, []);

  const ensayosMap = useMemo(() => {
    const m = new Map();
    for (const e of ensayos) {
      if (e && e.id != null) m.set(String(e.id), e);
    }
    return m;
  }, [ensayos]);

  useEffect(() => {
    let cancel = false;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const r = await fetch(API_RESP);
        if (!r.ok) throw new Error('No se pudieron obtener respuestas');
        const data = await r.json();
        if (!cancel) setRespuestasAll(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancel) setError(e.message || 'Error cargando respuestas');
      } finally {
        if (!cancel) setCargando(false);
      }
    }
    cargar();
    return () => {
      cancel = true;
    };
  }, []);

  const porAlumno = useMemo(() => {
    const g = new Map();
    for (const r of respuestasAll) {
      const user = r.username || 'desconocido';
      if (!g.has(user)) g.set(user, []);
      g.get(user).push(r);
    }

    for (const [u, arr] of g.entries()) {
      arr.sort((a, b) => String(b.fechaIso).localeCompare(String(a.fechaIso)));
    }
    return g;
  }, [respuestasAll]);

  const alumnosLista = useMemo(
    () =>
      Array.from(porAlumno.keys()).sort((a, b) =>
        String(a).localeCompare(String(b), 'es', { sensitivity: 'base' })
      ),
    [porAlumno]
  );

  function puntajeDe(ensayo, respuestasAlumno) {
    const preguntas = ensayo?.preguntas || [];
    let correctas = 0;
    preguntas.forEach((preg, i) => {
      const rAlumno = respuestasAlumno?.[i] ?? '';
      const rCorrecta = preg.respuestaCorrecta ?? '';
      if ((preg.tipo || 'cuestionario') === 'desarrollo') {
        if (
          String(rAlumno).trim().toLowerCase() ===
          String(rCorrecta).trim().toLowerCase()
        )
          correctas++;
      } else {
        if (rAlumno === rCorrecta) correctas++;
      }
    });
    return `${correctas} / ${preguntas.length || 0}`;
  }

  return (
    <div className="directivo-container">
      <h1>Progreso de alumnos</h1>

      <button className="btn-logout" onClick={onLogout}>
        Volver al login
      </button>

      {cargando && <p>Cargando…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!cargando && alumnosLista.length === 0 && (
        <p className="no-data">No hay datos de alumnos.</p>
      )}

      <ul className="alumnos-list">
        {alumnosLista.map((username) => {
          const respuestas = porAlumno.get(username) || [];
          return (
            <li key={username} className="alumno-item">
              <strong
                className="alumno-nombre"
                onClick={() =>
                  setAlumnoSeleccionado(
                    username === alumnoSeleccionado ? null : username
                  )
                }
              >
                {username}
              </strong>

              {alumnoSeleccionado === username && (
                <div>
                  {respuestas.length === 0 ? (
                    <p className="no-data">
                      Este alumno no ha respondido evaluaciones.
                    </p>
                  ) : (
                    <ul className="respuestas-list">
                      {respuestas.map((r, i) => {
                        const e = ensayosMap.get(String(r.ensayoId));
                        if (!e) return null;

                        const puntaje = puntajeDe(e, r.respuestas);

                        return (
                          <li key={i} className="respuesta-item">
                            <strong>{e.titulo || r.ensayoId}</strong> — Fecha:{' '}
                            {new Date(r.fechaIso).toLocaleString()} — Puntaje:{' '}
                            {puntaje}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
