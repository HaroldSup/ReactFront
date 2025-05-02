"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import swal from "sweetalert"
import { FaFileAlt, FaEye, FaTrash, FaDownload, FaSpinner, FaExclamationTriangle, FaSearch } from "react-icons/fa"

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

// Función para formatear cada asignatura con su carrera y nivel
// Formato: Nombre (Carrera, Nivel)
const formatMateriaConCarrera = (asignaturas) => {
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

// Componente para mostrar los documentos en tarjetas (1 columna en móvil, 2 en desktop)
const DocumentosDetalle = ({ documentos, baseURL }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
      {documentosList.map((doc, idx) => (
        <div key={idx} className="flex items-start border border-gray-200 p-2 rounded-md">
          <FaFileAlt className="text-blue-500 mr-2 mt-1 flex-shrink-0" size={16} />
          <div className="flex-grow">
            <span className="font-bold text-sm block">{doc.label}:</span>
            {documentos && documentos[doc.key] ? (
              <a
                href={`${baseURL}/uploads/${getFileName(documentos[doc.key])}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline block text-sm break-all"
              >
                {getFileName(documentos[doc.key])}
              </a>
            ) : (
              <span className="text-gray-500 block text-sm">Sin Archivos</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Función para parsear asignaturas (pueden venir como cadena JSON)
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

function Postulacionesporcarrera() {
  const [postulaciones, setPostulaciones] = useState([])
  const [error, setError] = useState(null)
  const [filterCareer, setFilterCareer] = useState("")
  const [expandedRows, setExpandedRows] = useState({})
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  // URL dinámica basada en el entorno
  const baseURL =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_urlback || window.location.origin
      : "http://localhost:5000"

  // Función para obtener postulaciones con reintentos exponenciales
  const fetchPostulaciones = async (retry = 0) => {
    setLoading(true)
    setError(null)

    try {
      // Aumentamos el timeout para producción
      const timeout = process.env.NODE_ENV === "production" ? 15000 : 5000

      const response = await axios.get(`${baseURL}/postulaciones`, {
        timeout,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      setPostulaciones(response.data.data || [])
      setLoading(false)
    } catch (error) {
      console.error("Error al obtener las postulaciones:", error)

      // Si hay un error y no hemos excedido los reintentos máximos
      if (retry < 3) {
        const nextRetry = retry + 1
        const delay = Math.pow(2, nextRetry) * 1000 // Backoff exponencial: 2s, 4s, 8s

        setError(`Error al cargar datos. Reintentando en ${delay / 1000} segundos...`)
        setRetryCount(nextRetry)

        setTimeout(() => {
          fetchPostulaciones(nextRetry)
        }, delay)
      } else {
        setError("No se pudieron cargar las postulaciones. Por favor, intenta nuevamente más tarde.")
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchPostulaciones()
  }, [])

  // Para cada postulante, filtramos las materias que coincidan con el filtro ingresado
  const filteredPostulaciones = postulaciones
    .filter(
      (postulacion) =>
        searchTerm === "" ||
        postulacion.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        postulacion.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        postulacion.ci?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .map((postulacion) => {
      const materias = parseAsignaturas(postulacion.asignaturasSeleccionadas)
      const materiasFiltradas =
        filterCareer.trim() === ""
          ? materias
          : materias.filter((mat) => mat.carrera && mat.carrera.toLowerCase().includes(filterCareer.toLowerCase()))
      return { ...postulacion, materiasFiltradas }
    })
    .filter((postulacion) => postulacion.materiasFiltradas && postulacion.materiasFiltradas.length > 0)

  const toggleRowExpansion = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleDelete = (postulacionId) => {
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
          setPostulaciones(postulaciones.filter((p) => p._id !== postulacionId))
          swal("Postulación eliminada exitosamente.", { icon: "success" })
        } catch (error) {
          console.error("Error al eliminar la postulación:", error)
          swal("Error al eliminar la postulación.", { icon: "error" })
        }
      }
    })
  }

  // Descargar solo las postulaciones filtradas a Excel
  const handleDownloadExcel = () => {
    if (filteredPostulaciones.length === 0) {
      swal("No hay datos", "No hay postulaciones para descargar.", "info")
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
        Carrera: postulacion.carrera,
        Profesión: postulacion.profesion,
        "Tipo de Docente": postulacion.tipoDocente,
        // Usamos nuestra función formateadora para las materias filtradas
        Asignaturas: formatMateriaConCarrera(postulacion.materiasFiltradas),
        Documentos: formatDocumentosForExcel(postulacion.documentos),
      })),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Postulaciones")
    XLSX.writeFile(workbook, "Postulaciones.xlsx")
  }

  // Obtenemos un listado único de carreras a partir de todas las materias postuladas
  const uniqueCarreras = Array.from(
    new Set(
      postulaciones.reduce((acc, postulacion) => {
        const materias = parseAsignaturas(postulacion.asignaturasSeleccionadas)
        return acc.concat(materias.map((mat) => mat.carrera))
      }, []),
    ),
  ).filter(Boolean)

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      {/* Encabezado con filtro y botón de descarga */}
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold text-blue-800 mb-2 md:mb-0">Postulaciones por Carrera</h2>
          <button
            onClick={handleDownloadExcel}
            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center justify-center"
            disabled={loading || filteredPostulaciones.length === 0}
          >
            <FaDownload className="mr-2" /> Descargar Excel
          </button>
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o CI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border rounded-md w-full"
            />
          </div>
          <div className="relative flex-grow">
            <select
              value={filterCareer}
              onChange={(e) => setFilterCareer(e.target.value)}
              className="px-3 py-2 border rounded-md w-full appearance-none"
            >
              <option value="">Todas las carreras</option>
              {uniqueCarreras.map((carrera, idx) => (
                <option key={idx} value={carrera}>
                  {toTitleCase(carrera)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estado de carga y errores */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <FaSpinner className="animate-spin text-blue-500 mr-2" size={24} />
          <span>Cargando postulaciones...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 flex items-start">
          <FaExclamationTriangle className="text-red-500 mr-2 mt-1" />
          <div className="flex-grow">
            <p>{error}</p>
            {retryCount >= 3 && (
              <button
                onClick={() => fetchPostulaciones()}
                className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition"
              >
                Intentar nuevamente
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && !error && filteredPostulaciones.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay postulaciones que coincidan con los criterios de búsqueda.</p>
        </div>
      )}

      {!loading && !error && filteredPostulaciones.length > 0 && (
        <>
          {/* Vista en tabla para pantallas medianas y superiores */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Nombre Completo</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Correo</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Celular</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">C.I.</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Universidad</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Año Titulación</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Profesión</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Tipo Docente</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Materias</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Documentos</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPostulaciones.map((postulacion, index) => (
                  <React.Fragment key={postulacion._id || index}>
                    <tr className="hover:bg-gray-50 odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3">{postulacion.nombre}</td>
                      <td className="border border-gray-300 px-4 py-3 break-all">{postulacion.correo}</td>
                      <td className="border border-gray-300 px-4 py-3">{postulacion.celular}</td>
                      <td className="border border-gray-300 px-4 py-3">{postulacion.ci}</td>
                      <td className="border border-gray-300 px-4 py-3">{postulacion.universidad}</td>
                      <td className="border border-gray-300 px-4 py-3">{postulacion.anioTitulacion}</td>
                      <td className="border border-gray-300 px-4 py-3">{postulacion.profesion}</td>
                      <td className="border border-gray-300 px-4 py-3">{postulacion.tipoDocente}</td>
                      <td className="border border-gray-300 px-4 py-3">
                        {postulacion.materiasFiltradas && postulacion.materiasFiltradas.length > 0 ? (
                          <div className="max-h-32 overflow-y-auto">
                            {postulacion.materiasFiltradas.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-blue-100 text-blue-800 px-2 py-1 mr-2 mb-1 rounded-full text-xs font-semibold"
                              >
                                {toTitleCase(item.asignatura)} ({toTitleCase(item.carrera)}, {toTitleCase(item.nivel)})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <button
                          onClick={() => toggleRowExpansion(index)}
                          className="flex items-center text-blue-500 hover:text-blue-700 text-sm"
                        >
                          <FaEye className="mr-1" /> {expandedRows[index] ? "Ocultar" : "Ver"}
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <button
                          onClick={() => handleDelete(postulacion._id)}
                          className="flex items-center px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                        >
                          <FaTrash className="mr-1" /> Eliminar
                        </button>
                      </td>
                    </tr>
                    {expandedRows[index] && (
                      <tr>
                        <td colSpan="11" className="border border-gray-300">
                          <DocumentosDetalle documentos={postulacion.documentos} baseURL={baseURL} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista en tarjetas para pantallas pequeñas */}
          <div className="block md:hidden space-y-4">
            {filteredPostulaciones.map((postulacion, index) => (
              <div key={postulacion._id || index} className="border border-gray-300 rounded-lg p-4 shadow-sm">
                <div className="mb-3 pb-2 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 text-lg">{postulacion.nombre}</h3>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-y-2">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Correo:</p>
                      <p className="break-all">{postulacion.correo}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Celular:</p>
                      <p>{postulacion.celular}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 text-sm font-semibold">C.I.:</p>
                      <p>{postulacion.ci}</p>
                    </div>

                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Universidad:</p>
                      <p>{postulacion.universidad}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-600 text-sm font-semibold">Año Titulación:</p>
                        <p>{postulacion.anioTitulacion}</p>
                      </div>

                      <div>
                        <p className="text-gray-600 text-sm font-semibold">Tipo Docente:</p>
                        <p>{postulacion.tipoDocente}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Profesión:</p>
                      <p>{postulacion.profesion}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-gray-600 text-sm font-semibold mb-1">Materias Postuladas:</p>
                    {postulacion.materiasFiltradas && postulacion.materiasFiltradas.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {postulacion.materiasFiltradas.map((item, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">{toTitleCase(item.asignatura)}</span>
                            <div className="text-xs text-gray-600">
                              {toTitleCase(item.carrera)}, {toTitleCase(item.nivel)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500 text-sm">N/A</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col space-y-2">
                  <button
                    onClick={() => toggleRowExpansion(index)}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center justify-center"
                  >
                    <FaEye className="mr-2" /> {expandedRows[index] ? "Ocultar Documentos" : "Ver Documentos"}
                  </button>

                  {expandedRows[index] && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <DocumentosDetalle documentos={postulacion.documentos} baseURL={baseURL} />
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(postulacion._id)}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition flex items-center justify-center"
                  >
                    <FaTrash className="mr-2" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Postulacionesporcarrera
