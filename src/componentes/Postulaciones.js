"use client"

import React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import Swal from "sweetalert2"
import {
  FaFileAlt,
  FaDownload,
  FaTrashAlt,
  FaSearch,
  FaSpinner,
  FaExclamationCircle,
  FaEye,
  FaEyeOff,
} from "react-icons/fa"

// Función para convertir un string a formato título
const toTitleCase = (str) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
      {documentosList.map((doc, idx) => (
        <div
          key={idx}
          className="flex items-center border border-gray-200 p-3 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <FaFileAlt className="text-blue-500 mr-3 h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-gray-700 block truncate">{doc.label}:</span>
            {documentos && documentos[doc.key] ? (
              <a
                href={`${baseURL}/uploads/${getFileName(documentos[doc.key])}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline block truncate"
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

function Postulaciones() {
  const [postulaciones, setPostulaciones] = useState([])
  const [error, setError] = useState(null)
  const [expandedRows, setExpandedRows] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Determinar la URL base dependiendo del entorno
  const baseURL =
    process.env.NODE_ENV === "development"
      ? "http://localhost:5000"
      : process.env.REACT_APP_urlback || "https://tu-url-de-produccion.com" // Asegúrate de configurar esta variable

  useEffect(() => {
    const fetchPostulaciones = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Aumentar el timeout para entornos de producción
        const response = await axios.get(`${baseURL}/postulaciones`, {
          timeout: 15000, // 15 segundos
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
          } else {
            console.error("Formato de respuesta inesperado:", response.data)
            setError("El formato de respuesta del servidor no es válido")
          }
        } else {
          setError("No se recibieron datos del servidor")
        }
      } catch (error) {
        console.error("Error al obtener las postulaciones:", error)

        // Mensaje de error más detallado
        let errorMessage = "Error al obtener las postulaciones."

        if (error.response) {
          // El servidor respondió con un código de error
          errorMessage += ` Error ${error.response.status}: ${error.response.data?.message || "Error en la respuesta del servidor"}`
        } else if (error.request) {
          // No se recibió respuesta del servidor
          errorMessage += " No se recibió respuesta del servidor. Verifique su conexión a internet."
        } else {
          // Error en la configuración de la solicitud
          errorMessage += ` ${error.message}`
        }

        setError(errorMessage)

        // Implementar reintentos automáticos
        if (retryCount < MAX_RETRIES) {
          console.log(`Reintentando obtener postulaciones (${retryCount + 1}/${MAX_RETRIES})...`)
          setRetryCount((prevCount) => prevCount + 1)
          // Esperar antes de reintentar (tiempo exponencial)
          setTimeout(() => {
            fetchPostulaciones()
          }, 2000 * Math.pow(2, retryCount))
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMessage,
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostulaciones()
  }, [baseURL, retryCount])

  // Función para parsear asignaturas (ya que pueden venir como cadena JSON)
  const parseAsignaturas = (asignaturasRaw) => {
    if (!asignaturasRaw) return []
    if (Array.isArray(asignaturasRaw)) return asignaturasRaw
    try {
      return JSON.parse(asignaturasRaw)
    } catch (err) {
      console.error("Error al parsear asignaturasSeleccionadas", err)
      return []
    }
  }

  // Filtrar postulaciones por término de búsqueda
  const filteredPostulaciones = postulaciones.filter(
    (postulacion) =>
      postulacion.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postulacion.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postulacion.ci?.includes(searchTerm) ||
      postulacion.carrera?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Alterna la visualización de la sección de documentos en cada fila
  const toggleRowExpansion = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // Función para eliminar una postulación
  const handleDelete = (postulacionId) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará la postulación de forma permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${baseURL}/postulaciones/${postulacionId}`, {
            timeout: 10000,
            headers: {
              Accept: "application/json",
            },
          })
          setPostulaciones(postulaciones.filter((p) => p._id !== postulacionId))
          Swal.fire({
            icon: "success",
            title: "Eliminado",
            text: "Postulación eliminada exitosamente.",
          })
        } catch (error) {
          console.error("Error al eliminar la postulación:", error)
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo eliminar la postulación. Intente nuevamente.",
          })
        }
      }
    })
  }

  // Descargar registros en Excel
  const handleDownloadExcel = () => {
    if (filteredPostulaciones.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin datos",
        text: "No hay postulaciones para descargar.",
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredPostulaciones.map((postulacion) => ({
        "Nombre Completo": postulacion.nombre,
        "Correo Electrónico": postulacion.correo,
        "Número de Celular": postulacion.celular,
        "Carnet de Identidad": postulacion.ci,
        "Universidad CEUB": postulacion.universidad,
        "Año de Titulación": postulacion.anioTitulacion,
        Profesión: postulacion.profesion,
        "Tipo de Docente": postulacion.tipoDocente,
        Asignaturas: formatAsignaturas(postulacion.asignaturasSeleccionadas),
        Documentos: formatDocumentosForExcel(postulacion.documentos),
      })),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Postulaciones")
    XLSX.writeFile(workbook, "Postulaciones.xlsx")
  }

  // Renderizar estado de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg">
        <FaSpinner className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg text-gray-700">Cargando postulaciones...</p>
      </div>
    )
  }

  // Renderizar estado de error (si no hay reintentos pendientes)
  if (error && retryCount >= MAX_RETRIES) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg">
        <FaExclamationCircle className="h-12 w-12 text-red-600 mb-4" />
        <h3 className="text-xl font-bold text-red-700 mb-2">Error al cargar datos</h3>
        <p className="text-gray-700 mb-4">{error}</p>
        <button
          onClick={() => {
            setRetryCount(0)
            setError(null)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-4 md:mb-0">Postulaciones Registradas</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center"
          >
            <FaDownload className="mr-2 h-5 w-5" />
            Descargar Excel
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, correo, CI o carrera"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {filteredPostulaciones.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <p className="text-gray-600 text-lg">No hay postulaciones registradas que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <>
          {/* Vista en tabla para pantallas medianas y superiores */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left">Nombre Completo</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Correo</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Celular</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">C.I.</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Universidad</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Profesión</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Tipo Docente</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Materias Postuladas</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Documentos</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPostulaciones.map((postulacion, index) => {
                  // Convertir asignaturasSeleccionadas a arreglo si es cadena
                  const asignaturas = parseAsignaturas(postulacion.asignaturasSeleccionadas)
                  return (
                    <React.Fragment key={postulacion._id || index}>
                      <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-300 px-4 py-3">{postulacion.nombre}</td>
                        <td className="border border-gray-300 px-4 py-3">{postulacion.correo}</td>
                        <td className="border border-gray-300 px-4 py-3">{postulacion.celular}</td>
                        <td className="border border-gray-300 px-4 py-3">{postulacion.ci}</td>
                        <td className="border border-gray-300 px-4 py-3">{postulacion.universidad}</td>
                        <td className="border border-gray-300 px-4 py-3">{postulacion.profesion}</td>
                        <td className="border border-gray-300 px-4 py-3">{postulacion.tipoDocente}</td>
                        <td className="border border-gray-300 px-4 py-3">
                          {asignaturas.map((item) => (item.asignatura ? toTitleCase(item.asignatura) : "")).join(" | ")}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <button
                            onClick={() => toggleRowExpansion(index)}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            {expandedRows[index] ? (
                              <>
                                <FaEyeOff className="h-4 w-4 mr-1" /> Ocultar
                              </>
                            ) : (
                              <>
                                <FaEye className="h-4 w-4 mr-1" /> Ver
                              </>
                            )}
                          </button>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(postulacion._id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center mx-auto"
                          >
                            <FaTrashAlt className="h-4 w-4 mr-1" /> Eliminar
                          </button>
                        </td>
                      </tr>
                      {expandedRows[index] && (
                        <tr>
                          <td colSpan="10" className="border border-gray-300 p-0">
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

          {/* Vista en tarjetas para pantallas pequeñas */}
          <div className="block md:hidden space-y-6">
            {filteredPostulaciones.map((postulacion, index) => {
              const asignaturas = parseAsignaturas(postulacion.asignaturasSeleccionadas)
              return (
                <div key={postulacion._id || index} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                    <h3 className="text-xl font-bold text-gray-800">{postulacion.nombre}</h3>
                    <p className="text-blue-600">{postulacion.correo}</p>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Celular</p>
                        <p className="font-medium">{postulacion.celular}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">C.I.</p>
                        <p className="font-medium">{postulacion.ci}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Universidad</p>
                        <p className="font-medium">{postulacion.universidad}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tipo Docente</p>
                        <p className="font-medium">{postulacion.tipoDocente}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Profesión</p>
                      <p className="font-medium">{postulacion.profesion}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Materias Postuladas</p>
                      <p className="font-medium">
                        {asignaturas.map((item) => (item.asignatura ? toTitleCase(item.asignatura) : "")).join(", ")}
                      </p>
                    </div>

                    <div className="pt-3 flex justify-between items-center">
                      <button onClick={() => toggleRowExpansion(index)} className="text-blue-600 flex items-center">
                        {expandedRows[index] ? (
                          <>
                            <FaEyeOff className="h-4 w-4 mr-1" /> Ocultar documentos
                          </>
                        ) : (
                          <>
                            <FaEye className="h-4 w-4 mr-1" /> Ver documentos
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(postulacion._id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center"
                      >
                        <FaTrashAlt className="h-4 w-4 mr-1" /> Eliminar
                      </button>
                    </div>

                    {expandedRows[index] && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
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
