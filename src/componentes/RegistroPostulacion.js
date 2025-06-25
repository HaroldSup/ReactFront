"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Building,
  Calendar,
  Briefcase,
  GraduationCap,
  BookOpen,
  FileUp,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Save,
  Eye,
  Trash2,
  Info,
  X,
  List,
  Download,
  FolderOpen,
} from "lucide-react"

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

// Lista de documentos
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

// Lista de guías de postulación disponibles para descarga
const guiasPostulacion = [
  {
    nombre: "Carta Docente Nuevo - Licenciatura",
    archivo: "1. CARTA DOCENTE NUEVO - LICENCIATURA.docx",
    descripcion: "Carta de postulación para docente nuevo en carreras de Licenciatura",
  },
  {
    nombre: "Carta Docente Nuevo - Tecnológico",
    archivo: "2. CARTA DOCENTE NUEVO - TECNOLÓGICO.docx",
    descripcion: "Carta de postulación para docente nuevo en carreras Tecnológicas",
  },
  {
    nombre: "Carta Docente Nuevo - Materia Militar",
    archivo: "3. CARTA DOCENTE NUEVO - MATERIA MILITAR.docx",
    descripcion: "Carta de postulación para docente nuevo en Materia Militar",
  },
  {
    nombre: "Carta Docente Antiguo - Licenciatura",
    archivo: "4. CARTA DOCENTE ANTIGUO - LICENCIATURA.docx",
    descripcion: "Carta de postulación para docente antiguo en carreras de Licenciatura",
  },
  {
    nombre: "Carta Docente Antiguo - Tecnológico",
    archivo: "5. CARTA DOCENTE ANTIGUO - TECNOLÓGICO.docx",
    descripcion: "Carta de postulación para docente antiguo en carreras Tecnológicas",
  },
  {
    nombre: "Carta Docente Antiguo - Materia Militar",
    archivo: "6. CARTA DOCENTE ANTIGUO - MATERIA MILITAR.docx",
    descripcion: "Carta de postulación para docente antiguo en Materia Militar",
  },
  {
    nombre: "Modelo de Hoja de Vida - Docente Nuevo",
    archivo: "MODELO DE HOJA DE VIDA - DOCENTE NUEVO.xlsx",
    descripcion: "Formato oficial en Excel para la hoja de vida de docentes nuevos",
  },
]

const allowedTypes = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

// Opciones de carreras - actualizada para incluir todas las carreras
const carrerasList = [
  "Ciencias Básicas",
  "Materia Militar",
  "Ingeniería de Sistemas",
  "Ingeniería en Sistemas Electrónicos",
  "Ingeniería Agroindustrial",
  "Ingeniería Civil",
  "Ingeniería Comercial",
  "Diseño Gráfico y Comunicación Audiovisual",
  "Sistemas Electrónicos",
  "Energías Renovables",
  "Construcción Civil",
  "Informática",
]

// Componente para mostrar errores de validación
const ValidationError = ({ message }) => {
  if (!message) return null
  return (
    <div className="flex items-center mt-1 text-red-600 text-xs">
      <AlertCircle className="h-3 w-3 mr-1" />
      <span>{message}</span>
    </div>
  )
}

// Componente para mostrar tooltip de ayuda
const InfoTooltip = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsVisible(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative inline-block ml-1" ref={tooltipRef}>
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="text-blue-500 hover:text-blue-700 focus:outline-none"
        aria-label="Información adicional"
      >
        <Info className="h-4 w-4" />
      </button>
      {isVisible && (
        <div className="absolute z-10 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-xs text-gray-700 right-0 mt-1">
          <button
            type="button"
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
            onClick={() => setIsVisible(false)}
            aria-label="Cerrar"
          >
            <X className="h-3 w-3" />
          </button>
          {text}
        </div>
      )}
    </div>
  )
}

// Componente para las guías de postulación
const GuiasPostulacion = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg shadow-sm">
        <div className="p-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center">
              <FolderOpen className="h-5 w-5 text-green-700 mr-2" />
              <h3 className="text-lg font-semibold text-green-800">Guías de Postulación</h3>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-green-600 mr-2">{isExpanded ? "Ocultar" : "Ver guías"}</span>
              <div className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-green-700 mb-3">
                Descarga las guías oficiales para completar tu postulación correctamente:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {guiasPostulacion.map((guia, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate">{guia.nombre}</h4>
                        <p className="text-xs text-gray-600 mt-1">{guia.descripcion}</p>
                      </div>
                      <a
                        href={`/guias/${guia.archivo}`}
                        download={guia.archivo}
                        className="ml-2 flex-shrink-0 inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                        title={`Descargar ${guia.nombre}`}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Descargar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                <p className="text-xs text-green-700">
                  <Info className="h-3 w-3 inline mr-1" />
                  Recomendamos revisar todas las guías antes de completar el formulario de postulación.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Esquema inicial para el formulario
const initialFormData = {
  nombre: "",
  correo: "",
  celular: "",
  ci: "",
  universidad: "",
  profesion: "",
  anioTitulacion: "",
  carrera: "",
  tipoDocente: "",
  documentos: {},
  asignaturasSeleccionadas: [],
}

function RegistroPostulacion() {
  // Estado principal del formulario
  const [formData, setFormData] = useState(initialFormData)

  // Estado para manejar CIs ya registrados (validación frontend)
  const [registeredCIs, setRegisteredCIs] = useState(new Set())

  // Estado para nueva asignatura
  const [nuevaAsignatura, setNuevaAsignatura] = useState({
    asignatura: "",
    nivel: "Grado",
  })

  // Estado para almacenar las materias registradas en la base de datos
  const [materias, setMaterias] = useState([])
  const [materiasError, setMateriasError] = useState(null)
  const [isLoadingMaterias, setIsLoadingMaterias] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Estado para mostrar los requisitos de la asignatura seleccionada
  const [requisitosActuales, setRequisitosActuales] = useState("")

  // Estados para controlar el proceso de envío y verificación
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastOperationId, setLastOperationId] = useState(null)

  // Estado para guardar borrador
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [hasSavedDraft, setHasSavedDraft] = useState(false)

  // Estado para validaciones en tiempo real
  const [validationErrors, setValidationErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})

  // Estado para mostrar vista previa
  const [showPreview, setShowPreview] = useState(false)

  // URL base para las peticiones
  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Expresiones regulares para validaciones
  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
  const soloNumeros = /^[0-9]+$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Función para mostrar alertas con SweetAlert2
  const showAlert = useCallback((icon, title, text, callback = null) => {
    return Swal.fire({
      icon,
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    }).then((result) => {
      if (callback && result.isConfirmed) {
        callback()
      }
      return result
    })
  }, [])

  // Función para generar un ID único para la operación
  const generateOperationId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5)
  }, [])

  // Función para cargar CIs registrados desde localStorage
  const loadRegisteredCIs = useCallback(() => {
    try {
      const storedCIs = localStorage.getItem("registeredCIs")
      if (storedCIs) {
        const parsedCIs = JSON.parse(storedCIs)
        setRegisteredCIs(new Set(parsedCIs))
      }
    } catch (error) {
      console.error("Error al cargar CIs registrados:", error)
    }
  }, [])

  // Función para guardar CI en localStorage
  const saveRegisteredCI = useCallback((ci) => {
    try {
      const currentCIs = JSON.parse(localStorage.getItem("registeredCIs") || "[]")
      const updatedCIs = [...new Set([...currentCIs, ci])]
      localStorage.setItem("registeredCIs", JSON.stringify(updatedCIs))
      setRegisteredCIs(new Set(updatedCIs))
    } catch (error) {
      console.error("Error al guardar CI registrado:", error)
    }
  }, [])

  // Función para verificar si un CI ya está registrado
  const isCIRegistered = useCallback(
    (ci) => {
      return registeredCIs.has(ci.trim())
    },
    [registeredCIs],
  )

  // Función para verificar si una postulación ya existe
  const verificarPostulacion = useCallback(
    async (dataToVerify) => {
      try {
        setIsVerifying(true)

        // Datos mínimos necesarios para verificar
        const verificacionData = {
          ci: dataToVerify.ci,
          nombre: dataToVerify.nombre,
        }

        console.log("Verificando postulación:", verificacionData)

        // Intentar verificar directamente con un endpoint específico
        try {
          const verificacionResponse = await axios({
            method: "post",
            url: `${baseURL}/postulaciones/verificar`,
            data: verificacionData,
            timeout: 15000, // 15 segundos de timeout
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })

          console.log("Respuesta de verificación:", verificacionResponse.data)
          return verificacionResponse.data.exists
        } catch (error) {
          console.error("Error en verificación directa:", error)

          // Si falla la verificación directa, intentar obtener todas las postulaciones
          try {
            const allPostulacionesResponse = await axios.get(`${baseURL}/postulaciones`, {
              timeout: 15000,
              headers: {
                Accept: "application/json",
              },
            })

            // Manejar diferentes estructuras de respuesta
            const allPostulaciones = allPostulacionesResponse.data.data || allPostulacionesResponse.data

            if (Array.isArray(allPostulaciones)) {
              // Buscar coincidencia manual por CI y nombre
              const found = allPostulaciones.some(
                (postulacion) =>
                  postulacion.ci === dataToVerify.ci &&
                  postulacion.nombre.toLowerCase().includes(dataToVerify.nombre.toLowerCase()),
              )

              console.log("Verificación alternativa:", found)
              return found
            } else {
              console.error("Formato de respuesta inesperado:", allPostulacionesResponse.data)
              return false
            }
          } catch (secondError) {
            console.error("Error en verificación alternativa:", secondError)
            return false
          }
        }
      } catch (error) {
        console.error("Error al verificar postulación:", error)
        return false
      } finally {
        setIsVerifying(false)
      }
    },
    [baseURL],
  )

  // Cargar borrador guardado al iniciar
  useEffect(() => {
    const loadDraft = () => {
      try {
        const savedDraft = localStorage.getItem("postulacionDraft")
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft)
          // No cargar documentos desde localStorage ya que son objetos File
          const { documentos, ...restDraft } = parsedDraft
          setFormData((prev) => ({ ...prev, ...restDraft }))
          setHasSavedDraft(true)
        }
      } catch (error) {
        console.error("Error al cargar borrador:", error)
      }
    }

    loadDraft()
  }, [])

  // Cargar CIs registrados al iniciar
  useEffect(() => {
    loadRegisteredCIs()
  }, [loadRegisteredCIs])

  // useEffect para obtener las materias desde el backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingMaterias(true)
      setMateriasError(null)

      try {
        // Obtener materias
        const materiasResponse = await axios.get(`${baseURL}/materias`, {
          timeout: 15000,
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        })

        if (materiasResponse.data && Array.isArray(materiasResponse.data)) {
          setMaterias(materiasResponse.data)
        } else {
          console.error("Formato de respuesta inesperado:", materiasResponse.data)
          setMateriasError("El formato de respuesta del servidor no es válido")
        }

        // Obtener postulaciones existentes para sincronizar CIs
        try {
          const postulacionesResponse = await axios.get(`${baseURL}/postulaciones`, {
            timeout: 15000,
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache",
            },
          })

          const postulacionesData = postulacionesResponse.data.data || postulacionesResponse.data

          if (Array.isArray(postulacionesData)) {
            // Extraer todos los CIs existentes
            const existingCIs = postulacionesData
              .map((postulacion) => postulacion.ci)
              .filter((ci) => ci && ci.trim()) // Filtrar CIs vacíos o nulos
              .map((ci) => ci.trim())

            // Sincronizar con localStorage
            const currentStoredCIs = JSON.parse(localStorage.getItem("registeredCIs") || "[]")
            const allCIs = [...new Set([...currentStoredCIs, ...existingCIs])]

            localStorage.setItem("registeredCIs", JSON.stringify(allCIs))
            setRegisteredCIs(new Set(allCIs))

            console.log(`Sincronizados ${existingCIs.length} CIs existentes desde el servidor`)
          }
        } catch (postulacionesError) {
          console.warn("No se pudieron obtener las postulaciones existentes para sincronizar CIs:", postulacionesError)
          // No es un error crítico, continuar con la carga normal
        }
      } catch (error) {
        console.error("Error al obtener datos:", error)

        let errorMessage = "No se pudieron obtener las materias."

        if (error.response) {
          errorMessage += ` Error ${error.response.status}: ${error.response.data?.message || "Error en la respuesta del servidor"}`
        } else if (error.request) {
          errorMessage += " No se recibió respuesta del servidor. Verifique su conexión a internet."
        } else {
          errorMessage += ` ${error.message}`
        }

        setMateriasError(errorMessage)

        if (retryCount < MAX_RETRIES) {
          console.log(`Reintentando obtener datos (${retryCount + 1}/${MAX_RETRIES})...`)
          setRetryCount((prevCount) => prevCount + 1)
          setTimeout(() => {
            fetchData()
          }, 2000 * Math.pow(2, retryCount))
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMessage,
          })
        }
      } finally {
        setIsLoadingMaterias(false)
      }
    }

    fetchData()
  }, [baseURL, retryCount])

  // Función para obtener los requisitos de una asignatura
  const obtenerRequisitos = useCallback(
    (asignatura, carrera) => {
      if (!asignatura || !carrera || materias.length === 0) {
        return ""
      }

      const materiaEncontrada = materias.find(
        (materia) => materia.asignatura === asignatura && materia.carrera === carrera,
      )

      return materiaEncontrada?.requisitos || ""
    },
    [materias],
  )

  // Actualizar requisitos cuando cambia la asignatura seleccionada
  useEffect(() => {
    const requisitos = obtenerRequisitos(nuevaAsignatura.asignatura, formData.carrera)
    setRequisitosActuales(requisitos)
  }, [nuevaAsignatura.asignatura, formData.carrera, obtenerRequisitos])

  // Validar campo individual
  const validateField = useCallback(
    (name, value) => {
      let error = ""

      switch (name) {
        case "nombre":
          if (!value.trim()) {
            error = "El nombre es obligatorio"
          } else if (!soloLetras.test(value.trim())) {
            error = "El nombre debe contener solo letras"
          }
          break
        case "correo":
          if (!value.trim()) {
            error = "El correo es obligatorio"
          } else if (!emailRegex.test(value.trim())) {
            error = "El correo electrónico no es válido"
          }
          break
        case "celular":
          if (!value.trim()) {
            error = "El celular es obligatorio"
          } else if (!soloNumeros.test(value.trim())) {
            error = "El celular debe contener solo números"
          } else if (value.trim().length < 8) {
            error = "El celular debe tener al menos 8 dígitos"
          }
          break
        case "ci":
          if (!value.trim()) {
            error = "El CI es obligatorio"
          } else if (!soloNumeros.test(value.trim())) {
            error = "El CI debe contener solo números"
          } else if (isCIRegistered(value.trim())) {
            error = "Este carnet de identidad ya está registrado"
          }
          break
        case "universidad":
          if (!value.trim()) {
            error = "La universidad es obligatoria"
          } else if (!soloLetras.test(value.trim())) {
            error = "La universidad debe contener solo letras"
          }
          break
        case "profesion":
          if (!value.trim()) {
            error = "La profesión es obligatoria"
          } else if (!soloLetras.test(value.trim())) {
            error = "La profesión debe contener solo letras"
          }
          break
        case "anioTitulacion":
          if (!value.trim()) {
            error = "El año de titulación es obligatorio"
          } else if (!soloNumeros.test(value.trim())) {
            error = "El año debe contener solo números"
          } else {
            const year = Number.parseInt(value.trim())
            const currentYear = new Date().getFullYear()
            if (year < 1950 || year > currentYear) {
              error = `El año debe estar entre 1950 y ${currentYear}`
            }
          }
          break
        case "carrera":
          if (!value.trim()) {
            error = "La carrera es obligatoria"
          }
          break
        case "tipoDocente":
          if (!value.trim()) {
            error = "El tipo de docente es obligatorio"
          }
          break
        default:
          break
      }

      return error
    },
    [soloLetras, soloNumeros, emailRegex, isCIRegistered],
  )

  // Actualizar validaciones cuando cambia un campo
  useEffect(() => {
    const newErrors = {}

    // Solo validar campos que han sido tocados
    Object.keys(touchedFields).forEach((fieldName) => {
      if (touchedFields[fieldName]) {
        const value = formData[fieldName]
        newErrors[fieldName] = validateField(fieldName, value)
      }
    })

    setValidationErrors(newErrors)
  }, [formData, touchedFields, validateField])

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target

    // Marcar el campo como tocado
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }))

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === "carrera") {
      setNuevaAsignatura({
        asignatura: "",
        nivel: "Grado",
      })
      setRequisitosActuales("")
    }
  }

  // Manejar cambios en los archivos
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (
        !allowedTypes.includes(file.type) &&
        !file.name.toLowerCase().endsWith(".pdf") &&
        !file.name.toLowerCase().endsWith(".xls") &&
        !file.name.toLowerCase().endsWith(".xlsx")
      ) {
        Swal.fire({
          icon: "error",
          title: "Formato no permitido",
          text: "Solo se permiten archivos PDF y Excel.",
        })
        e.target.value = ""
        return
      }
      setFormData((prev) => ({
        ...prev,
        documentos: {
          ...prev.documentos,
          [e.target.name]: file,
        },
      }))
    }
  }

  // Manejar cambios en la nueva asignatura
  const handleNewSubjectChange = (e) => {
    const { name, value } = e.target
    setNuevaAsignatura((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Agregar asignatura a la lista
  const addAsignatura = () => {
    if (!nuevaAsignatura.asignatura.trim()) {
      return Swal.fire({
        icon: "error",
        title: "Campo incompleto",
        text: "Por favor, seleccione una asignatura.",
      })
    }
    /* ELIMINAR VALIDACION DE MAXIMO DE MATERIAS
    if (formData.asignaturasSeleccionadas.length >= 3) {
      return Swal.fire({
        icon: "error",
        title: "Máximo alcanzado",
        text: "Solo se pueden registrar máximo 3 materias.",
      })
    }
    */

    // Obtener los requisitos de la asignatura seleccionada
    const requisitos = obtenerRequisitos(nuevaAsignatura.asignatura, formData.carrera)

    // Se crea un nuevo objeto que incluye la carrera actual y los requisitos
    const nuevaAsignaturaConCarrera = {
      ...nuevaAsignatura,
      carrera: formData.carrera,
      requisitos: requisitos,
    }

    setFormData((prev) => ({
      ...prev,
      asignaturasSeleccionadas: [...prev.asignaturasSeleccionadas, nuevaAsignaturaConCarrera],
    }))

    Swal.fire({
      icon: "success",
      title: "Asignatura agregada",
      text: "La materia fue agregada correctamente.",
    })

    setNuevaAsignatura({
      asignatura: "",
      nivel: "Grado",
    })

    setRequisitosActuales("")
  }

  // Eliminar asignatura de la lista
  const removeAsignatura = (index) => {
    Swal.fire({
      title: "¿Eliminar asignatura?",
      text: "¿Está seguro de eliminar esta asignatura?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData((prev) => ({
          ...prev,
          asignaturasSeleccionadas: prev.asignaturasSeleccionadas.filter((_, i) => i !== index),
        }))
      }
    })
  }

  // Guardar borrador del formulario
  const saveDraft = () => {
    try {
      setIsSavingDraft(true)

      // No guardar los documentos en localStorage ya que son objetos File
      const { documentos, ...draftData } = formData
      localStorage.setItem("postulacionDraft", JSON.stringify(draftData))

      setTimeout(() => {
        setIsSavingDraft(false)
        setHasSavedDraft(true)
        Swal.fire({
          icon: "success",
          title: "Borrador guardado",
          text: "Los datos del formulario se han guardado localmente en su navegador.",
          timer: 2000,
          timerProgressBar: true,
        })
      }, 500)
    } catch (error) {
      console.error("Error al guardar borrador:", error)
      setIsSavingDraft(false)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el borrador. Intente nuevamente.",
      })
    }
  }

  // Eliminar borrador guardado
  const deleteDraft = () => {
    Swal.fire({
      title: "¿Eliminar borrador?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("postulacionDraft")
        setFormData(initialFormData)
        setHasSavedDraft(false)
        Swal.fire({
          icon: "success",
          title: "Borrador eliminado",
          text: "Se ha eliminado el borrador guardado.",
          timer: 2000,
          timerProgressBar: true,
        })
      }
    })
  }

  // Validar todo el formulario
  const validateForm = useCallback(() => {
    const newErrors = {}
    let isValid = true

    // Validar todos los campos obligatorios
    Object.keys(formData).forEach((fieldName) => {
      if (fieldName !== "documentos" && fieldName !== "asignaturasSeleccionadas") {
        const error = validateField(fieldName, formData[fieldName])
        if (error) {
          newErrors[fieldName] = error
          isValid = false
        }
      }
    })

    // Validar asignaturas seleccionadas
    if (formData.asignaturasSeleccionadas.length === 0) {
      newErrors.asignaturas = "Debe agregar al menos una materia postulada"
      isValid = false
    }

    // Actualizar estado de errores
    setValidationErrors(newErrors)

    // Marcar todos los campos como tocados
    const allTouched = {}
    Object.keys(formData).forEach((fieldName) => {
      if (fieldName !== "documentos" && fieldName !== "asignaturasSeleccionadas") {
        allTouched[fieldName] = true
      }
    })
    setTouchedFields(allTouched)

    if (!isValid) {
      showAlert("error", "Formulario incompleto", "Por favor, complete todos los campos obligatorios correctamente.")
    }

    return isValid
  }, [formData, validateField, showAlert])

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Evitar múltiples envíos simultáneos
    if (isSubmitting || isVerifying) return

    // Validar el formulario
    if (!validateForm()) return

    // Generar un ID único para esta operación
    const operationId = generateOperationId()
    setLastOperationId(operationId)

    // Marcar como enviando
    setIsSubmitting(true)

    // Guardar los datos que se van a enviar para verificación posterior
    const dataToSubmit = { ...formData }

    // Mostrar indicador de carga
    Swal.fire({
      title: "Procesando...",
      text: "Por favor espere mientras se procesa su solicitud",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      const data = new FormData()
      data.append("nombre", formData.nombre.trim())
      data.append("correo", formData.correo.trim())
      data.append("celular", formData.celular.trim())
      data.append("ci", formData.ci.trim())
      data.append("universidad", formData.universidad.trim())
      data.append("profesion", formData.profesion.trim())
      data.append("anioTitulacion", formData.anioTitulacion.trim())
      data.append("carrera", formData.carrera.trim())
      data.append("tipoDocente", formData.tipoDocente)
      data.append("asignaturasSeleccionadas", JSON.stringify(formData.asignaturasSeleccionadas))

      documentosList.forEach((doc) => {
        if (formData.documentos[doc.key]) {
          data.append(doc.key, formData.documentos[doc.key])
        }
      })

      const response = await axios.post(`${baseURL}/postulaciones`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 45000, // 45 segundos de timeout para archivos grandes
      })

      // Cerrar el indicador de carga
      Swal.close()

      // Mostrar mensaje de éxito
      setTimeout(() => {
        showAlert(
          "success",
          "Registro exitoso",
          response.data.message || "Postulación registrada correctamente",
          () => {
            // Guardar el CI como registrado
            saveRegisteredCI(formData.ci)
            // Limpiar el formulario después del registro exitoso
            setFormData(initialFormData)
            setNuevaAsignatura({
              asignatura: "",
              nivel: "Grado",
            })
            setRequisitosActuales("")
            // Eliminar borrador si existe
            if (hasSavedDraft) {
              localStorage.removeItem("postulacionDraft")
              setHasSavedDraft(false)
            }
            // Limpiar validaciones
            setValidationErrors({})
            setTouchedFields({})
          },
        )
      }, 300)
    } catch (error) {
      console.error("Error al registrar la postulación:", error)

      // Determinar el mensaje de error apropiado
      let errorMessage = "Hubo un problema al procesar la solicitud. Inténtalo de nuevo."
      let shouldVerifyRegistration = false

      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        errorMessage = error.response?.data?.message || "Error en la respuesta del servidor."
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió respuesta - posible problema de red
        errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión a internet."
        shouldVerifyRegistration = true // Verificar si se registró a pesar del error
      } else {
        // Algo ocurrió al configurar la solicitud
        errorMessage = error.message || "Error al preparar la solicitud."
      }

      // Si es un error de conexión, verificar si los datos se guardaron
      if (shouldVerifyRegistration) {
        try {
          // Cerrar el indicador de carga actual
          Swal.close()

          // Mostrar indicador de verificación
          Swal.fire({
            title: "Verificando registro...",
            text: "Estamos verificando si la postulación fue registrada correctamente",
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            didOpen: () => {
              Swal.showLoading()
            },
          })

          // Esperar un momento antes de verificar
          await new Promise((resolve) => setTimeout(resolve, 3000))

          // Verificar si la postulación se registró a pesar del error
          const postulacionRegistrada = await verificarPostulacion(dataToSubmit)

          // Cerrar el indicador de verificación
          Swal.close()

          if (postulacionRegistrada) {
            // La postulación sí se registró a pesar del error de conexión
            setTimeout(() => {
              showAlert(
                "success",
                "¡Registrado correctamente!",
                "A pesar del error de conexión, la postulación fue registrada exitosamente.",
                () => {
                  // Guardar el CI como registrado
                  saveRegisteredCI(formData.ci)
                  // Limpiar el formulario después del registro exitoso
                  setFormData(initialFormData)
                  setNuevaAsignatura({
                    asignatura: "",
                    nivel: "Grado",
                  })
                  setRequisitosActuales("")
                  // Eliminar borrador si existe
                  if (hasSavedDraft) {
                    localStorage.removeItem("postulacionDraft")
                    setHasSavedDraft(false)
                  }
                },
              )
            }, 300)
            return
          } else {
            // Intentar una última verificación después de un tiempo adicional
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const segundaVerificacion = await verificarPostulacion(dataToSubmit)

            if (segundaVerificacion) {
              setTimeout(() => {
                showAlert(
                  "success",
                  "¡Registrado correctamente!",
                  "La postulación fue registrada exitosamente después de una verificación adicional.",
                  () => {
                    // Guardar el CI como registrado
                    saveRegisteredCI(formData.ci)
                    // Limpiar el formulario después del registro exitoso
                    setFormData(initialFormData)
                    setNuevaAsignatura({
                      asignatura: "",
                      nivel: "Grado",
                    })
                    setRequisitosActuales("")
                    // Eliminar borrador si existe
                    if (hasSavedDraft) {
                      localStorage.removeItem("postulacionDraft")
                      setHasSavedDraft(false)
                    }
                  },
                )
              }, 300)
              return
            }

            // La postulación no se registró, mostrar el error original
            setTimeout(() => {
              showAlert("error", "Error", errorMessage)
            }, 300)
          }
        } catch (verificationError) {
          console.error("Error al verificar el registro:", verificationError)
          // Continuar con el mensaje de error original
          setTimeout(() => {
            showAlert("error", "Error", errorMessage)
          }, 300)
        }
      } else {
        // Para otros tipos de errores, mostrar el error directamente
        setTimeout(() => {
          showAlert("error", "Error", errorMessage)
        }, 300)
      }
    } finally {
      // Marcar como no enviando, independientemente del resultado
      setIsSubmitting(false)
    }
  }

  // Alternar vista previa
  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  // Cálculo del porcentaje de progreso
  const personalFields = [
    "nombre",
    "correo",
    "celular",
    "ci",
    "universidad",
    "profesion",
    "anioTitulacion",
    "carrera",
    "tipoDocente",
  ]
  const filledPersonal = personalFields.filter((key) => formData[key] !== "").length
  const asignaturaFilled = formData.asignaturasSeleccionadas.length > 0 ? 1 : 0
  const documentosFilled = Object.keys(formData.documentos).length > 0 ? 1 : 0
  const totalFields = personalFields.length + 2
  const progressPercentage = Math.round(((filledPersonal + asignaturaFilled + documentosFilled) / totalFields) * 100)

  // Función para formatear requisitos como lista
  const formatRequisitos = (requisitos) => {
    if (!requisitos) return []
    return requisitos
      .split(".")
      .filter((req) => req.trim())
      .map((req) => req.trim())
  }

  // Componente de vista previa
  const FormPreview = () => {
    if (!showPreview) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Vista previa de la postulación</h3>
              <button
                type="button"
                onClick={togglePreview}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar vista previa"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Información Personal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre Completo</p>
                  <p className="font-medium">{formData.nombre || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Correo Electrónico</p>
                  <p className="font-medium">{formData.correo || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Número de Celular</p>
                  <p className="font-medium">{formData.celular || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Carnet de Identidad</p>
                  <p className="font-medium">{formData.ci || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Universidad del CEUB</p>
                  <p className="font-medium">{formData.universidad || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Año de Titulación</p>
                  <p className="font-medium">{formData.anioTitulacion || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profesión</p>
                  <p className="font-medium">{formData.profesion || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo de Docente</p>
                  <p className="font-medium">{formData.tipoDocente || "No especificado"}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Materias Postuladas</h4>
              {formData.asignaturasSeleccionadas.length > 0 ? (
                <div className="space-y-3">
                  {formData.asignaturasSeleccionadas.map((item, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="font-medium text-lg">{item.asignatura}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.nivel} - {item.carrera}
                      </p>
                      {item.requisitos && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Requisitos:</p>
                          <div className="text-sm text-gray-600">
                            {formatRequisitos(item.requisitos).map((req, reqIndex) => (
                              <p key={reqIndex} className="ml-2">
                                • {req}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay materias seleccionadas</p>
              )}
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Documentos Adjuntos</h4>
              {Object.keys(formData.documentos).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(formData.documentos).map(([key, file]) => {
                    const docInfo = documentosList.find((doc) => doc.key === key)
                    return (
                      <div key={key} className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center">
                        <FileText className="h-4 w-4 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium">{docInfo?.label || key}</p>
                          <p className="text-xs text-gray-500">{file.name}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No hay documentos adjuntos</p>
              )}
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={togglePreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Cerrar vista previa
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6">
      {/* Vista previa */}
      <FormPreview />

      {/* Contenedor principal - ocupa todo el ancho disponible */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full bg-white p-6 sm:p-10 rounded-xl shadow-xl border border-blue-100">
          {/* Sección de Guías de Postulación */}
          <GuiasPostulacion />

          {/* Indicador de Progreso mejorado */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-600">Progreso del formulario</p>
              <p className="text-sm font-medium text-blue-700">{progressPercentage}% completado</p>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Encabezado */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-800 mb-2">Postúlate Como Docente</h1>
            <p className="text-lg text-blue-600">Postulación de cátedras declaradas en acefalía</p>
          </div>

          {/* Acciones de borrador */}
          {(hasSavedDraft || progressPercentage > 10) && (
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSavingDraft}
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
              >
                {isSavingDraft ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {hasSavedDraft ? "Actualizar borrador" : "Guardar borrador"}
              </button>
              {hasSavedDraft && (
                <button
                  type="button"
                  onClick={deleteDraft}
                  className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar borrador
                </button>
              )}
              <button
                type="button"
                onClick={togglePreview}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista previa
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Personal */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-blue-700 mr-2" />
                <h3 className="text-2xl font-bold text-blue-800">Información Personal</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre Completo */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                    <InfoTooltip text="Ingrese su nombre completo tal como aparece en su documento de identidad." />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      placeholder="Ingrese su nombre completo"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                        validationErrors.nombre
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      aria-invalid={!!validationErrors.nombre}
                      aria-describedby={validationErrors.nombre ? "nombre-error" : undefined}
                    />
                  </div>
                  {validationErrors.nombre && <ValidationError message={validationErrors.nombre} id="nombre-error" />}
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                    <InfoTooltip text="Ingrese un correo electrónico válido al que tenga acceso. Se utilizará para comunicaciones importantes." />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                      required
                      placeholder="correo@ejemplo.com"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                        validationErrors.correo
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      aria-invalid={!!validationErrors.correo}
                      aria-describedby={validationErrors.correo ? "correo-error" : undefined}
                    />
                  </div>
                  {validationErrors.correo && <ValidationError message={validationErrors.correo} id="correo-error" />}
                </div>

                {/* Número de Celular */}
                <div>
                  <label htmlFor="celular" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Celular <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="celular"
                      name="celular"
                      value={formData.celular}
                      onChange={handleChange}
                      required
                      placeholder="Ej: 12345678"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                        validationErrors.celular
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      aria-invalid={!!validationErrors.celular}
                      aria-describedby={validationErrors.celular ? "celular-error" : undefined}
                    />
                  </div>
                  {validationErrors.celular && (
                    <ValidationError message={validationErrors.celular} id="celular-error" />
                  )}
                </div>

                {/* Carnet de Identidad */}
                <div>
                  <label htmlFor="ci" className="block text-sm font-medium text-gray-700 mb-1">
                    Carnet de Identidad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="ci"
                      name="ci"
                      value={formData.ci}
                      onChange={handleChange}
                      required
                      placeholder="Ej: 12345678"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                        validationErrors.ci
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      aria-invalid={!!validationErrors.ci}
                      aria-describedby={validationErrors.ci ? "ci-error" : undefined}
                    />
                  </div>
                  {validationErrors.ci && <ValidationError message={validationErrors.ci} id="ci-error" />}
                </div>

                {/* Universidad del CEUB */}
                <div>
                  <label htmlFor="universidad" className="block text-sm font-medium text-gray-700 mb-1">
                    Universidad del CEUB <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="universidad"
                      name="universidad"
                      value={formData.universidad}
                      onChange={handleChange}
                      required
                      placeholder="Nombre de la universidad"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                        validationErrors.universidad
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      aria-invalid={!!validationErrors.universidad}
                      aria-describedby={validationErrors.universidad ? "universidad-error" : undefined}
                    />
                  </div>
                  {validationErrors.universidad && (
                    <ValidationError message={validationErrors.universidad} id="universidad-error" />
                  )}
                </div>

                {/* Año de Titulación */}
                <div>
                  <label htmlFor="anioTitulacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Año de Titulación <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="anioTitulacion"
                      name="anioTitulacion"
                      value={formData.anioTitulacion}
                      onChange={handleChange}
                      required
                      placeholder="Ej: 2020"
                      min="1950"
                      max={new Date().getFullYear()}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                        validationErrors.anioTitulacion
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      aria-invalid={!!validationErrors.anioTitulacion}
                      aria-describedby={validationErrors.anioTitulacion ? "anioTitulacion-error" : undefined}
                    />
                  </div>
                  {validationErrors.anioTitulacion && (
                    <ValidationError message={validationErrors.anioTitulacion} id="anioTitulacion-error" />
                  )}
                </div>

                {/* Profesión */}
                <div>
                  <label htmlFor="profesion" className="block text-sm font-medium text-gray-700 mb-1">
                    Profesión <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="profesion"
                      name="profesion"
                      value={formData.profesion}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Licenciado/a en..."
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                        validationErrors.profesion
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      aria-invalid={!!validationErrors.profesion}
                      aria-describedby={validationErrors.profesion ? "profesion-error" : undefined}
                    />
                  </div>
                  {validationErrors.profesion && (
                    <ValidationError message={validationErrors.profesion} id="profesion-error" />
                  )}
                </div>

                {/* Tipo de Docente */}
                <div>
                  <label htmlFor="tipoDocente" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Docente <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="tipoDocente"
                      name="tipoDocente"
                      value={formData.tipoDocente}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all appearance-none ${
                        validationErrors.tipoDocente
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      aria-invalid={!!validationErrors.tipoDocente}
                      aria-describedby={validationErrors.tipoDocente ? "tipoDocente-error" : undefined}
                    >
                      <option value="">Seleccione</option>
                      <option value="Docente Antiguo">Docente Antiguo</option>
                      <option value="Docente Nuevo">Docente Nuevo</option>
                    </select>
                  </div>
                  {validationErrors.tipoDocente && (
                    <ValidationError message={validationErrors.tipoDocente} id="tipoDocente-error" />
                  )}
                </div>
              </div>
            </div>

            {/* Materias Postuladas */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-700 mr-2" />
                <h3 className="text-2xl font-bold text-blue-800">Materias Postuladas</h3>
              </div>

              {isLoadingMaterias ? (
                <div className="flex flex-col items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-gray-600">Cargando materias disponibles...</p>
                </div>
              ) : materiasError ? (
                <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
                  <p className="text-red-700 mb-2">Error al cargar materias</p>
                  <p className="text-gray-600 text-sm mb-4">{materiasError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRetryCount(0)
                      setMateriasError(null)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Carrera */}
                    <div>
                      <label htmlFor="carrera" className="block text-sm font-medium text-gray-700 mb-1">
                        Carrera <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="carrera"
                          name="carrera"
                          value={formData.carrera}
                          onChange={handleChange}
                          required
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all appearance-none ${
                            validationErrors.carrera
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                          aria-invalid={!!validationErrors.carrera}
                          aria-describedby={validationErrors.carrera ? "carrera-error" : undefined}
                        >
                          <option value="">Seleccione una carrera</option>
                          {carrerasList.map((carrera, idx) => (
                            <option key={idx} value={carrera}>
                              {carrera}
                            </option>
                          ))}
                        </select>
                      </div>
                      {validationErrors.carrera && (
                        <ValidationError message={validationErrors.carrera} id="carrera-error" />
                      )}
                    </div>

                    {/* Asignatura */}
                    <div>
                      <label htmlFor="asignatura" className="block text-sm font-medium text-gray-700 mb-1">
                        Asignatura <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BookOpen className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="asignatura"
                          name="asignatura"
                          value={nuevaAsignatura.asignatura}
                          onChange={handleNewSubjectChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all appearance-none ${
                            validationErrors.asignatura
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                          disabled={!formData.carrera}
                        >
                          <option value="">Seleccione una asignatura</option>
                          {formData.carrera &&
                            materias
                              .filter((materia) => materia.carrera === formData.carrera)
                              .filter(
                                (materia) =>
                                  !formData.asignaturasSeleccionadas.some(
                                    (item) =>
                                      item.asignatura === materia.asignatura && item.carrera === materia.carrera,
                                  ),
                              )
                              .map((materia) => (
                                <option key={materia._id} value={materia.asignatura}>
                                  {materia.asignatura}
                                </option>
                              ))}
                        </select>
                      </div>
                      {!formData.carrera && (
                        <p className="mt-1 text-xs text-amber-600">Seleccione primero una carrera</p>
                      )}
                      {validationErrors.asignaturas && <ValidationError message={validationErrors.asignaturas} />}
                    </div>
                  </div>

                  {/* Campo de Requisitos - Solo lectura */}
                  {nuevaAsignatura.asignatura && requisitosActuales && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requisitos de la Asignatura
                        <InfoTooltip text="Estos son los requisitos necesarios para la asignatura seleccionada. Esta información es solo de consulta." />
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                          <List className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 min-h-[80px]">
                          <div className="text-sm text-gray-700">
                            {formatRequisitos(requisitosActuales).map((req, index) => (
                              <p key={index} className="mb-1">
                                • {req}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Los requisitos se muestran automáticamente según la asignatura seleccionada
                      </p>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={addAsignatura}
                      disabled={!formData.carrera || !nuevaAsignatura.asignatura}
                      className={`px-6 py-3 rounded-lg shadow-md transition duration-300 flex items-center ${
                        !formData.carrera || !nuevaAsignatura.asignatura
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Agregar Asignatura
                    </button>
                  </div>

                  {formData.asignaturasSeleccionadas.length > 0 && (
                    <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Asignaturas Agregadas:</h4>
                      <div className="space-y-3">
                        {formData.asignaturasSeleccionadas.map((item, index) => (
                          <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <BookOpen className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                                  <span className="text-gray-800">
                                    <span className="font-medium text-lg">{item.asignatura}</span>
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {item.nivel} - {item.carrera}
                                </p>
                                {item.requisitos && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Requisitos:</p>
                                    <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                                      {formatRequisitos(item.requisitos).map((req, reqIndex) => (
                                        <p key={reqIndex} className="mb-1">
                                          • {req}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAsignatura(index)}
                                className="text-red-500 hover:text-red-700 p-1 ml-2"
                                aria-label={`Eliminar asignatura ${item.asignatura}`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {formData.asignaturasSeleccionadas.length === 1
                          ? "Ha agregado 1 asignatura."
                          : `Ha agregado ${formData.asignaturasSeleccionadas.length} asignaturas.`}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Documentación */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center mb-4">
                <FileUp className="h-6 w-6 text-blue-700 mr-2" />
                <h3 className="text-2xl font-bold text-blue-800">Documentación</h3>
              </div>

              <p className="mb-4 text-gray-600">Suba los documentos en formato PDF o Excel</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentosList.map((doc, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-lg flex items-center space-x-4 hover:shadow-md transition-shadow"
                  >
                    <div className="text-blue-600 flex-shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{doc.label}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {formData.documentos[doc.key] ? formData.documentos[doc.key].name : "Sin Archivo"}
                      </div>
                    </div>
                    <div>
                      <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition flex items-center">
                        <FileUp className="h-4 w-4 mr-1" />
                        Subir
                        <input
                          type="file"
                          name={doc.key}
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf, .xls, .xlsx, application/pdf, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
              <button
                type="submit"
                disabled={isSubmitting || isVerifying}
                className={`w-full sm:flex-1 py-3 px-6 rounded-lg shadow-md transition duration-300 flex justify-center items-center ${
                  isSubmitting || isVerifying
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                }`}
              >
                {isSubmitting || isVerifying ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    {isVerifying ? "Verificando..." : "Procesando..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Registrar Postulación
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isSubmitting || isVerifying}
                onClick={() => Swal.fire({ icon: "info", title: "Cancelado", text: "Operación cancelada" })}
                className={`w-full sm:flex-1 py-3 px-6 rounded-lg shadow-md transition duration-300 flex justify-center items-center ${
                  isSubmitting || isVerifying
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                }`}
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Botón flotante para dispositivos móviles */}
      <button
        type="button"
        onClick={() => {
          if (!isSubmitting && !isVerifying) {
            document.querySelector("form").requestSubmit()
          }
        }}
        disabled={isSubmitting || isVerifying}
        className={`fixed bottom-6 right-6 ${
          isSubmitting || isVerifying
            ? "bg-gray-500"
            : "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
        } text-white p-4 rounded-full shadow-lg transition-all duration-300 md:hidden z-50`}
        title="Enviar Formulario"
      >
        {isSubmitting || isVerifying ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <CheckCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  )
}

export default RegistroPostulacion
