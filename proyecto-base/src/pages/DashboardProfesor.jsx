import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardProfesor.css';
import BancoPreguntas from './BancoPreguntas';
import XIcon from '../assets/X.png';

export default function DashboardProfesor({ onLogout }) {
  const TEMAS = ['Matematicas', 'Fisica', 'Quimica', 'Lenguaje', 'Historia'];
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [tieneFecha, setTieneFecha] = useState(false);
  const [tieneTiempo, setTieneTiempo] = useState(false);
  const [tiempo, setTiempo] = useState(30);
  const [preguntas, setPreguntas] = useState([]);
  const [ensayos, setEnsayos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [cargadoDesdeLocalStorage, setCargadoDesdeLocalStorage] = useState(false);
  const [mostrarBanco, setMostrarBanco] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const guardados = localStorage.getItem('ensayos');
    if (guardados) setEnsayos(JSON.parse(guardados));
    setCargadoDesdeLocalStorage(true);
  }, []);

  useEffect(() => {
    if (cargadoDesdeLocalStorage) localStorage.setItem('ensayos', JSON.stringify(ensayos));
  }, [ensayos, cargadoDesdeLocalStorage]);

  const resetFormulario = () => {
    setTitulo('');
    setDescripcion('');
    setFecha('');
    setTieneFecha(false);
    setTieneTiempo(false);
    setTiempo(30);
    setPreguntas([]);
    setEditandoId(null);
  };

  const agregarDesdeBanco = (pregunta) => {
    const nuevaPregunta = {
      enunciado: pregunta.enunciado,
      tipo: 'cuestionario',
      alternativas: pregunta.alternativas,
      respuestaCorrecta: pregunta.correcta,
      tema: pregunta.tema || TEMAS[0],
    };
    setPreguntas((prev) => [...prev, nuevaPregunta]);
    setMostrarBanco(false);
  };

  const agregarPregunta = () => {
    setPreguntas([...preguntas, { enunciado: '', tipo: 'desarrollo', alternativas: [], respuestaCorrecta: '', tema: TEMAS[0] }]);
  };

  const actualizarPregunta = (index, campo, valor) => {
    const nuevas = [...preguntas];
    nuevas[index][campo] = valor;

    if (campo === 'tipo') {
      nuevas[index].alternativas = valor === 'cuestionario' ? [''] : [];
      nuevas[index].respuestaCorrecta = '';
    }

    setPreguntas(nuevas);
  };

  const agregarAlternativa = (i) => {
    const nuevas = [...preguntas];
    nuevas[i].alternativas.push('');
    setPreguntas(nuevas);
  };

  const actualizarAlternativa = (i, j, valor) => {
    const nuevas = [...preguntas];
    nuevas[i].alternativas[j] = valor;
    setPreguntas(nuevas);
  };

  const seleccionarRespuestaCorrecta = (i, valor) => {
    const nuevas = [...preguntas];
    nuevas[i].respuestaCorrecta = valor;
    setPreguntas(nuevas);
  };

  const eliminarPregunta = (index) => {
    const nuevas = [...preguntas];
    nuevas.splice(index, 1);
    setPreguntas(nuevas);
  };

  const editarEvaluacion = (id) => {
    const e = ensayos.find((x) => x.id === id);
    if (!e) return;
    setTitulo(e.titulo);
    setDescripcion(e.descripcion);
    setTieneFecha(e.tieneFecha);
    setFecha(e.fecha ?? '');
    setTieneTiempo(e.tieneTiempo ?? false);
    setTiempo(e.tiempo ?? 30);
    setPreguntas(e.preguntas ?? []);
    setEditandoId(e.id);
  };

  const eliminarEvaluacion = (id) => {
    const nuevas = ensayos.filter((x) => x.id !== id);
    setEnsayos(nuevas);
    if (editandoId === id) resetFormulario();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const evaluacion = {
      id: editandoId ?? Date.now(),
      titulo,
      descripcion,
      tieneFecha,
      fecha: tieneFecha ? fecha : null,
      tieneTiempo,
      tiempo: tieneTiempo ? tiempo : null,
      preguntas,
    };

    if (editandoId) {
      const actualizadas = ensayos.map((e) => (e.id === editandoId ? evaluacion : e));
      setEnsayos(actualizadas);
    } else {
      setEnsayos([...ensayos, evaluacion]);
    }

    resetFormulario();
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="top-buttons">
          <button onClick={onLogout} className="btn-logout">Volver al login</button>
          {!mostrarBanco && <button type="button" onClick={() => navigate('/profesor')} className="btn-volver-menu">Volver al menú</button>}
          {!mostrarBanco ? (
            <button type="button" onClick={() => setMostrarBanco(true)} className="btn-banco">Banco de preguntas</button>
          ) : (
            <button type="button" onClick={() => setMostrarBanco(false)} className="btn-volver-banco">Volver</button>
          )}
        </div>

        {!mostrarBanco && <h1>{editandoId ? 'Editar Evaluación' : 'Crear Evaluación'}</h1>}

        {mostrarBanco ? (
          <BancoPreguntas onAgregarPregunta={agregarDesdeBanco} onVolver={() => setMostrarBanco(false)} />
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la evaluación" required />
              <label>Descripción:</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción de la evaluación" required />

              <label className="checkbox-label">
                <input type="checkbox" checked={tieneFecha} onChange={() => setTieneFecha(!tieneFecha)} />
                ¿Tiene fecha de entrega?
              </label>
              {tieneFecha && (
                <>
                  <label>Fecha de entrega:</label>
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                </>
              )}

              <label className="checkbox-label">
                <input type="checkbox" checked={tieneTiempo} onChange={() => setTieneTiempo(!tieneTiempo)} />
                ¿Tiene tiempo límite?
              </label>
              {tieneTiempo && (
                <>
                  <label>Tiempo (minutos):</label>
                  <input type="number" min={1} value={tiempo} onChange={(e) => setTiempo(Number(e.target.value))} required />
                </>
              )}

              <h2>Preguntas</h2>
              {preguntas.map((preg, i) => (
                <div key={i} className="pregunta-container">
                  <h3 className="numero-pregunta">Pregunta {i + 1}</h3>

                  <label>Enunciado:</label>
                  <textarea
                    value={preg.enunciado}
                    onChange={(e) => actualizarPregunta(i, 'enunciado', e.target.value)}
                    required
                  />

                  <label>Tipo:</label>
                  <select value={preg.tipo} onChange={(e) => actualizarPregunta(i, 'tipo', e.target.value)}>
                    <option value="desarrollo">Desarrollo</option>
                    <option value="cuestionario">Selección múltiple</option>
                  </select>

                  <label>Asignatura:</label>
                  <select value={preg.tema} onChange={(e) => actualizarPregunta(i, 'tema', e.target.value)} required>
                    {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>

                  {preg.tipo === 'cuestionario' && (
                    <div className="alternativas-section">
                      {preg.alternativas.map((alt, j) => (
                        <div key={j} className="alternativa-item">
                          <input
                            type="radio"
                            name={`respuesta-${i}`}
                            checked={preg.respuestaCorrecta === alt}
                            onChange={() => seleccionarRespuestaCorrecta(i, alt)}
                          />
                          <input
                            type="text"
                            value={alt}
                            onChange={(e) => actualizarAlternativa(i, j, e.target.value)}
                            placeholder={`Alternativa ${j + 1}`}
                            required
                            className="alternativa-input"
                          />
                          <button
                            type="button"
                            className="btn-eliminar-alternativa"
                            onClick={() => {
                              const nuevas = [...preguntas];
                              nuevas[i].alternativas.splice(j, 1);
                              if (preg.respuestaCorrecta === alt) nuevas[i].respuestaCorrecta = '';
                              setPreguntas(nuevas);
                            }}
                            title="Eliminar alternativa"
                          >
                            <img src={XIcon} alt="Eliminar" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => agregarAlternativa(i)} className="btn-agregar-alternativa">
                        Agregar alternativa
                      </button>
                    </div>
                  )}


                  {preg.tipo === 'desarrollo' && (
                    <>
                      <label>Respuesta esperada:</label>
                      <input type="text" value={preg.respuestaCorrecta} onChange={(e) => seleccionarRespuestaCorrecta(i, e.target.value)} placeholder="Respuesta correcta esperada" required />
                    </>
                  )}

                  <button type="button" onClick={() => eliminarPregunta(i)} className="cancel-btn">Eliminar pregunta</button>
                </div>
              ))}

              <button type="button" onClick={agregarPregunta}>Agregar pregunta</button>
              <br /><br />
              <button type="submit">{editandoId ? 'Guardar cambios' : 'Subir evaluación'}</button>
              {editandoId && (
                <button onClick={resetFormulario} type="button" className="cancel-btn" style={{ marginLeft: '10px' }}>Cancelar</button>
              )}
            </form>

            <hr />
            <h2>Evaluaciones guardadas</h2>
            {ensayos.length === 0 ? (
              <p>No hay evaluaciones aún.</p>
            ) : (
              <ul className="lista-ensayos">
                {ensayos.map((e) => (
                  <li key={e.id}>
                    <strong>{e.titulo}</strong><br />
                    {e.descripcion}<br />
                    {e.tieneFecha && e.fecha && <>Entrega: {e.fecha}<br /></>}
                    {e.tieneTiempo && e.tiempo && <>Tiempo: {e.tiempo} minutos<br /></>}
                    <button onClick={() => editarEvaluacion(e.id)}>Editar</button>
                    <button onClick={() => eliminarEvaluacion(e.id)} className="cancel-btn">Eliminar</button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
