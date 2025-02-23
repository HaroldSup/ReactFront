import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './componentes/login';
import Dashboard from './componentes/dashboard';
import ListaAcefalias from './componentes/ListaAcefalia';
import Registromateria from './componentes/AcefaliaForm';
import RegistroPostulacion from './componentes/RegistroPostulacion';
import ConcursoDeMeritos from './componentes/ConcursoDeMeritos'; // Importamos el módulo de la lista
import RegistroDeMeritos from './componentes/Registrodemeritos'; // Importamos el formulario de registro

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/lista-acefalias" element={<ListaAcefalias />} />
                <Route path="/registro-materia" element={<Registromateria />} />
                <Route path="/registro-postulacion" element={<RegistroPostulacion />} />
                <Route path="/concurso-de-meritos" element={<ConcursoDeMeritos />} /> {/* Lista de registros */}
                <Route path="/registrodemeritos" element={<RegistroDeMeritos />} /> {/* Formulario de registro */}
            </Routes>
        </Router>
    );
}

export default App;
