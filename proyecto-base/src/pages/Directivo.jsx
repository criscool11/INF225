import React, { useState, useEffect } from 'react';
import '../styles/Directivo.css'; 

export default function Directivo({ onLogout }) {
  const [alumnosData, setAlumnosData] = useState([]);
  const [ensayos, setEnsayos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  useEffect(() => {
    const ensayosGuardados = localStorage.getItem('ensayos');
    if (ensayosGuardados) {
      setEnsayos(JSON.parse(ensayosGuardados));
    }

    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith('respuestasAlumno_')
    );

    const data = keys.map((key) => {
      const username = key.replace('respuestasAlumno_', '');
      const respuestas = JSON.parse(localStorage.getItem(key));
      return { username, respuestas };
    });

    setAlumnosData(data);
  }, []);

  const generarPuntaje = (ensayo, respuestasAlumno) => {
    let correctas = 0;
    ensayo.preguntas.forEach((preg, i) => {
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
    });
    return `${correctas} / ${ensayo.preguntas.length}`;
  };

  return (
    <div className="directivo-container">
      <h1>Progreso de alumnos</h1>

      <button className="btn-logout" onClick={onLogout}>
        Volver al login
      </button>

      {!alumnosData.length && <p className="no-data">No hay datos de alumnos.</p>}

      <ul className="alumnos-list">
        {alumnosData.map(({ username, respuestas }) => (
          <li key={username} className="alumno-item">
            <strong
              className="alumno-nombre"
              onClick={() =>
                setAlumnoSeleccionado(username === alumnoSeleccionado ? null : username)
              }
            >
              {username}
            </strong>

            {alumnoSeleccionado === username && (
              <div>
                {respuestas.length === 0 ? (
                  <p className="no-data">Este alumno no ha respondido evaluaciones.</p>
                ) : (
                  <ul className="respuestas-list">
                    {respuestas.map((resp, i) => {
                      const ensayo = ensayos.find((e) => e.id === resp.ensayoId);
                      if (!ensayo) return null;
                      const puntaje = generarPuntaje(ensayo, resp.respuestas);
                      return (
                        <li key={i} className="respuesta-item">
                          <strong>{ensayo.titulo}</strong> - Fecha: {new Date(resp.fecha).toLocaleString()} - Puntaje: {puntaje}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
