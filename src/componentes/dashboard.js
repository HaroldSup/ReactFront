// componentes/dashboard.js
import React, { useState, useEffect } from 'react';
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  ClipboardIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  LightBulbIcon,
  PencilSquareIcon, // Ícono para el módulo de Firma Digital
  CogIcon // Ícono para el módulo Workflow
} from '@heroicons/react/24/outline';
import axios from 'axios';
import logo from '../images/logo.png';
import background from '../images/EMI.jpg';
import missionImage from '../images/mision.png';
import visionImage from '../images/vision.jpg';
import ListaAcefalia from './ListaAcefalia';
import ListaUsuarios from './ListaUsuarios';
import UserForm from './UserForm';
import Postulaciones from './Postulaciones';
import AcefaliaForm from './AcefaliaForm';
import ConcursoDeMeritos from './ConcursoDeMeritos';
import RegistroDeMeritos from './Registrodemeritos';
import ExamendeCompetencias from './Examendecompetencias';
import Examendeconocimientos from './Examendeconocimientos';        // NUEVO: Lista Examen de Conocimientos
import Registrodeconocimientos from './Registrodeconocimientos';      // NUEVO: Registro Examen de Conocimientos
import FirmaDigital from './firmadigital'; // Componente ya creado
import Workflow from './workflow'; // Módulo de automatización secuencial

// Importamos el componente Postulacionesporcarrera
import Postulacionesporcarrera from './Postulacionesporcarrera';

function Dashboard() {
  // Recuperamos el usuario autenticado desde localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const permisos = user?.permisos || {};

  // Función que devuelve true si el usuario es admin o tiene el permiso indicado
  const hasPermission = (permKey) => {
    if (user?.administrador) return true;
    return permisos[permKey];
  };

  const [activeSection, setActiveSection] = useState('dashboard');
  const [previousSection, setPreviousSection] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAcefalia, setSelectedAcefalia] = useState(null);

  // Estado para almacenar los nodos (por label) que ya se han visitado
  const [visitedModules, setVisitedModules] = useState([]);

  /**
   * Mapeo de cada sección (activeSection) a un arreglo de labels de nodos del diagrama.
   * Se utiliza para marcar (sin duplicados) los nodos correspondientes.
   */
  const workflowMapping = {
    'dashboard': ['Inicio'],
    'ListaAcefalia': ['Unidad de Evaluación y Acreditación', 'Gestión de la documentación'],
    'AcefaliaForm': ['Unidad de Evaluación y Acreditación', 'Gestión de la documentación'],
    'ListaUsuarios': ['Asignar roles y permisos'],
    'UserForm': ['Asignar roles y permisos'],
    'postulaciones': ['Postulante', 'Subir Documentación'],
    'porCarrera': ['Postulante', 'Subir Documentación'],
    'ConcursoDeMeritos': ['Comité de Evaluación', 'Gestión de la documentación concurso de méritos', 'Registrar puntos de evaluación'],
    'Registrodemeritos': ['Comité de Evaluación', 'Gestión de la documentación concurso de méritos', 'Registrar puntos de evaluación'],
    'Examendeconocimientos': ['Comité de Evaluación', 'Gestión de la documentación examen de conocimientos', 'Registrar puntos de evaluación'],  // NUEVO
    'Registrodeconocimientos': ['Comité de Evaluación', 'Gestión de la documentación examen de conocimientos', 'Registrar puntos de evaluación'],  // NUEVO
    'ExamendeCompetencias': ['Comité de evaluación', 'Gestión de la documentación examen de competencias', 'Registrar puntos de evaluación'],
    'propuestaDocente': ['Director de la unidad académica', 'Subir documentación', 'Descargar documentación con Firma Digital', 'Fin']
  };

  // Cada vez que se cambia la sección, se agregan (sin duplicados) los nodos del mapping
  const toggleMenu = (section) => {
    setPreviousSection(activeSection);
    setActiveSection(section);
    if (workflowMapping[section]) {
      setVisitedModules((prev) => {
        // Solo se agregan aquellos nodos que aún no han sido registrados
        const nuevos = workflowMapping[section].filter(label => !prev.includes(label));
        return [...prev, ...nuevos];
      });
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Cuando se han visitado 3 o más nodos, se envía la secuencia al backend
  useEffect(() => {
    if (visitedModules.length >= 3) {
      axios.post('/api/workflow/registrar', { modules: visitedModules })
        .then(response => {
          console.log('Secuencia registrada', response.data);
        })
        .catch(error => {
          console.error('Error al registrar la secuencia', error);
        });
    }
  }, [visitedModules]);

  return (
    <div className="flex flex-row h-screen text-gray-800 font-sans">
      <aside
        className={`bg-gradient-to-b from-blue-900 to-blue-700 text-white ${
          isExpanded ? 'w-48 md:w-64' : 'w-20'
        } h-screen transition-all duration-300 flex flex-col shadow-xl`}
      >
        <div className="flex items-center p-4 w-full border-b border-blue-800">
          <img src={logo} alt="Logo EMI" className="w-10 h-auto" />
          {isExpanded && <span className="ml-2 font-bold text-lg">EMI</span>}
        </div>
        <button
          onClick={toggleExpand}
          className="flex items-center justify-center p-2 m-2 bg-transparent rounded-full text-white transition hover:bg-gray-200 hover:bg-opacity-25 focus:outline-none"
        >
          {isExpanded ? (
            <ChevronLeftIcon className="w-5 h-5 text-gray-300" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-300" />
          )}
        </button>
        <nav className="flex flex-col mt-4 space-y-1 w-full">
          <MenuItem
            icon={<HomeIcon className="w-6 h-6" />}
            label="dashboard"
            displayLabel="Dashboard"
            isExpanded={isExpanded}
            isActive={activeSection === 'dashboard'}
            onClick={() => toggleMenu('dashboard')}
          />

          {/* Grupo: Asignaturas en Acefalía */}
          {(hasPermission("Lista de Acefalías") || hasPermission("Registrar Acefalia")) && (
            <MenuGroup label="Asignaturas en Acefalía" isExpanded={isExpanded}>
              {hasPermission("Lista de Acefalías") && (
                <MenuItem
                  icon={<ClipboardIcon className="w-6 h-6" />}
                  label="ListaAcefalia"
                  displayLabel="Lista de Acefalías"
                  isExpanded={isExpanded}
                  isActive={activeSection === 'ListaAcefalia'}
                  onClick={() => toggleMenu('ListaAcefalia')}
                />
              )}
              {hasPermission("Registrar Acefalia") && (
                <MenuItem
                  icon={<FolderIcon className="w-6 h-6" />}
                  label="AcefaliaForm"
                  displayLabel="Registrar Acefalía"
                  isExpanded={isExpanded}
                  isActive={activeSection === 'AcefaliaForm'}
                  onClick={() => {
                    setPreviousSection('ListaAcefalia');
                    toggleMenu('AcefaliaForm');
                  }}
                />
              )}
            </MenuGroup>
          )}

          {/* Grupo: Gestión de Usuarios */}
          {hasPermission("Usuarios") && (
            <MenuGroup label="Gestión de Usuarios" isExpanded={isExpanded}>
              <MenuItem
                icon={<UserGroupIcon className="w-6 h-6" />}
                label="ListaUsuarios"
                displayLabel="Usuarios"
                isExpanded={isExpanded}
                isActive={activeSection === 'ListaUsuarios'}
                onClick={() => toggleMenu('ListaUsuarios')}
              />
            </MenuGroup>
          )}

          {/* Grupo: Postulaciones */}
          {(hasPermission("Postulaciones") || hasPermission("Postulaciones por Carrera")) && (
            <MenuGroup label="Postulaciones" isExpanded={isExpanded}>
              {hasPermission("Postulaciones") && (
                <MenuItem
                  icon={<DocumentTextIcon className="w-6 h-6" />}
                  label="postulaciones"
                  displayLabel="Postulaciones"
                  isExpanded={isExpanded}
                  isActive={activeSection === 'postulaciones'}
                  onClick={() => toggleMenu('postulaciones')}
                />
              )}
              {hasPermission("Postulaciones por Carrera") && (
                <MenuItem
                  icon={<AcademicCapIcon className="w-6 h-6" />}
                  label="porCarrera"
                  displayLabel="Por Carrera"
                  isExpanded={isExpanded}
                  isActive={activeSection === 'porCarrera'}
                  onClick={() => toggleMenu('porCarrera')}
                />
              )}
            </MenuGroup>
          )}

          {/* Grupo: Evaluaciones de Postulantes */}
          {(hasPermission("Concurso de Méritos") || hasPermission("Examen de Conocimientos") || hasPermission("Examen de Competencias")) && (
            <MenuGroup label="Evaluaciones de Postulantes" isExpanded={isExpanded}>
              {hasPermission("Concurso de Méritos") && (
                <MenuItem
                  icon={<ClipboardIcon className="w-6 h-6" />}
                  label="ConcursoDeMeritos"
                  displayLabel="Concurso de Méritos"
                  isExpanded={isExpanded}
                  isActive={activeSection === 'ConcursoDeMeritos'}
                  onClick={() => toggleMenu('ConcursoDeMeritos')}
                />
              )}
              {hasPermission("Examen de Conocimientos") && (
                <MenuItem
                  icon={<AcademicCapIcon className="w-6 h-6" />}
                  label="Examendeconocimientos"
                  displayLabel="Examen de Conocimientos"
                  isExpanded={isExpanded}
                  isActive={activeSection === 'Examendeconocimientos'}
                  onClick={() => toggleMenu('Examendeconocimientos')}
                />
              )}
              {hasPermission("Examen de Competencias") && (
                <MenuItem
                  icon={<AcademicCapIcon className="w-6 h-6" />}
                  label="ExamendeCompetencias"
                  displayLabel="Examen de Competencias"
                  isExpanded={isExpanded}
                  isActive={activeSection === 'ExamendeCompetencias'}
                  onClick={() => toggleMenu('ExamendeCompetencias')}
                />
              )}
            </MenuGroup>
          )}

          {/* Grupo: Firma Digital */}
          {hasPermission("Firma Digital") && (
            <MenuGroup label="Firma Digital" isExpanded={isExpanded}>
              <MenuItem
                icon={<PencilSquareIcon className="w-6 h-6" />}
                label="propuestaDocente"
                displayLabel="Firma Digital"
                isExpanded={isExpanded}
                isActive={activeSection === 'propuestaDocente'}
                onClick={() => toggleMenu('propuestaDocente')}
              />
            </MenuGroup>
          )}

          {/* Grupo: Workflow */}
          <MenuGroup label="Workflow" isExpanded={isExpanded}>
            <MenuItem
              icon={<CogIcon className="w-6 h-6" />}
              label="workflow"
              displayLabel="Automatización Secuencial"
              isExpanded={isExpanded}
              isActive={activeSection === 'workflow'}
              onClick={() => toggleMenu('workflow')}
            />
          </MenuGroup>
        </nav>
      </aside>

      <main className="flex-1 bg-gradient-to-b from-gray-100 to-gray-200 p-8 overflow-y-auto">
        {activeSection !== 'dashboard' && (
          <button
            onClick={() => setActiveSection(previousSection || 'dashboard')}
            className="mb-4 p-2 bg-gradient-to-b from-blue-900 to-blue-700 text-white rounded-full shadow-md hover:from-blue-800 hover:to-blue-600 transition flex items-center justify-center w-10 h-10"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}

        {/* Contenido de cada sección */}
        {activeSection === 'dashboard' && (
          <div className="space-y-16">
            <div
              className="relative h-[70vh] flex flex-col justify-center items-center bg-cover bg-center overflow-hidden rounded-2xl shadow-lg"
              style={{ backgroundImage: `url(${background})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70"></div>
              <div className="relative z-10 text-center text-white px-6">
                <h2 className="text-5xl font-extrabold mb-4">
                  ¡Bienvenido al Sistema de Selección Docente!
                </h2>
                <p className="text-xl">
                  Seleccione una opción en la barra lateral para continuar y explore las funcionalidades.
                </p>
              </div>
            </div>
            {/* Sección de Misión y Visión */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="flex items-center justify-center">
                <img
                  src={missionImage}
                  alt="Misión"
                  className="w-60 h-60 object-cover rounded-full shadow-2xl"
                />
              </div>
              <div className="bg-white bg-opacity-90 shadow-xl rounded-lg p-8 flex flex-col">
                <div className="flex items-center mb-4">
                  <GlobeAltIcon className="w-8 h-8 text-blue-900 mr-2" />
                  <h2 className="text-3xl font-bold text-blue-900">Misión</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Formar y especializar profesionales de excelencia, con principios, valores ético-morales y cívicos, caracterizados por su responsabilidad social, espíritu emprendedor, liderazgo y disciplina; promoviendo la internacionalización, interacción social y desarrollo de la ciencia, tecnología e innovación, para contribuir al desarrollo del Estado.
                </p>
              </div>
              <div className="bg-white bg-opacity-90 shadow-xl rounded-lg p-8 flex flex-col">
                <div className="flex items-center mb-4">
                  <LightBulbIcon className="w-8 h-8 text-blue-900 mr-2" />
                  <h2 className="text-3xl font-bold text-blue-900">Visión</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Ser la Universidad líder en la formación de profesionales en Ingeniería y de especialización, caracterizada por el estudio, aplicación e innovación tecnológica, con responsabilidad social y reconocida a nivel nacional e internacional.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src={visionImage}
                  alt="Visión"
                  className="w-60 h-60 object-cover rounded-full shadow-2xl"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'ListaAcefalia' && (
          <ListaAcefalia
            onAddAcefalia={() => {
              setPreviousSection('ListaAcefalia');
              setSelectedAcefalia(null);
              setActiveSection('AcefaliaForm');
            }}
            onEditAcefalia={(acefalia) => {
              setPreviousSection('ListaAcefalia');
              setSelectedAcefalia(acefalia);
              setActiveSection('AcefaliaForm');
            }}
          />
        )}
        {activeSection === 'AcefaliaForm' && (
          <AcefaliaForm
            acefalia={selectedAcefalia}
            onAcefaliaRegistered={() => setActiveSection('ListaAcefalia')}
          />
        )}
        {activeSection === 'ListaUsuarios' && (
          <ListaUsuarios
            onAddUser={() => {
              setPreviousSection('ListaUsuarios');
              setSelectedUser(null);
              setActiveSection('UserForm');
            }}
            onEditUser={(user) => {
              setPreviousSection('ListaUsuarios');
              setSelectedUser(user);
              setActiveSection('UserForm');
            }}
          />
        )}
        {activeSection === 'UserForm' && (
          <UserForm
            user={selectedUser}
            onUserRegistered={() => setActiveSection('ListaUsuarios')}
          />
        )}
        {activeSection === 'postulaciones' && <Postulaciones />}
        {activeSection === 'porCarrera' && (
          // Aquí se renderiza el componente Postulacionesporcarrera que creaste
          <Postulacionesporcarrera />
        )}
        {activeSection === 'ConcursoDeMeritos' && (
          <ConcursoDeMeritos
            onRegister={() => {
              setPreviousSection('ConcursoDeMeritos');
              setActiveSection('Registrodemeritos');
            }}
          />
        )}
        {activeSection === 'Registrodemeritos' && (
          <RegistroDeMeritos
            onMeritosRegistered={() => setActiveSection('ConcursoDeMeritos')}
          />
        )}
        {activeSection === 'Examendeconocimientos' && (
          <Examendeconocimientos
            onRegister={() => {
              setPreviousSection('Examendeconocimientos');
              setActiveSection('Registrodeconocimientos');
            }}
          />
        )}
        {activeSection === 'Registrodeconocimientos' && (
          <Registrodeconocimientos
            onConocimientosRegistered={() => setActiveSection('Examendeconocimientos')}
          />
        )}
        {activeSection === 'ExamendeCompetencias' && <ExamendeCompetencias />}
        {activeSection === 'propuestaDocente' && (
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-4">Firma Digital</h2>
            <FirmaDigital />
          </div>
        )}
        {activeSection === 'workflow' && (
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-4">Automatización Secuencial</h2>
            <Workflow visitedModules={visitedModules} />
          </div>
        )}
      </main>
    </div>
  );
}

function MenuItem({ icon, label, displayLabel, isExpanded, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-2 cursor-pointer transition-colors duration-200 hover:bg-blue-800 ${
        isActive ? 'bg-blue-800' : ''
      } ${isExpanded ? 'justify-start' : 'justify-center'}`}
    >
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
      {isExpanded && <span className="ml-2 font-medium">{displayLabel || label}</span>}
    </div>
  );
}

function MenuGroup({ label, isExpanded, children }) {
  return (
    <div className="mt-2">
      {isExpanded && (
        <p className="px-4 text-xs font-semibold text-gray-300 uppercase">{label}</p>
      )}
      {children}
    </div>
  );
}

export default Dashboard;
