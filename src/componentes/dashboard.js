"use client"

import { useState, useEffect, createContext, useContext } from "react"
import {
  HomeIcon,
  FolderIcon,
  UserGroupIcon,
  ClipboardIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  LightBulbIcon,
  PencilSquareIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  BellIcon,
  ChartBarIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  UsersIcon,
  BuildingLibraryIcon,
  PresentationChartBarIcon,
} from "@heroicons/react/24/outline"
import axios from "axios"
// Cambiar la referencia del logo a emiemi.png
import logo from "../images/emiemi.png"
import background from "../images/EMI.jpg"
import missionImage from "../images/mision.png"
import visionImage from "../images/vision.jpg"
import ListaAcefalia from "./ListaAcefalia"
import ListaUsuarios from "./ListaUsuarios"
import UserForm from "./UserForm"
import Postulaciones from "./Postulaciones"
import AcefaliaForm from "./AcefaliaForm"
import ConcursoDeMeritos from "./ConcursoDeMeritos"
import RegistroDeMeritos from "./Registrodemeritos"
import ExamendeCompetencias from "./Examendecompetencias"
import Examendeconocimientos from "./Examendeconocimientos"
import Registrodeconocimientos from "./Registrodeconocimientos"
import FirmaDigital from "./firmadigital"
import Workflow from "./workflow"
import Postulacionesporcarrera from "./Postulacionesporcarrera"
import Reportes from "./Reportes"

// Crear un contexto para el estado del sidebar
const SidebarContext = createContext(null)

// Hook personalizado para acceder al contexto del sidebar
function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar debe usarse dentro de un SidebarProvider")
  }
  return context
}

function Dashboard() {
  // Obtener datos del usuario desde localStorage
  const storedUser = localStorage.getItem("user")
  let userData = null
  if (storedUser && storedUser !== "undefined") {
    try {
      userData = JSON.parse(storedUser)
    } catch (error) {
      console.error("Error al parsear usuario desde localStorage:", error)
      userData = null
    }
  }
  const user = userData
  const permisos = user?.permisos || {}

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  // Mapeo para títulos de cada sección
  const sectionTitles = {
    dashboard: "Dashboard",
    ListaAcefalia: "Lista de Acefalías",
    AcefaliaForm: "Registrar Acefalía",
    ListaUsuarios: "Usuarios",
    UserForm: "Formulario de Usuario",
    postulaciones: "Postulaciones",
    porCarrera: "Postulaciones por Carrera",
    ConcursoDeMeritos: "Concurso de Méritos",
    Registrodemeritos: "Registro de Méritos",
    Examendeconocimientos: "Examen de Conocimientos",
    Registrodeconocimientos: "Registro de Conocimientos",
    ExamendeCompetencias: "Examen de Competencias",
    ReporteGeneralDeNotas: "Reporte General de Notas",
    propuestaDocente: "Firma Digital",
    workflow: "Automatización Secuencial",
  }

  // Función que devuelve true si el usuario es admin o tiene el permiso indicado
  const hasPermission = (permKey) => {
    if (user?.administrador) return true
    return permisos[permKey]
  }

  const [activeSection, setActiveSection] = useState("dashboard")
  const [previousSection, setPreviousSection] = useState(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedAcefalia, setSelectedAcefalia] = useState(null)
  const [visitedModules, setVisitedModules] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({
    acefalias: true,
    usuarios: true,
    postulaciones: true,
    evaluaciones: true,
    reportes: true,
    firmaDigital: true,
    workflow: true,
  })

  const workflowMapping = {
    dashboard: ["Inicio"],
    ListaAcefalia: ["Lista de materias acefalas", "Añadir materia acefala"],
    AcefaliaForm: ["Lista de materias acefalas", "Añadir materia acefala"],
    ListaUsuarios: ["Lista Usuarios", "Añadir Usuario", "Asignar roles y permisos"],
    UserForm: ["Lista Usuarios", "Añadir Usuario", "Asignar roles y permisos"],
    postulaciones: ["Postulaciones", "Visualizar historial de registro y documentacion"],
    porCarrera: ["Postulaciones", "Visualizar historial de registro y documentacion"],
    ConcursoDeMeritos: [
      "Comité de Evaluación",
      "Gestión de la documentación concurso de méritos",
      "Registrar puntos de evaluación",
    ],
    Registrodemeritos: [
      "Comité de Evaluación",
      "Gestión de la documentación concurso de méritos",
      "Registrar puntos de evaluación",
    ],
    Examendeconocimientos: [
      "Comité de Evaluación",
      "Gestión de la documentación examen de conocimientos",
      "Registrar puntos de evaluación",
    ],
    Registrodeconocimientos: [
      "Comité de Evaluación",
      "Gestión de la documentación examen de conocimientos",
      "Registrar puntos de evaluación",
    ],
    ExamendeCompetencias: [
      "Comité de evaluación",
      "Gestión de la documentación examen de competencias",
      "Registrar puntos de evaluación",
    ],
    ReporteGeneralDeNotas: ["Módulo de Reportes", "Reporte General de Notas"],
    propuestaDocente: ["Firma Digital", "Subir documentación", "Descargar documentación con Firma Digital", "Fin"],
  }

  const toggleMenu = (section) => {
    setPreviousSection(activeSection)
    setActiveSection(section)
    setMobileMenuOpen(false)
    if (workflowMapping[section]) {
      setVisitedModules((prev) => {
        const nuevos = workflowMapping[section].filter((label) => !prev.includes(label))
        return [...prev, ...nuevos]
      })
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }))
  }

  // Función para expandir la barra y abrir un grupo específico
  const expandAndOpenGroup = (group) => {
    if (!isExpanded) {
      setIsExpanded(true)
      // Esperamos un poco para que la animación de expansión termine
      setTimeout(() => {
        setExpandedGroups((prev) => ({
          ...prev,
          [group]: true,
        }))
      }, 150)
    } else {
      toggleGroup(group)
    }
  }

  // Cierra el menú móvil cuando se cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Registra la secuencia de módulos visitados
  useEffect(() => {
    if (visitedModules.length >= 3) {
      axios
        .post("/api/workflow/registrar", { modules: visitedModules })
        .then((response) => {
          console.log("Secuencia registrada", response.data)
        })
        .catch((error) => {
          console.error("Error al registrar la secuencia", error)
        })
    }
  }, [visitedModules])

  // Valor del contexto del sidebar
  const sidebarContextValue = {
    isExpanded,
    toggleExpand,
    expandedGroups,
    toggleGroup,
    expandAndOpenGroup,
  }

  // Estilos para ocultar la barra de desplazamiento pero mantener la funcionalidad
  const scrollbarHideStyles = {
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE y Edge
    "&::-webkit-scrollbar": {
      display: "none", // Chrome, Safari y Opera
    },
  }

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-50">
        {/* Header para móviles */}
        <header className="md:hidden bg-gradient-to-r from-blue-900 to-blue-700 text-white p-4 flex items-center justify-between shadow-lg z-20">
          <div className="flex items-center">
            <img src={logo || "/placeholder.svg"} alt="Logo EMI" className="w-8 h-auto" />
            <span className="ml-2 font-bold text-lg">EMI</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="p-2 rounded-full hover:bg-blue-800 transition-colors"
            >
              <UserCircleIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-blue-800 transition-colors"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Menú de usuario móvil */}
        {userMenuOpen && (
          <div className="md:hidden absolute top-16 right-4 bg-white shadow-lg rounded-lg p-4 z-30 w-48">
            <div className="flex flex-col space-y-2">
              <div className="font-medium text-blue-900 border-b pb-2 mb-2">{user?.nombre || "Usuario"}</div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-900 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* Overlay para menú móvil */}
        <div
          className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-10 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        ></div>

        {/* Barra de navegación lateral mejorada */}
        <aside
          className={`bg-gradient-to-b from-blue-900 to-blue-800 text-white fixed md:relative h-screen overflow-hidden transition-all duration-300 flex flex-col shadow-xl z-20 ${
            mobileMenuOpen ? "w-72 left-0" : "w-0 -left-72 md:w-20 md:left-0"
          } ${isExpanded ? "md:w-72" : "md:w-20"}`}
        >
          {/* Logo y cabecera del sidebar */}
          <div className="flex flex-col items-center p-4 border-b border-blue-700 bg-blue-900">
            <img
              src={logo || "/placeholder.svg"}
              alt="Logo EMI"
              className={`${isExpanded || mobileMenuOpen ? "w-32" : "w-12"} h-auto transition-all duration-300`}
            />
            {(isExpanded || mobileMenuOpen) && (
              <p className="text-xs text-blue-200 mt-2 text-center">Sistema de Selección Docente</p>
            )}
          </div>

          {/* Botón para expandir/colapsar */}
          <button
            onClick={toggleExpand}
            className="hidden md:flex items-center justify-center p-2 m-2 bg-blue-800 rounded-full text-white transition hover:bg-blue-700 focus:outline-none self-end"
          >
            {isExpanded ? (
              <ChevronLeftIcon className="w-5 h-5 text-blue-100" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-blue-100" />
            )}
          </button>

          {/* Navegación principal - Ocultar scrollbar pero mantener funcionalidad */}
          <nav
            className="flex-1 py-4 px-2 space-y-1 overflow-y-auto"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style jsx>{`
              nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {/* Dashboard */}
            <NavItem
              icon={<HomeIcon className="w-6 h-6" />}
              label="Dashboard"
              section="dashboard"
              activeSection={activeSection}
              isExpanded={isExpanded || mobileMenuOpen}
              onClick={() => toggleMenu("dashboard")}
            />

            {/* Acefalías */}
            {(hasPermission("Lista de Acefalías") || hasPermission("Registrar Acefalia")) && (
              <NavGroup
                icon={<BuildingLibraryIcon className="w-6 h-6" />}
                label="Asignaturas en Acefalía"
                isExpanded={isExpanded || mobileMenuOpen}
                isOpen={expandedGroups.acefalias}
                groupKey="acefalias"
              >
                {hasPermission("Lista de Acefalías") && (
                  <NavItem
                    icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
                    label="Lista de Acefalías"
                    section="ListaAcefalia"
                    activeSection={activeSection}
                    isExpanded={isExpanded || mobileMenuOpen}
                    onClick={() => toggleMenu("ListaAcefalia")}
                    isSubItem
                  />
                )}
                {hasPermission("Registrar Acefalía") && (
                  <NavItem
                    icon={<FolderIcon className="w-6 h-6" />}
                    label="Registrar Acefalía"
                    section="AcefaliaForm"
                    activeSection={activeSection}
                    isExpanded={isExpanded || mobileMenuOpen}
                    onClick={() => {
                      setPreviousSection("ListaAcefalia")
                      toggleMenu("AcefaliaForm")
                    }}
                    isSubItem
                  />
                )}
              </NavGroup>
            )}

            {/* Usuarios */}
            {hasPermission("Usuarios") && (
              <NavGroup
                icon={<UsersIcon className="w-6 h-6" />}
                label="Gestión de Usuarios"
                isExpanded={isExpanded || mobileMenuOpen}
                isOpen={expandedGroups.usuarios}
                groupKey="usuarios"
              >
                <NavItem
                  icon={<UserGroupIcon className="w-6 h-6" />}
                  label="Usuarios"
                  section="ListaUsuarios"
                  activeSection={activeSection}
                  isExpanded={isExpanded || mobileMenuOpen}
                  onClick={() => toggleMenu("ListaUsuarios")}
                  isSubItem
                />
              </NavGroup>
            )}

            {/* Postulaciones */}
            {(hasPermission("Postulaciones") || hasPermission("Postulaciones por Carrera")) && (
              <NavGroup
                icon={<DocumentCheckIcon className="w-6 h-6" />}
                label="Postulaciones"
                isExpanded={isExpanded || mobileMenuOpen}
                isOpen={expandedGroups.postulaciones}
                groupKey="postulaciones"
              >
                {hasPermission("Postulaciones") && (
                  <NavItem
                    icon={<DocumentTextIcon className="w-6 h-6" />}
                    label="Postulaciones"
                    section="postulaciones"
                    activeSection={activeSection}
                    isExpanded={isExpanded || mobileMenuOpen}
                    onClick={() => toggleMenu("postulaciones")}
                    isSubItem
                  />
                )}
                {hasPermission("Postulaciones por Carrera") && (
                  <NavItem
                    icon={<AcademicCapIcon className="w-6 h-6" />}
                    label="Por Carrera"
                    section="porCarrera"
                    activeSection={activeSection}
                    isExpanded={isExpanded || mobileMenuOpen}
                    onClick={() => toggleMenu("porCarrera")}
                    isSubItem
                  />
                )}
              </NavGroup>
            )}

            {/* Evaluaciones */}
            {(hasPermission("Concurso de Méritos") ||
              hasPermission("Examen de Conocimientos") ||
              hasPermission("Examen de Competencias")) && (
              <NavGroup
                icon={<ClipboardIcon className="w-6 h-6" />}
                label="Evaluaciones de Postulantes"
                isExpanded={isExpanded || mobileMenuOpen}
                isOpen={expandedGroups.evaluaciones}
                groupKey="evaluaciones"
              >
                {hasPermission("Concurso de Méritos") && (
                  <NavItem
                    icon={<DocumentMagnifyingGlassIcon className="w-6 h-6" />}
                    label="Concurso de Méritos"
                    section="ConcursoDeMeritos"
                    activeSection={activeSection}
                    isExpanded={isExpanded || mobileMenuOpen}
                    onClick={() => toggleMenu("ConcursoDeMeritos")}
                    isSubItem
                  />
                )}
                {hasPermission("Examen de Conocimientos") && (
                  <NavItem
                    icon={<BookOpenIcon className="w-6 h-6" />}
                    label="Examen de Conocimientos"
                    section="Examendeconocimientos"
                    activeSection={activeSection}
                    isExpanded={isExpanded || mobileMenuOpen}
                    onClick={() => toggleMenu("Examendeconocimientos")}
                    isSubItem
                  />
                )}
                {hasPermission("Examen de Competencias") && (
                  <NavItem
                    icon={<AcademicCapIcon className="w-6 h-6" />}
                    label="Examen de Competencias"
                    section="ExamendeCompetencias"
                    activeSection={activeSection}
                    isExpanded={isExpanded || mobileMenuOpen}
                    onClick={() => toggleMenu("ExamendeCompetencias")}
                    isSubItem
                  />
                )}
              </NavGroup>
            )}

            {/* Reportes */}
            {hasPermission("Reportes") && (
              <NavGroup
                icon={<ChartBarIcon className="w-6 h-6" />}
                label="Reportes"
                isExpanded={isExpanded || mobileMenuOpen}
                isOpen={expandedGroups.reportes}
                groupKey="reportes"
              >
                <NavItem
                  icon={<PresentationChartBarIcon className="w-6 h-6" />}
                  label="Reporte General de Notas"
                  section="ReporteGeneralDeNotas"
                  activeSection={activeSection}
                  isExpanded={isExpanded || mobileMenuOpen}
                  onClick={() => toggleMenu("ReporteGeneralDeNotas")}
                  isSubItem
                />
              </NavGroup>
            )}

            {/* Firma Digital */}
            {hasPermission("Firma Digital") && (
              <NavGroup
                icon={<PencilSquareIcon className="w-6 h-6" />}
                label="Firma Digital"
                isExpanded={isExpanded || mobileMenuOpen}
                isOpen={expandedGroups.firmaDigital}
                groupKey="firmaDigital"
              >
                <NavItem
                  icon={<DocumentTextIcon className="w-6 h-6" />}
                  label="Firma Digital"
                  section="propuestaDocente"
                  activeSection={activeSection}
                  isExpanded={isExpanded || mobileMenuOpen}
                  onClick={() => toggleMenu("propuestaDocente")}
                  isSubItem
                />
              </NavGroup>
            )}

            {/* Workflow */}
            <NavGroup
              icon={<CogIcon className="w-6 h-6" />}
              label="Workflow"
              isExpanded={isExpanded || mobileMenuOpen}
              isOpen={expandedGroups.workflow}
              groupKey="workflow"
            >
              <NavItem
                icon={<CogIcon className="w-6 h-6" />}
                label="Automatización Secuencial"
                section="workflow"
                activeSection={activeSection}
                isExpanded={isExpanded || mobileMenuOpen}
                onClick={() => toggleMenu("workflow")}
                isSubItem
              />
            </NavGroup>
          </nav>

          {/* Perfil de usuario en el sidebar */}
          {(isExpanded || mobileMenuOpen) && (
            <div className="p-4 border-t border-blue-700 bg-blue-900/50 mt-auto">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-900">
                  <UserCircleIcon className="w-6 h-6" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium truncate">{user?.nombre || "Usuario"}</p>
                  <p className="text-xs text-blue-200 truncate">{user?.administrador ? "Administrador" : "Usuario"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-auto p-2 rounded-full hover:bg-blue-800 transition-colors"
                  title="Cerrar sesión"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto pt-0 md:pt-0">
          {/* Header profesional mejorado */}
          <header className="sticky top-0 z-10 bg-white shadow-md">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                {activeSection !== "dashboard" && (
                  <button
                    onClick={() => setActiveSection(previousSection || "dashboard")}
                    className="p-2 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-full shadow-md hover:from-blue-800 hover:to-blue-600 transition"
                    aria-label="Volver"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                )}
                <h1 className="text-xl md:text-2xl font-bold text-blue-900 truncate">
                  {sectionTitles[activeSection] || "Dashboard"}
                </h1>
              </div>

              {/* Menú de usuario para escritorio */}
              <div className="hidden md:flex items-center space-x-4">
                <button className="relative p-2 text-gray-600 hover:text-blue-900 hover:bg-gray-100 rounded-full transition-colors">
                  <BellIcon className="w-6 h-6" />
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="relative">
                  <div
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-900">
                      <UserCircleIcon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-gray-800 max-w-[120px] truncate">
                      {user?.nombre || "Usuario"}
                    </span>
                    <ChevronDownIcon
                      className={`w-4 h-4 text-gray-600 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* Modificar el menú de usuario para mostrar solo la opción de cerrar sesión */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 z-20">
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900">{user?.nombre || "Usuario"}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.administrador ? "Administrador" : "Usuario"}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-gray-500" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Contenido de cada sección */}
          <div className="p-4 md:p-8">
            {activeSection === "dashboard" && (
              <div className="space-y-8 md:space-y-16">
                <div
                  className="relative h-[50vh] md:h-[70vh] flex flex-col justify-center items-center bg-cover bg-center overflow-hidden rounded-2xl shadow-lg transition-transform transform hover:scale-105"
                  style={{ backgroundImage: `url(${background})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70"></div>
                  <div className="relative z-10 text-center text-white px-6">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
                      ¡Bienvenido al Sistema de Selección Docente!
                    </h2>
                    <p className="text-base md:text-xl">
                      Seleccione una opción en la barra lateral para continuar y explore las funcionalidades.
                    </p>
                  </div>
                </div>

                {/* Sección de Misión y Visión */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <div className="flex items-center justify-center order-2 md:order-1">
                    <img
                      src={missionImage || "/placeholder.svg"}
                      alt="Misión"
                      className="w-40 h-40 md:w-60 md:h-60 object-cover rounded-full shadow-2xl transition-transform transform hover:scale-105"
                    />
                  </div>
                  <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 flex flex-col order-1 md:order-2 hover:shadow-2xl transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-900 mr-3">
                        <GlobeAltIcon className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Misión</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Formar y especializar profesionales de excelencia...
                    </p>
                  </div>
                  <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 flex flex-col order-3 hover:shadow-2xl transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-900 mr-3">
                        <LightBulbIcon className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Visión</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      Ser la Universidad líder en la formación de profesionales...
                    </p>
                  </div>
                  <div className="flex items-center justify-center order-4">
                    <img
                      src={visionImage || "/placeholder.svg"}
                      alt="Visión"
                      className="w-40 h-40 md:w-60 md:h-60 object-cover rounded-full shadow-2xl transition-transform transform hover:scale-105"
                    />
                  </div>
                </div>

                {/* Tarjeta de Gráficos Informativos */}
                <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 hover:shadow-2xl transition-shadow">
                  <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 flex items-center">
                    <ChartBarIcon className="w-6 h-6 mr-2 text-blue-700" />
                    Estadísticas y Gráficos
                  </h2>
                  <div className="w-full h-48 md:h-64 flex items-center justify-center border-dashed border-2 border-gray-300 rounded-lg">
                    <p className="text-gray-500">[Gráfico informativo]</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "ListaAcefalia" && (
              <ListaAcefalia
                onAddAcefalia={() => {
                  setPreviousSection("ListaAcefalia")
                  setSelectedAcefalia(null)
                  setActiveSection("AcefaliaForm")
                }}
                onEditAcefalia={(acefalia) => {
                  setPreviousSection("ListaAcefalia")
                  setSelectedAcefalia(acefalia)
                  setActiveSection("AcefaliaForm")
                }}
              />
            )}
            {activeSection === "AcefaliaForm" && (
              <AcefaliaForm
                acefalia={selectedAcefalia}
                onAcefaliaRegistered={() => setActiveSection("ListaAcefalia")}
              />
            )}
            {activeSection === "ListaUsuarios" && (
              <ListaUsuarios
                onAddUser={() => {
                  setPreviousSection("ListaUsuarios")
                  setSelectedUser(null)
                  setActiveSection("UserForm")
                }}
                onEditUser={(user) => {
                  setPreviousSection("ListaUsuarios")
                  setSelectedUser(user)
                  setActiveSection("UserForm")
                }}
              />
            )}
            {activeSection === "UserForm" && (
              <UserForm user={selectedUser} onUserRegistered={() => setActiveSection("ListaUsuarios")} />
            )}
            {activeSection === "postulaciones" && <Postulaciones />}
            {activeSection === "porCarrera" && <Postulacionesporcarrera />}
            {activeSection === "ConcursoDeMeritos" && (
              <ConcursoDeMeritos
                onRegister={() => {
                  setPreviousSection("ConcursoDeMeritos")
                  setActiveSection("Registrodemeritos")
                }}
              />
            )}
            {activeSection === "Registrodemeritos" && (
              <RegistroDeMeritos onMeritosRegistered={() => setActiveSection("ConcursoDeMeritos")} />
            )}
            {activeSection === "Examendeconocimientos" && (
              <Examendeconocimientos
                onRegister={() => {
                  setPreviousSection("Examendeconocimientos")
                  setActiveSection("Registrodeconocimientos")
                }}
              />
            )}
            {activeSection === "Registrodeconocimientos" && (
              <Registrodeconocimientos onConocimientosRegistered={() => setActiveSection("Examendeconocimientos")} />
            )}
            {activeSection === "ExamendeCompetencias" && <ExamendeCompetencias />}
            {activeSection === "ReporteGeneralDeNotas" && (
              <div>
                <h2 className="text-xl font-bold text-blue-900 mb-4">Reporte General de Notas</h2>
                <Reportes />
              </div>
            )}
            {activeSection === "propuestaDocente" && (
              <div>
                <h2 className="text-xl font-bold text-blue-900 mb-4">Firma Digital</h2>
                <FirmaDigital />
              </div>
            )}
            {activeSection === "workflow" && (
              <div>
                <h2 className="text-xl font-bold text-blue-900 mb-4">Automatización Secuencial</h2>
                <Workflow visitedModules={visitedModules} />
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  )
}

// Componente para elementos de navegación
function NavItem({ icon, label, section, activeSection, isExpanded, onClick, isSubItem = false }) {
  const isActive = activeSection === section

  return (
    <div
      onClick={onClick}
      className={`flex items-center cursor-pointer transition-all duration-200 rounded-lg ${
        isActive ? "bg-blue-700 text-white" : "text-blue-100 hover:bg-blue-700/50"
      } ${isExpanded ? "justify-start" : "justify-center"} ${isSubItem ? "ml-6 pl-2 pr-2 py-2" : "px-3 py-3"}`}
    >
      <div className={`flex items-center justify-center ${isActive ? "text-white" : "text-blue-300"}`}>
        <div className="w-7 h-7">{icon}</div>
      </div>
      {isExpanded && (
        <span className={`ml-3 font-medium text-sm truncate ${isActive ? "font-semibold" : ""}`}>{label}</span>
      )}
      {isActive && isExpanded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300"></div>}
    </div>
  )
}

// Componente para grupos de navegación
function NavGroup({ icon, label, isExpanded, isOpen, groupKey, children }) {
  const { toggleGroup, expandAndOpenGroup } = useSidebar()

  const handleClick = () => {
    if (isExpanded) {
      toggleGroup(groupKey)
    } else {
      expandAndOpenGroup(groupKey)
    }
  }

  return (
    <div className="space-y-1">
      {isExpanded ? (
        <div
          onClick={handleClick}
          className="flex items-center justify-between px-3 py-3 text-blue-100 hover:bg-blue-700/30 rounded-lg cursor-pointer"
        >
          <div className="flex items-center">
            <div className="text-blue-300 w-7 h-7">{icon}</div>
            <span className="ml-3 font-medium text-sm">{label}</span>
          </div>
          <ChevronDownIcon className={`w-4 h-4 text-blue-300 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="flex items-center justify-center p-3 text-blue-100 hover:bg-blue-700/30 rounded-lg cursor-pointer"
        >
          <div className="text-blue-300 w-7 h-7">{icon}</div>
        </div>
      )}
      {isExpanded && isOpen && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  )
}

export default Dashboard
