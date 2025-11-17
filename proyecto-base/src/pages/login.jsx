import React, { useState } from 'react';
import '../styles/login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const usuarios = [
    { username: 'profesor', password: '1234', role: 'profesor' },
    { username: 'alumno1', password: 'a1234', role: 'alumno' },
    { username: 'alumno2', password: 'b1234', role: 'alumno' },
    { username: 'directivo', password: 'admin123', role: 'directivo' },
  ];

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert('Por favor ingrese usuario y contraseña');
      return;
    }

    const user = usuarios.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      onLogin({ role: user.role, username: user.username });
    } else {
      alert('Credenciales incorrectas');
    }
  };

  return (
    <div className="login-container">
      <h1>Portal de Aprendizaje</h1>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleLogin}>
        <label>Usuario:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ingrese su usuario"
        />

        <label>Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingrese su contraseña"
        />

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
