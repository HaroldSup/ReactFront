"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { FaFileAlt } from "react-icons/fa"

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

const allowedTypes = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

// Opciones de carreras (incluye "Ingeniería Civil")
const carrerasList = [
  "Ingeniería de Sistemas",
  "Ingeniería de Sistemas Electrónicos",
  "Ingeniería Agroindustrial",
  "Ingeniería Civil",
  "Ingeniería Comercial",
]

function RegistroPostulacion() {
  const [formData, setFormData] = useState({
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
  })

  const [nuevaAsignatura, setNuevaAsignatura] = useState({
    asignatura: "",
    nivel: "Grado",
  })

  // Estado para almacenar las materias registradas en la base de datos
  const [materias, setMaterias] = useState([])

  // Estados para controlar el proceso de envío y verificación
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastOperationId, setLastOperationId] = useState(null)

  // URL base para las peticiones
  const baseURL = "http://localhost:5000"

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
            timeout: 10000, // 10 segundos de timeout
          })

          console.log("Respuesta de verificación:", verificacionResponse.data)
          return verificacionResponse.data.exists
        } catch (error) {
          console.error("Error en verificación directa:", error)

          // Si falla la verificación directa, intentar obtener todas las postulaciones
          try {
            const allPostulacionesResponse = await axios.get(`${baseURL}/postulaciones`)
            const allPostulaciones = allPostulacionesResponse.data

            // Buscar coincidencia manual por CI y nombre
            const found = allPostulaciones.some(
              (postulacion) =>
                postulacion.ci === dataToVerify.ci &&
                postulacion.nombre.toLowerCase().includes(dataToVerify.nombre.toLowerCase()),
            )

            console.log("Verificación alternativa:", found)
            return found
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

  // useEffect para obtener las materias desde el backend
  useEffect(() => {
    axios
      .get(`${baseURL}/materias`)
      .then((response) => {
        setMaterias(response.data)
      })
      .catch((error) => {
        console.error("Error al obtener materias:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron obtener las materias. Intenta nuevamente más tarde.",
        })
      })
  }, [baseURL])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (name === "carrera") {
      setNuevaAsignatura({
        asignatura: "",
        nivel: "Grado",
      })
    }
  }

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

  const handleNewSubjectChange = (e) => {
    const { name, value } = e.target
    setNuevaAsignatura((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const addAsignatura = () => {
    if (!nuevaAsignatura.asignatura.trim()) {
      return Swal.fire({
        icon: "error",
        title: "Campo incompleto",
        text: "Por favor, seleccione una asignatura.",
      })
    }
    if (formData.asignaturasSeleccionadas.length >= 3) {
      return Swal.fire({
        icon: "error",
        title: "Máximo alcanzado",
        text: "Solo se pueden registrar máximo 3 materias.",
      })
    }
    // Se crea un nuevo objeto que incluye la carrera actual
    const nuevaAsignaturaConCarrera = { ...nuevaAsignatura, carrera: formData.carrera }
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
  }

  const validateForm = useCallback(() => {
    if (!formData.nombre.trim() || !soloLetras.test(formData.nombre.trim())) {
      showAlert("error", "Nombre inválido", "El nombre es obligatorio y debe contener solo letras.")
      return false
    }
    if (!emailRegex.test(formData.correo.trim())) {
      showAlert("error", "Correo inválido", "El correo electrónico es inválido.")
      return false
    }
    if (!formData.celular.trim() || !soloNumeros.test(formData.celular.trim())) {
      showAlert("error", "Celular inválido", "El número de celular es obligatorio y debe contener solo números.")
      return false
    }
    if (!formData.ci.trim() || !soloNumeros.test(formData.ci.trim())) {
      showAlert("error", "Carnet inválido", "El carnet de identidad es obligatorio y debe contener solo números.")
      return false
    }
    if (!formData.universidad.trim() || !soloLetras.test(formData.universidad.trim())) {
      showAlert("error", "Universidad inválida", "La universidad es obligatoria y debe contener solo letras.")
      return false
    }
    if (!formData.anioTitulacion.trim() || !soloNumeros.test(formData.anioTitulacion.trim())) {
      showAlert("error", "Año inválido", "El año de titulación es obligatorio y debe ser numérico.")
      return false
    }
    if (!formData.profesion.trim() || !soloLetras.test(formData.profesion.trim())) {
      showAlert("error", "Profesión inválida", "La profesión es obligatoria y debe contener solo letras.")
      return false
    }
    if (!formData.carrera.trim()) {
      showAlert("error", "Carrera inválida", "La carrera es obligatoria.")
      return false
    }
    if (!formData.tipoDocente) {
      showAlert("error", "Tipo de Docente", "El tipo de docente es obligatorio.")
      return false
    }
    if (formData.asignaturasSeleccionadas.length === 0) {
      showAlert("error", "Materias pendientes", "Debe agregar al menos una materia postulada.")
      return false
    }
    return true
  }, [formData, showAlert, soloLetras, soloNumeros, emailRegex])

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
        },
        timeout: 30000, // 30 segundos de timeout para archivos grandes
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
            // Limpiar el formulario después del registro exitoso
            setFormData({
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
            })
            setNuevaAsignatura({
              asignatura: "",
              nivel: "Grado",
            })
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
                  // Limpiar el formulario después del registro exitoso
                  setFormData({
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
                  })
                  setNuevaAsignatura({
                    asignatura: "",
                    nivel: "Grado",
                  })
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
                    // Limpiar el formulario después del registro exitoso
                    setFormData({
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
                    })
                    setNuevaAsignatura({
                      asignatura: "",
                      nivel: "Grado",
                    })
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-6 relative">
      {/* Contenedor con fondo de imagen */}
      <div
        className="w-full max-w-7xl p-6 sm:p-10 rounded-xl shadow-2xl"
        style={{
          backgroundImage: "url(EMI.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Indicador de Progreso */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Encabezado */}
        <div className="text-center mb-8">
          <img src="logo.png" alt="Logo EMI" className="mx-auto h-16" />
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-800 mt-4">Postúlate Como Docente</h1>
          <p className="mt-2 text-sm sm:text-base text-yellow-600">
            Postulación de cátedras declaradas en acefalía para el periodo I/2025
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Información Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Nombre Completo:</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ingrese su nombre completo"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Correo Electrónico:</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Número de Celular:</label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 12345678"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Carnet de Identidad:</label>
                <input
                  type="text"
                  name="ci"
                  value={formData.ci}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 12345678"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Universidad del CEUB:</label>
                <input
                  type="text"
                  name="universidad"
                  value={formData.universidad}
                  onChange={handleChange}
                  required
                  placeholder="Nombre de la universidad"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Año de Titulación:</label>
                <input
                  type="number"
                  name="anioTitulacion"
                  value={formData.anioTitulacion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 2020"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Profesión:</label>
                <input
                  type="text"
                  name="profesion"
                  value={formData.profesion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Licenciado/a en..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Tipo de Docente:</label>
                <select
                  name="tipoDocente"
                  value={formData.tipoDocente}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="Docente Antiguo">Docente Antiguo</option>
                  <option value="Docente Nuevo">Docente Nuevo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Materias Postuladas */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Materias Postuladas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Asignatura:</label>
                <select
                  name="asignatura"
                  value={nuevaAsignatura.asignatura}
                  onChange={handleNewSubjectChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione una asignatura</option>
                  {formData.carrera &&
                    materias
                      .filter((materia) => materia.carrera === formData.carrera)
                      .filter(
                        (materia) =>
                          !formData.asignaturasSeleccionadas.some((item) => item.asignatura === materia.asignatura),
                      )
                      .map((materia) => (
                        <option key={materia._id} value={materia.asignatura}>
                          {materia.asignatura}
                        </option>
                      ))}
                </select>
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Carrera:</label>
                <select
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione una carrera</option>
                  {carrerasList.map((carrera, idx) => (
                    <option key={idx} value={carrera}>
                      {carrera}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-lg font-semibold text-gray-700 mb-2">Nivel de Enseñanza:</label>
              <select
                name="nivel"
                value={nuevaAsignatura.nivel}
                onChange={handleNewSubjectChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Grado">Grado</option>
              </select>
            </div>
            <button
              type="button"
              onClick={addAsignatura}
              className="mt-4 w-full py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
            >
              Agregar Asignatura
            </button>
            {formData.asignaturasSeleccionadas.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-gray-700">Asignaturas Agregadas:</h3>
                <ul className="list-disc list-inside">
                  {formData.asignaturasSeleccionadas.map((item, index) => (
                    <li key={index} className="text-gray-800">
                      {item.asignatura} - {item.nivel} - {item.carrera}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Documentación */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Documentación en Formato PDF/Excel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentosList.map((doc, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg flex items-center space-x-4">
                  <div className="text-blue-600">
                    <FaFileAlt size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{doc.label}</div>
                    <div className="text-sm text-gray-500">
                      {formData.documentos[doc.key] ? formData.documentos[doc.key].name : "Sin Archivo"}
                    </div>
                  </div>
                  <div>
                    <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition">
                      Subir Archivo
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
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || isVerifying}
              className={`flex-1 py-2 px-4 ${
                isSubmitting || isVerifying ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
              } text-white font-semibold rounded-lg shadow-md transition duration-200 flex justify-center items-center`}
            >
              {isSubmitting || isVerifying ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isVerifying ? "Verificando..." : "Procesando..."}
                </>
              ) : (
                "Registrar"
              )}
            </button>
            <button
              type="button"
              disabled={isSubmitting || isVerifying}
              onClick={() => Swal.fire({ icon: "info", title: "Cancelado", text: "Operación cancelada" })}
              className={`flex-1 py-2 px-4 ${
                isSubmitting || isVerifying ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"
              } text-white font-semibold rounded-lg shadow-md transition duration-200`}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegistroPostulacion
