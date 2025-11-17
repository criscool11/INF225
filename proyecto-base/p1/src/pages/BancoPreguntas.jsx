import React, { useEffect, useState } from 'react';
import '../styles/BancoPreguntas.css';

export default function BancoPreguntas({ onAgregarPregunta, onVolver }) {
  const [preguntas, setPreguntas] = useState([]);
  const [temaSeleccionado, setTemaSeleccionado] = useState('Todos');
  const [soloLibres, setSoloLibres] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/preguntas')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Error al obtener las preguntas');
        }
        return res.json();
      })
      .then((data) => {
        const formateadas = data.map((p) => ({
          id: p.id,
          enunciado: p.enunciado,
          alternativas: [
            p.alternativa_a,
            p.alternativa_b,
            p.alternativa_c,
            p.alternativa_d,
          ],
          correcta: p.respuesta_correcta,
          tema: p.tema,
          libre: Boolean(p.es_libre) || false,
        }));
        setPreguntas(formateadas);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  const temasUnicos = ['Todos', ...new Set(preguntas.map((p) => p.tema))];

  const preguntasFiltradas = preguntas.filter((p) => {
    const porTema = temaSeleccionado === 'Todos' ? true : p.tema === temaSeleccionado;
    const porLibre = soloLibres ? p.libre === true : true;
    return porTema && porLibre;
  });

  const toggleLibre = async (preguntaId, valorLibre) => {
    setPreguntas((prev) => prev.map((q) => (q.id === preguntaId ? { ...q, libre: valorLibre } : q)));
    try {
      const res = await fetch(`http://localhost:8080/api/preguntas/${preguntaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ es_libre: valorLibre }),
      });
      if (!res.ok) {
        throw new Error('No se pudo actualizar el estado libre');
      }
    } catch (e) {
      setPreguntas((prev) => prev.map((q) => (q.id === preguntaId ? { ...q, libre: !valorLibre } : q)));
      setError(e.message);
    }
  };

  if (cargando) return <p>Cargando preguntas...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Banco de Preguntas</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div>
          <label htmlFor="filtro-tema">Filtrar por tema: </label>
          <select
            id="filtro-tema"
            value={temaSeleccionado}
            onChange={(e) => setTemaSeleccionado(e.target.value)}
            style={{ margin: '0 10px 0 10px', padding: '5px' }}
          >
            {temasUnicos.map((tema, i) => (
              <option key={i} value={tema}>
                {tema}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={soloLibres}
            onChange={(e) => setSoloLibres(e.target.checked)}
          />
          Solo libres
        </label>
      </div>

      {preguntasFiltradas.map((p, i) => (
        <div key={p.id ?? i} style={{ border: '1px solid #ccc', padding: 10, margin: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{p.enunciado}</strong>
            <span style={{ fontSize: '0.85em', color: '#555' }}>Tema: {p.tema || '—'}</span>
          </div>
          <ul style={{ paddingLeft: 20 }}>
            {p.alternativas.map((alt, j) => (
              <li key={j} style={{ marginBottom: 6 }}>
                {alt}
                {alt === p.correcta && (
                  <span
                    style={{
                      marginLeft: 8,
                      backgroundColor: '#4caf50',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.8em',
                      fontWeight: 'bold',
                      userSelect: 'none',
                    }}
                  >
                    Correcta
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="acciones-pregunta">
            <button onClick={() => onAgregarPregunta && onAgregarPregunta(p)} className="btn-agregar-pregunta">
              Agregar esta pregunta
            </button>
            <button
              onClick={() => toggleLibre(p.id, !p.libre)}
              className={`btn-libre ${p.libre ? 'on' : ''}`}
              title={p.libre ? 'Desmarcar como libre' : 'Marcar como libre'}
            >
              {p.libre ? '★ Libre' : '☆ Marcar como libre'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
