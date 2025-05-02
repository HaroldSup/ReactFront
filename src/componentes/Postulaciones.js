"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import swal from "sweetalert"
import {
  FaFileAlt,
  FaEyeSlash,
  FaEye,
  FaSearch,
  FaSpinner,
  FaExclamationTriangle,
  FaRedo,
  FaDownload,
  FaTrash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaUniversity,
  FaCalendarAlt,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaBook,
  FaBuilding,
} from "react-icons/fa"

// Función para convertir un string a formato título
const toTitleCase = (str) => {
  if (!str) return ""
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

// Lista de documentos requeridos y sus etiquetas
const documentosList = [
  { key: "cartaDocenteAntiguoLicenciatura", label: "Carta de Postulación Docente Antiguo Licenciatura" },
  { key: "cartaDocenteAntiguoTecnologico", label: "Carta de Postulación Docente Antiguo Tecnológico" },
  { key: "cartaDocenteAntiguoMateriaMilitar", label: "Carta de Postulación Docente Antiguo Materia Militar" },
  { key: "cartaDocenteNuevoLicenciatura", label: "Carta de Postulación Docente Nuevo Licenciatura" },
  { key: "cartaDocenteNuevoTecnologico", label: "Carta de Postulación Docente Nuevo Tecnológico" },
  { key: "cartaDocenteNuevoMateriaMilitar", label: "Carta de Postulación Docente Nuevo Materia Militar" },
  { key: "hojaVida", label: "Hoja de Vida según modelo de la EMI" },
  { key: "tituloLicenciatura", label: "Título Licenciatura" },
  { key: "tituloTecnicoSuperior", label: "Título Técnico Superior" },
  { key: "diplomadoEducacionSuperiorCompetencias", label: "Diplomado Educación Superior por Competencias" },
  { key: "cursosEspecialidad", label: "Cursos de Especialidad" },
  { key: "maestria", label: "Maestría" },
  { key: "doctorado", label: "Doctorado" },
  { key: "posDoctorado", label: "Pos-Doctorado" },
  { key: "cursos80a160", label: "Cursos (80-160 Hrs Académicas)" },
  { key: "cursoDiplomadoMayor160", label: "Curso o diplomado (>160 Hrs Académicas)" },
  { key: "cursoIdiomaIngles", label: "Curso de Idioma Inglés" },
  { key: "libros", label: "Libros" },
  { key: "textosAcademicos", label: "Textos Académicos, Reglamentos y Manuales" },
  { key: "guiasFolletos", label: "Guías o folletos" },
  { key: "articulosInvestigacion", label: "Artículos de Investigación" },
  { key: "congresos", label: "Congresos" },
  { key: "simposiosSeminarios", label: "Simposios o seminarios" },
  { key: "experienciaDocenteEMI", label: "Experiencia Docente en la EMI" },
  { key: "experienciaDocenteOtrasInstituciones", label: "Experiencia Docente en otras Instituciones" },
  { key: "tutorTrabajoGrado", label: "Tutor de Trabajo de Grado" },
  { key: "miembroTribunalTrabajoGrado", label: "Miembro de Tribunal Trabajo de Grado" },
  { key: "actividadProfesional", label: "Actividad profesional (Respaldada)" },
  { key: "participacionVidaUniversitaria", label: "Participación en vida universitaria (Evidencias)" },
]

// Función para extraer el nombre del archivo (sin la ruta)
const getFileName = (filePath) => {
  if (!filePath) return ""
  return filePath.split("\\").pop().split("/").pop()
}

// Función para formatear la información de las asignaturas postuladas
const formatAsignaturas = (asignaturas) => {
  if (!asignaturas) return ""
  if (!Array.isArray(asignaturas)) {
    try {
      asignaturas = JSON.parse(asignaturas)
    } catch (e) {
      return asignaturas
    }
  }
  return asignaturas
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        const nombre = item.asignatura ? toTitleCase(item.asignatura) : ""
        const carrera = item.carrera ? toTitleCase(item.carrera) : ""
        const nivel = item.nivel ? toTitleCase(item.nivel) : ""
        return `${nombre} (${carrera}, ${nivel})`
      }
      return item
    })
    .join(" | ")
}

// Función para generar un resumen de la documentación para Excel
const formatDocumentosForExcel = (documentos) => {
  if (!documentos) return ""
  return documentosList
    .map((doc) => {
      const archivo = documentos[doc.key]
      return `${doc.label}: ${archivo ? getFileName(archivo) : "Sin Archivos"}`
    })
    .join(" || ")
}

// Componente para mostrar los documentos en tarjetas
const DocumentosDetalle = ({ documentos, baseURL }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {documentosList.map((doc, idx) => (
        <div
          key={idx}
          className="flex items-center border border-gray-200 p-2 rounded-md hover:bg-gray-50 transition-colors"
        >
          <FaFileAlt className="text-blue-500 mr-2 flex-shrink-0" size={20} />
          <div className="flex-grow">
            <span className="font-bold">{doc.label}:</span>
            {documentos && documentos[doc.key] ? (
              <a
                href={`${baseURL}/uploads/${getFileName(documentos[doc.key])}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline block truncate"
              >
                {getFileName(documentos[doc.key])}
              </a>
            ) : (
              <span className="text-gray-500 block">Sin Archivos</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Componente de error con botón de reintento
const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 text-center">
    <FaExclamationTriangle className="text-red-500 mx-auto mb-2" size={24} />
    <p className="text-red-700 mb-3">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center mx-auto"
      >
        <FaRedo className="mr-2" /> Reintentar
      </button>
    )}
  </div>
)

// Componente de carga
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <FaSpinner className="animate-spin text-blue-500" size={32} />
    <span className="ml-2 text-blue-700">Cargando postulaciones...</span>
  </div>
)

function Postulaciones() {
  // Estados
  const [postulaciones, setPostulaciones] = useState([])
  const [filteredPostulaciones, setFilteredPostulaciones] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [showPassword, setShowPassword] = useState({})

  // Determinar la URL base según el entorno
  const baseURL = useMemo(() => {
    return process.env.NODE_ENV === "development"
      ? "http://localhost:5000"
      : process.env.REACT_APP_urlback || window.location.origin
  }, [])

  // Función para obtener las postulaciones con reintentos
  const fetchPostulaciones = useCallback(
    async (retryCount = 0) => {
      const MAX_RETRIES = 3
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get(`${baseURL}/postulaciones`, {
          timeout: 15000, // 15 segundos de timeout
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        })

        // Verificar la estructura de la respuesta
        if (response.data) {
          // Algunos backends devuelven los datos en un campo 'data'
          const postulacionesData = response.data.data || response.data

          if (Array.isArray(postulacionesData)) {
            setPostulaciones(postulacionesData)
            setFilteredPostulaciones(postulacionesData)
          } else {
            console.error("Formato de respuesta inesperado:", response.data)
            setError("El formato de respuesta del servidor no es válido")
          }
        } else {
          setError("No se recibieron datos del servidor")
        }
      } catch (error) {
        console.error("Error al obtener las postulaciones:", error)

        // Mensaje de error específico según el tipo de error
        let errorMessage = "Error al obtener las postulaciones."

        if (error.response) {
          // El servidor respondió con un código de estado fuera del rango 2xx
          errorMessage = `Error ${error.response.status}: ${error.response.data?.message || "Error en la respuesta del servidor"}`
        } else if (error.request) {
          // La solicitud se realizó pero no se recibió respuesta
          errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet."
        } else {
          // Error al configurar la solicitud
          errorMessage = `Error de configuración: ${error.message}`
        }

        // Reintentar si no hemos alcanzado el máximo de intentos
        if (retryCount < MAX_RETRIES) {
          console.log(`Reintentando (${retryCount + 1}/${MAX_RETRIES})...`)
          setTimeout(() => {
            fetchPostulaciones(retryCount + 1)
          }, 2000 * Math.pow(2, retryCount)) // Backoff exponencial
          return
        }

        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [baseURL],
  )

  // Cargar postulaciones al montar el componente
  useEffect(() => {
    fetchPostulaciones()
  }, [fetchPostulaciones])

  // Filtrar postulaciones cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPostulaciones(postulaciones)
      return
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filtered = postulaciones.filter((p) => {
      return (
        (p.nombre && p.nombre.toLowerCase().includes(lowerSearchTerm)) ||
        (p.correo && p.correo.toLowerCase().includes(lowerSearchTerm)) ||
        (p.ci && p.ci.toLowerCase().includes(lowerSearchTerm)) ||
        (p.profesion && p.profesion.toLowerCase().includes(lowerSearchTerm))
      )
    })

    setFilteredPostulaciones(filtered)
  }, [searchTerm, postulaciones])

  // Función para parsear asignaturas (ya que pueden venir como cadena JSON)
  const parseAsignaturas = useCallback((asignaturasRaw) => {
    if (!asignaturasRaw) return []
    if (Array.isArray(asignaturasRaw)) return asignaturasRaw
    try {
      return JSON.parse(asignaturasRaw)
    } catch (err) {
      console.error("Error al parsear asignaturasSeleccionadas", err)
      return []
    }
  }, [])

  // Alterna la visualización de la sección de documentos en cada fila
  const toggleRowExpansion = useCallback((index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }))
  }, [])

  // Alterna la visualización de contraseñas
  const togglePasswordVisibility = useCallback((index) => {
    setShowPassword((prev) => ({ ...prev, [index]: !prev[index] }))
  }, [])

  // Función para eliminar una postulación
  const handleDelete = useCallback(
    (postulacionId) => {
      swal({
        title: "¿Estás seguro?",
        text: "Esta acción eliminará la postulación de forma permanente.",
        icon: "warning",
        buttons: ["Cancelar", "Eliminar"],
        dangerMode: true,
      }).then(async (willDelete) => {
        if (willDelete) {
          try {
            await axios.delete(`${baseURL}/postulaciones/${postulacionId}`)
            setPostulaciones((prev) => prev.filter((p) => p._id !== postulacionId))
            setFilteredPostulaciones((prev) => prev.filter((p) => p._id !== postulacionId))
            swal("Postulación eliminada exitosamente.", { icon: "success" })
          } catch (error) {
            console.error("Error al eliminar la postulación:", error)
            swal("Error al eliminar la postulación.", { icon: "error" })
          }
        }
      })
    },
    [baseURL],
  )

  // Descargar registros en Excel
  const handleDownloadExcel = useCallback(() => {
    if (filteredPostulaciones.length === 0) {
      swal("No hay postulaciones para descargar.", { icon: "info" })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredPostulaciones.map((postulacion) => ({
        "Nombre Completo": postulacion.nombre || "",
        "Correo Electrónico": postulacion.correo || "",
        "Número de Celular": postulacion.celular || "",
        "Carnet de Identidad": postulacion.ci || "",
        "Universidad CEUB": postulacion.universidad || "",
        "Año de Titulación": postulacion.anioTitulacion || "",
        Profesión: postulacion.profesion || "",
        "Tipo de Docente": postulacion.tipoDocente || "",
        Asignaturas: formatAsignaturas(postulacion.asignaturasSeleccionadas),
        Documentos: formatDocumentosForExcel(postulacion.documentos),
      })),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Postulaciones")
    XLSX.writeFile(workbook, "Postulaciones.xlsx")
  }, [filteredPostulaciones])

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-4 md:mb-0">Postulaciones Registradas</h2>
        <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
          {/* Buscador */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar por nombre, correo, CI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Botón de Excel */}
          <button
            onClick={handleDownloadExcel}
            disabled={loading || filteredPostulaciones.length === 0}
            className={`flex items-center px-4 py-2 rounded-md transition w-full md:w-auto justify-center
              ${
                loading || filteredPostulaciones.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
          >
            <FaDownload className="mr-2" /> Descargar Excel
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {loading && <LoadingSpinner />}

      {error && <ErrorMessage message={error} onRetry={() => fetchPostulaciones()} />}

      {!loading && !error && filteredPostulaciones.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-600 text-lg">No hay postulaciones registradas.</p>
        </div>
      )}

      {!loading && !error && filteredPostulaciones.length > 0 && (
        <>
          {/* Vista en tabla para pantallas medianas y superiores */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <th className="border border-gray-300 px-4 py-2">Nombre Completo</th>
                  <th className="border border-gray-300 px-4 py-2">Correo</th>
                  <th className="border border-gray-300 px-4 py-2">Celular</th>
                  <th className="border border-gray-300 px-4 py-2">C.I.</th>
                  <th className="border border-gray-300 px-4 py-2">Universidad CEUB</th>
                  <th className="border border-gray-300 px-4 py-2">Año de Titulación</th>
                  <th className="border border-gray-300 px-4 py-2">Profesión</th>
                  <th className="border border-gray-300 px-4 py-2">Tipo de Docente</th>
                  <th className="border border-gray-300 px-4 py-2">Materias Postuladas</th>
                  <th className="border border-gray-300 px-4 py-2">Carrera de la Materia</th>
                  <th className="border border-gray-300 px-4 py-2">Documentación</th>
                  <th className="border border-gray-300 px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPostulaciones.map((postulacion, index) => {
                  // Convertir asignaturasSeleccionadas a arreglo si es cadena
                  const asignaturas = parseAsignaturas(postulacion.asignaturasSeleccionadas)
                  return (
                    <React.Fragment key={postulacion._id || index}>
                      <tr
                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                      >
                        <td className="border border-gray-300 px-4 py-2">{postulacion.nombre || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2">{postulacion.correo || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2">{postulacion.celular || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2">{postulacion.ci || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2">{postulacion.universidad || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2">{postulacion.anioTitulacion || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2">{postulacion.profesion || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2">{postulacion.tipoDocente || "-"}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {asignaturas && asignaturas.length > 0
                            ? asignaturas
                                .map((item) => (item.asignatura ? toTitleCase(item.asignatura) : ""))
                                .join(" | ")
                            : "-"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {asignaturas && asignaturas.length > 0
                            ? asignaturas.map((item) => (item.carrera ? toTitleCase(item.carrera) : "")).join(" | ")
                            : "-"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button
                            onClick={() => toggleRowExpansion(index)}
                            className="text-blue-500 underline hover:text-blue-700 flex items-center justify-center"
                          >
                            {expandedRows[index] ? (
                              <>
                                <FaEyeSlash className="mr-1" /> Ocultar
                              </>
                            ) : (
                              <>
                                <FaEye className="mr-1" /> Ver
                              </>
                            )}
                          </button>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button
                            onClick={() => handleDelete(postulacion._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                      {expandedRows[index] && (
                        <tr>
                          <td colSpan="12" className="border border-gray-300 bg-gray-50">
                            <DocumentosDetalle documentos={postulacion.documentos} baseURL={baseURL} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Vista en tarjetas para pantallas pequeñas - MEJORADA */}
          <div className="block md:hidden space-y-4">
            {filteredPostulaciones.map((postulacion, index) => {
              const asignaturas = parseAsignaturas(postulacion.asignaturasSeleccionadas)
              return (
                <div
                  key={postulacion._id || index}
                  className="border border-gray-300 rounded-lg overflow-hidden shadow-sm"
                >
                  {/* Encabezado de la tarjeta */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 border-b border-gray-300">
                    <h3 className="font-bold text-gray-800 text-lg truncate flex items-center">
                      <FaUser className="text-blue-600 mr-2" />
                      {postulacion.nombre || "Sin nombre"}
                    </h3>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="p-4 space-y-3 bg-white">
                    {/* Información de contacto */}
                    <div className="space-y-3 border-b border-gray-200 pb-3">
                      <div className="flex items-start">
                        <FaEnvelope className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Correo electrónico:</p>
                          <p className="font-medium text-sm break-all">{postulacion.correo || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaPhone className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Celular:</p>
                          <p className="font-medium text-sm">{postulacion.celular || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaIdCard className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">C.I.:</p>
                          <p className="font-medium text-sm">{postulacion.ci || "-"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Información académica */}
                    <div className="space-y-3 border-b border-gray-200 pb-3">
                      <div className="flex items-start">
                        <FaUniversity className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Universidad:</p>
                          <p className="font-medium text-sm">{postulacion.universidad || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaCalendarAlt className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Año Titulación:</p>
                          <p className="font-medium text-sm">{postulacion.anioTitulacion || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaGraduationCap className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Profesión:</p>
                          <p className="font-medium text-sm">{postulacion.profesion || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaChalkboardTeacher className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Tipo Docente:</p>
                          <p className="font-medium text-sm">{postulacion.tipoDocente || "-"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Materias postuladas */}
                    <div className="space-y-3 border-b border-gray-200 pb-3">
                      <div className="flex items-start">
                        <FaBook className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Materias Postuladas:</p>
                          <div className="max-h-24 overflow-y-auto pr-1">
                            {asignaturas && asignaturas.length > 0 ? (
                              <ul className="list-disc pl-4 space-y-1">
                                {asignaturas.map((item, idx) => (
                                  <li key={idx} className="text-sm">
                                    <span className="font-medium">
                                      {item.asignatura ? toTitleCase(item.asignatura) : ""}
                                    </span>
                                    {item.carrera && (
                                      <span className="text-gray-600">
                                        {" "}
                                        ({toTitleCase(item.carrera)}
                                        {item.nivel && `, ${toTitleCase(item.nivel)}`})
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No hay materias postuladas</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaBuilding className="text-gray-500 mt-1 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Carreras:</p>
                          <div className="max-h-24 overflow-y-auto pr-1">
                            {asignaturas && asignaturas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Array.from(new Set(asignaturas.map((item) => item.carrera))).map((carrera, idx) => (
                                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {toTitleCase(carrera || "")}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No hay carreras</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => toggleRowExpansion(index)}
                        className="flex items-center justify-center w-full py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                      >
                        {expandedRows[index] ? (
                          <>
                            <FaEyeSlash className="mr-2" /> Ocultar Documentos
                          </>
                        ) : (
                          <>
                            <FaEye className="mr-2" /> Ver Documentos
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(postulacion._id)}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center justify-center"
                      >
                        <FaTrash className="mr-2" /> Eliminar
                      </button>
                    </div>

                    {/* Documentos expandibles */}
                    {expandedRows[index] && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-2">Documentación:</h4>
                        <DocumentosDetalle documentos={postulacion.documentos} baseURL={baseURL} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default Postulaciones
