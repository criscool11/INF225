import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/login.jsx'
import DashboardProfesor from './pages/DashboardProfesor.jsx'
import Alumno from './pages/alumno.jsx'
import BancoPreguntas from './pages/BancoPreguntas.jsx'
import Directivo from './pages/Directivo.jsx'
import ReportesProfesor from './pages/ReportesProfesor.jsx'
import './styles/ProfesorMenu.css'
import iconEvaluacion from './assets/evaluacion.png' 
import iconGrafico from './assets/grafico.png'

function App() {
  const [loginData, setLoginData] = useState(null)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginWrapper setLoginData={setLoginData} />} />
        <Route path="/profesor" element={<ProfesorMenu loginData={loginData} />} />
        <Route path="/profesor/crear" element={<DashboardProfesorWrapper loginData={loginData} />} />
        <Route path="/profesor/reportes" element={<ReportesProfesor />} />
        <Route path="/alumno" element={<AlumnoWrapper loginData={loginData} />} />
        <Route path="/Banco" element={<BancoPreguntasWrapper />} />
        <Route path="/directivo" element={<DirectivoWrapper loginData={loginData} />} />
      </Routes>
    </Router>
  )
}

function LoginWrapper({ setLoginData }) {
  const navigate = useNavigate()
  const handleLogin = ({ role, username }) => {
    setLoginData({ role, username })
    if (role === 'alumno') navigate('/alumno')
    else if (role === 'profesor') navigate('/profesor')
    else if (role === 'directivo') navigate('/directivo')
  }
  return <Login onLogin={handleLogin} />
}

function ProfesorMenu({ loginData }) {
  const navigate = useNavigate()
  return (
    <div className="profesor-menu">
      <button className="btn-logout" onClick={() => navigate('/')}>Volver al login</button>

      <div className="container"> {}

        <h1>Menú Profesor</h1>
        <p>Bienvenid@{loginData?.username ? `, ${loginData.username}` : ''}. Elija una opción:</p>

        <div className="btn-grid">
          <button className="menu-btn" onClick={() => navigate('/profesor/crear')}>
            <img src={iconEvaluacion} alt="Evaluación" />
            Crear evaluación
          </button>

          <button className="menu-btn" onClick={() => navigate('/profesor/reportes')}>
            <img src={iconGrafico} alt="Reportes" />
            Reportes
          </button>
        </div>

      </div>
    </div>
  )
}


function AlumnoWrapper({ loginData }) {
  const navigate = useNavigate()
  const handleLogout = () => navigate('/')
  return <Alumno onLogout={handleLogout} loginData={loginData} />
}

function DashboardProfesorWrapper({ loginData }) {
  const navigate = useNavigate()
  const handleLogout = () => navigate('/')
  return <DashboardProfesor onLogout={handleLogout} loginData={loginData} />
}

function BancoPreguntasWrapper() {
  const navigate = useNavigate()
  return <BancoPreguntas navigate={navigate} />
}

function DirectivoWrapper({ loginData }) {
  const navigate = useNavigate()
  const handleLogout = () => navigate('/')
  return <Directivo onLogout={handleLogout} loginData={loginData} />
}

export default App
