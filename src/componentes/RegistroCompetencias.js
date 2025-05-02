"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import {
  User,
  Calendar,
  Award,
  Book,
  Briefcase,
  CheckCircle,
  FileText,
  ClipboardCheck,
  Layers,
  PenTool,
  Monitor,
  Lightbulb,
  BookOpen,
  Percent,
} from "lucide-react"

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

function RegistroCompetencias({ competencia, onCompetenciaRegistered, onCancel }) {
  // Se agrega la propiedad "carrera" en el estado inicial
  const [formData, setFormData] = useState({
    tipoEvaluador: "",
    nombre: "",
    carnet: "",
    materia: "",
    carrera: "", // NUEVO: registro de la carrera asociada a la materia
    fecha: "",
    planConcordancia: "",
    planCompetencia: "",
    planContenidos: "",
    planEstrategiasEnsenanza: "",
    planEstrategiasEvaluacion: "",
    procesoMotivacion: "",
    procesoDominio: "",
    procesoTICs: "",
    procesoExplicacion: "",
    nombreEvaluador: "",
    evaluadorId: "",
  })

  // Estado para almacenar las materias postuladas (del postulante)
  const [materiasPostuladas, setMateriasPostuladas] = useState([])
  // Estado para el filtro: carrera seleccionada para filtrar materias
  const [filtroCarrera, setFiltroCarrera] = useState("")

  // Estados para controlar el proceso de envío y verificación
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastOperationId, setLastOperationId] = useState(null)

  // Estado para controlar la vista en dispositivos móviles
  const [activeTab, setActiveTab] = useState(0)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  useEffect(() => {
    if (competencia) {
      setFormData({ ...competencia })
      if (competencia.asignaturasSeleccionadas) {
        setMateriasPostuladas(
          typeof competencia.asignaturasSeleccionadas === "string"
            ? JSON.parse(competencia.asignaturasSeleccionadas)
            : competencia.asignaturasSeleccionadas,
        )
      }
    } else {
      // Si no hay competencia, establecer la fecha actual por defecto
      setFormData((prev) => ({
        ...prev,
        fecha: new Date().toISOString().split("T")[0],
      }))
    }
  }, [competencia])

  // Buscar postulante por carnet y autocompletar nombre y materias postuladas
  useEffect(() => {
    const fetchPostulante = async () => {
      if (formData.carnet.trim() === "") {
        setFormData((prev) => ({ ...prev, nombre: "" }))
        setMateriasPostuladas([])
        return
      }
      try {
        const response = await axios.get(`${baseURL}/postulaciones/carnet/${formData.carnet}`)
        if (response.data.data) {
          setFormData((prev) => ({
            ...prev,
            nombre: response.data.data.nombre,
          }))
          if (response.data.data.asignaturasSeleccionadas) {
            const materias =
              typeof response.data.data.asignaturasSeleccionadas === "string"
                ? JSON.parse(response.data.data.asignaturasSeleccionadas)
                : response.data.data.asignaturasSeleccionadas
            setMateriasPostuladas(materias)
          } else {
            setMateriasPostuladas([])
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setFormData((prev) => ({ ...prev, nombre: "" }))
          setMateriasPostuladas([])
        }
        console.error("Error al buscar postulante por carnet:", error)
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchPostulante()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [formData.carnet, baseURL])

  // Manejo de cambios para cualquier campo (excepto Materia)
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Manejo específico del select de Materia que, al cambiar, registra también la carrera correspondiente.
  const handleMateriaChange = (e) => {
    const selectedMateria = e.target.value
    // Buscamos en las materias filtradas la materia seleccionada
    const materiasFiltradas =
      filtroCarrera.trim() !== ""
        ? materiasPostuladas.filter((mat) => mat.carrera === filtroCarrera)
        : materiasPostuladas
    const materiaObj = materiasFiltradas.find((mat) => mat.asignatura === selectedMateria)
    setFormData((prev) => ({
      ...prev,
      materia: selectedMateria,
      carrera: materiaObj ? materiaObj.carrera : "",
    }))
  }

  // Calcula el progreso
  const totalFields = Object.keys(formData).length
  const filledFields = Object.values(formData).filter((val) => val !== "" && val !== null).length
  const progressPercentage = Math.round((filledFields / totalFields) * 100)

  // Calcula sumatorias y promedios para las etapas (etapa 2 y 3)
  const stage2Sum =
    (Number.parseInt(formData.planConcordancia) || 0) +
    (Number.parseInt(formData.planCompetencia) || 0) +
    (Number.parseInt(formData.planContenidos) || 0) +
    (Number.parseInt(formData.planEstrategiasEnsenanza) || 0) +
    (Number.parseInt(formData.planEstrategiasEvaluacion) || 0)
  const stage2Promedio = ((stage2Sum / 100) * 30).toFixed(2)

  const stage3Sum =
    (Number.parseInt(formData.procesoMotivacion) || 0) +
    (Number.parseInt(formData.procesoDominio) || 0) +
    (Number.parseInt(formData.procesoTICs) || 0) +
    (Number.parseInt(formData.procesoExplicacion) || 0)
  const stage3Promedio = ((stage3Sum / 100) * 30).toFixed(2)

  const stage2Color = stage2Sum <= 60 ? "text-red-500" : stage2Sum > 80 ? "text-green-500" : "text-yellow-600"
  const stage3Color = stage3Sum <= 60 ? "text-red-500" : stage3Sum > 80 ? "text-green-500" : "text-yellow-600"

  // Función para mostrar alertas con SweetAlert2 y redirección automática
  const showAlert = useCallback((icon, title, text, callback = null, autoRedirect = false) => {
    // Si es redirección automática, ejecutar el callback inmediatamente
    if (autoRedirect && callback) {
      // Mostrar alerta con timer
      Swal.fire({
        icon,
        title,
        text,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        didClose: () => {
          // Ejecutar callback cuando se cierre la alerta
          callback()
        },
      })
    } else {
      // Comportamiento normal sin redirección automática
      return Swal.fire({
        icon,
        title,
        text,
        confirmButtonText: "Aceptar",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      }).then((result) => {
        if (callback && result.isConfirmed) {
          callback()
        }
        return result
      })
    }
  }, [])

  // Función para generar un ID único para la operación
  const generateOperationId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5)
  }, [])

  // Función para verificar si ya existe un registro con los mismos datos
  const verificarRegistroExistente = useCallback(
    async (dataToVerify) => {
      try {
        setIsVerifying(true)

        // Datos mínimos necesarios para verificar
        const verificacionData = {
          tipoEvaluador: dataToVerify.tipoEvaluador,
          materia: dataToVerify.materia,
          carrera: dataToVerify.carrera,
        }

        console.log("Verificando registro existente:", verificacionData)

        // Intentar verificar directamente con un endpoint específico
        try {
          const verificacionResponse = await axios({
            method: "post",
            url: `${baseURL}/api/examen-competencias/verificar`,
            data: verificacionData,
            timeout: 10000, // 10 segundos de timeout
          })

          console.log("Respuesta de verificación:", verificacionResponse.data)
          return verificacionResponse.data.exists
        } catch (error) {
          console.error("Error en verificación directa:", error)

          // Si falla la verificación directa, intentar obtener todos los registros
          try {
            const allRegistrosResponse = await axios.get(`${baseURL}/api/examen-competencias`)
            const allRegistros = allRegistrosResponse.data

            // Buscar coincidencia manual por tipoEvaluador, materia y carrera
            const found = allRegistros.some(
              (registro) =>
                registro.tipoEvaluador === dataToVerify.tipoEvaluador &&
                registro.materia === dataToVerify.materia &&
                registro.carrera === dataToVerify.carrera &&
                (!competencia || registro._id !== competencia._id), // Excluir el registro actual si estamos editando
            )

            console.log("Verificación alternativa:", found)
            return found
          } catch (secondError) {
            console.error("Error en verificación alternativa:", secondError)
            return false
          }
        }
      } catch (error) {
        console.error("Error al verificar registro existente:", error)
        return false
      } finally {
        setIsVerifying(false)
      }
    },
    [baseURL, competencia],
  )

  // Función para ejecutar la redirección
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (stage2Sum > 100 || stage3Sum > 100) {
      showAlert("error", "Error", "La sumatoria de puntajes excede el máximo permitido.")
      return
    }

    // Evitar múltiples envíos simultáneos
    if (isSubmitting || isVerifying) return

    // Generar un ID único para esta operación
    const operationId = generateOperationId()
    setLastOperationId(operationId)

    // Verificar si ya existe un registro con los mismos datos
    const registroExistente = await verificarRegistroExistente(formData)
    if (registroExistente && !competencia) {
      return showAlert(
        "warning",
        "Registro duplicado",
        "Ya existe un registro para este tipo de evaluador con la misma materia y carrera.",
      )
    }

    // Marcar como enviando
    setIsSubmitting(true)

    // Guardar los datos que se van a enviar para verificación posterior
    const dataToSubmit = { ...formData }
    dataToSubmit.notaPlanTrabajo = stage2Promedio
    dataToSubmit.notaProcesosPedagogicos = stage3Promedio

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
      // Preparar objeto para enviar al backend
      const dataToSend = {
        ...formData,
        notaPlanTrabajo: stage2Promedio,
        notaProcesosPedagogicos: stage3Promedio,
      }

      if (!competencia) {
        const user = JSON.parse(localStorage.getItem("user"))
        if (user) {
          dataToSend.evaluadorId = user._id
          if (!dataToSend.nombreEvaluador) {
            dataToSend.nombreEvaluador = user.nombre || ""
          }
        }
      }

      let response
      if (competencia) {
        // Actualizar registro existente
        response = await axios({
          method: "put",
          url: `${baseURL}/api/examen-competencias/${competencia._id}`,
          data: dataToSend,
          timeout: 15000, // 15 segundos de timeout
        })

        // Cerrar el indicador de carga
        Swal.close()

        // Mostrar mensaje de éxito y redirigir inmediatamente
        Swal.fire({
          icon: "success",
          title: "¡Actualizado!",
          text: "Registro actualizado correctamente.",
          confirmButtonText: "Aceptar",
        }).then(() => {
          // Llamar al callback para redirigir a la lista
          if (onCompetenciaRegistered) {
            onCompetenciaRegistered()
          }
        })
      } else {
        // Crear nuevo registro
        response = await axios({
          method: "post",
          url: `${baseURL}/api/examen-competencias`,
          data: dataToSend,
          timeout: 15000, // 15 segundos de timeout
        })

        // Cerrar el indicador de carga
        Swal.close()

        // Mostrar mensaje de éxito y redirigir inmediatamente
        Swal.fire({
          icon: "success",
          title: "¡Registrado!",
          text: "Registro creado correctamente.",
          confirmButtonText: "Aceptar",
        }).then(() => {
          // Llamar al callback para redirigir a la lista
          if (onCompetenciaRegistered) {
            onCompetenciaRegistered(response.data)
          }
        })
      }
    } catch (error) {
      console.error("Error al guardar el registro:", error)

      // Cerrar el indicador de carga
      Swal.close()

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

      // Si es un error de conexión y no estamos editando, verificar si los datos se guardaron
      if (shouldVerifyRegistration && !competencia) {
        try {
          // Mostrar indicador de verificación
          Swal.fire({
            title: "Verificando registro...",
            text: "Estamos verificando si el registro fue guardado correctamente",
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            didOpen: () => {
              Swal.showLoading()
            },
          })

          // Esperar un momento antes de verificar
          await new Promise((resolve) => setTimeout(resolve, 3000))

          // Verificar si el registro se guardó a pesar del error
          const registroGuardado = await verificarRegistroExistente(dataToSubmit)

          // Cerrar el indicador de verificación
          Swal.close()

          if (registroGuardado) {
            // El registro sí se guardó a pesar del error de conexión
            Swal.fire({
              icon: "success",
              title: "¡Registrado correctamente!",
              text: "A pesar del error de conexión, el registro fue guardado exitosamente.",
              confirmButtonText: "Aceptar",
            }).then(() => {
              // Llamar al callback para redirigir a la lista
              if (onCompetenciaRegistered) {
                onCompetenciaRegistered()
              }
            })
            return
          } else {
            // Intentar una última verificación después de un tiempo adicional
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const segundaVerificacion = await verificarRegistroExistente(dataToSubmit)

            if (segundaVerificacion) {
              Swal.fire({
                icon: "success",
                title: "¡Registrado correctamente!",
                text: "El registro fue guardado exitosamente después de una verificación adicional.",
                confirmButtonText: "Aceptar",
              }).then(() => {
                if (onCompetenciaRegistered) {
                  onCompetenciaRegistered()
                }
              })
              return
            }

            // El registro no se guardó, mostrar el error original
            Swal.fire({
              icon: "error",
              title: "Error",
              text: errorMessage,
              confirmButtonText: "Aceptar",
            })
          }
        } catch (verificationError) {
          console.error("Error al verificar el registro:", verificationError)
          // Continuar con el mensaje de error original
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMessage,
            confirmButtonText: "Aceptar",
          })
        }
      } else {
        // Para otros tipos de errores o cuando estamos editando, mostrar el error directamente
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonText: "Aceptar",
        })
      }
    } finally {
      // Marcar como no enviando, independientemente del resultado
      setIsSubmitting(false)
    }
  }

  // Obtenemos un arreglo único de carreras a partir de las materias postuladas
  const uniqueCarreras = Array.from(new Set(materiasPostuladas.map((mat) => mat.carrera)))

  // Filtrar materias según el filtro de carrera
  const materiasFiltradas =
    filtroCarrera.trim() !== "" ? materiasPostuladas.filter((mat) => mat.carrera === filtroCarrera) : materiasPostuladas

  // Definir las secciones para la navegación por pestañas en móvil
  const tabs = [
    { id: 0, name: "Datos", icon: <User className="w-5 h-5" /> },
    { id: 1, name: "Evaluador", icon: <Award className="w-5 h-5" /> },
    { id: 2, name: "Plan", icon: <BookOpen className="w-5 h-5" /> },
    { id: 3, name: "Procesos", icon: <Layers className="w-5 h-5" /> },
    { id: 4, name: "Resultados", icon: <Percent className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-4 px-2 sm:py-6">
      <div className="w-full mx-auto">
        <div className="w-full bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-xl border border-gray-100">
          {/* Encabezado */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
              <Award className="h-8 w-8 text-blue-700" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {competencia ? "Editar Registro de Competencias" : "Registro de Competencias"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Complete el formulario para {competencia ? "actualizar" : "registrar"} la evaluación de competencias
            </p>
          </div>

          {/* Indicador de Progreso mejorado */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">Progreso del formulario</p>
              <p className="text-sm font-medium text-blue-600">{progressPercentage}% completado</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor:
                    progressPercentage < 30 ? "#f87171" : progressPercentage < 70 ? "#fbbf24" : "#34d399",
                }}
              ></div>
            </div>
          </div>

          {/* Navegación por pestañas para móvil */}
          <div className="md:hidden border-b border-gray-200 px-4 mt-4">
            <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-1 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} id="competenciaForm" className="space-y-6">
            {/* Sección 0: Selección del tipo de evaluador */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 0 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Tipo de Evaluador
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar tipo de Evaluador <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Award className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="tipoEvaluador"
                      value={formData.tipoEvaluador}
                      onChange={handleChange}
                      required
                      title="Seleccione el tipo de evaluador"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Seleccione</option>
                      <option value="Evaluador 1">Evaluador 1</option>
                      <option value="Evaluador 2">Evaluador 2</option>
                      <option value="Presidente Tribunal">Presidente Tribunal</option>
                    </select>
                  </div>
                  {formData.tipoEvaluador === "" && (
                    <p className="mt-1 text-xs text-red-500">Debe seleccionar un tipo de evaluador.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 1: Datos del Postulante */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 0 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Datos del Postulante
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Campo CI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CI <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="carnet"
                        value={formData.carnet}
                        onChange={handleChange}
                        placeholder="Ingrese CI (máximo 10 dígitos)"
                        maxLength="10"
                        pattern="\d{1,10}"
                        title="Solo se permiten números y máximo 10 dígitos"
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Ingrese el número de carnet de identidad</p>
                  </div>

                  {/* Campo Nombre del Postulante */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Postulante <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        readOnly
                        placeholder="Nombre autocompletado"
                        title="El nombre se autocompleta al ingresar el CI"
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Se autocompleta al ingresar el CI</p>
                  </div>

                  {/* Filtro para materias por carrera */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filtrar materias por Carrera:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        value={filtroCarrera}
                        onChange={(e) => setFiltroCarrera(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Mostrar todas</option>
                        {uniqueCarreras.map((carrera) => (
                          <option key={carrera} value={carrera}>
                            {carrera}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Filtra las materias disponibles por carrera</p>
                  </div>

                  {/* Campo Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Selección de Materia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Materia <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Book className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="materia"
                      value={formData.materia}
                      onChange={handleMateriaChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Seleccione la asignatura</option>
                      {materiasFiltradas.length > 0 ? (
                        materiasFiltradas.map((mat, idx) => (
                          <option key={idx} value={mat.asignatura}>
                            {mat.asignatura}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No se encontraron materias para la carrera seleccionada
                        </option>
                      )}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Seleccione la materia a evaluar</p>
                </div>

                {/* Mostrar la carrera seleccionada */}
                {formData.carrera && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Carrera: <span className="font-bold">{formData.carrera}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sección 2: Nombre del Evaluador */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 1 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Datos del Evaluador
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Evaluador <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="nombreEvaluador"
                      value={formData.nombreEvaluador}
                      onChange={handleChange}
                      placeholder="Ingrese el nombre del evaluador"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 3: Segunda Etapa - Exposición del Plan de Trabajo */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 2 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Segunda Etapa: Exposición del Plan de Trabajo (30%)
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Concordancia con el perfil profesional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Concordancia con el perfil profesional <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="planConcordancia"
                        value={formData.planConcordancia}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="20">20 - Excelente</option>
                      </select>
                    </div>
                  </div>

                  {/* Competencia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Competencia <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Award className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="planCompetencia"
                        value={formData.planCompetencia}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="20">20 - Excelente</option>
                      </select>
                    </div>
                  </div>

                  {/* Contenidos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenidos <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="planContenidos"
                        value={formData.planContenidos}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="20">20 - Excelente</option>
                      </select>
                    </div>
                  </div>

                  {/* Estrategias de enseñanza */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estrategias de enseñanza <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PenTool className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="planEstrategiasEnsenanza"
                        value={formData.planEstrategiasEnsenanza}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="20">20 - Excelente</option>
                      </select>
                    </div>
                  </div>

                  {/* Estrategias de evaluación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estrategias de evaluación <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ClipboardCheck className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="planEstrategiasEvaluacion"
                        value={formData.planEstrategiasEvaluacion}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="20">20 - Excelente</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Resultados de la segunda etapa */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                    Resultados Segunda Etapa
                  </h3>
                  <div className="space-y-2">
                    <p className={`text-sm ${stage2Color}`}>
                      Sumatoria: <span className="font-semibold">{stage2Sum} / 100</span>
                    </p>
                    <p className="text-base font-bold text-blue-800">Promedio (30%): {stage2Promedio}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4: Tercera Etapa - Evaluación de Procesos Pedagógicos */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 3 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <Layers className="h-5 w-5 mr-2" />
                  Tercera Etapa: Evaluación de Procesos Pedagógicos y Didácticos (30%)
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Motivación a los estudiantes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivación a los estudiantes <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lightbulb className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="procesoMotivacion"
                        value={formData.procesoMotivacion}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="25">25 - Excelente</option>
                      </select>
                    </div>
                  </div>

                  {/* Dominio y Conocimiento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dominio y Conocimiento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BookOpen className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="procesoDominio"
                        value={formData.procesoDominio}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="25">25 - Excelente</option>
                      </select>
                    </div>
                  </div>

                  {/* Uso de las TICs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Uso de las TICs <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Monitor className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="procesoTICs"
                        value={formData.procesoTICs}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="25">25 - Excelente</option>
                      </select>
                    </div>
                  </div>

                  {/* Explicación de la unidad temática */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Explicación de la unidad temática <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="procesoExplicacion"
                        value={formData.procesoExplicacion}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Seleccione</option>
                        <option value="10">10 - Regular</option>
                        <option value="15">15 - Bueno</option>
                        <option value="25">25 - Excelente</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Resultados de la tercera etapa */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                    Resultados Tercera Etapa
                  </h3>
                  <div className="space-y-2">
                    <p className={`text-sm ${stage3Color}`}>
                      Sumatoria: <span className="font-semibold">{stage3Sum} / 100</span>
                    </p>
                    <p className="text-base font-bold text-blue-800">Promedio (30%): {stage3Promedio}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 5: Resultados Finales */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 4 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <Percent className="h-5 w-5 mr-2" />
                  Resultados Finales
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">Resumen de Evaluación</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-700">Plan de Trabajo (30%):</p>
                      <p className="text-sm font-bold text-blue-700">{stage2Promedio}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(stage2Sum / 100) * 100}%`,
                          backgroundColor: stage2Sum <= 60 ? "#f87171" : stage2Sum > 80 ? "#34d399" : "#fbbf24",
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm font-medium text-gray-700">Procesos Pedagógicos (30%):</p>
                      <p className="text-sm font-bold text-blue-700">{stage3Promedio}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(stage3Sum / 100) * 100}%`,
                          backgroundColor: stage3Sum <= 60 ? "#f87171" : stage3Sum > 80 ? "#34d399" : "#fbbf24",
                        }}
                      ></div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-base font-semibold text-gray-800">Nota Final:</p>
                        <p className="text-lg font-bold text-blue-800">
                          {(Number.parseFloat(stage2Promedio) + Number.parseFloat(stage3Promedio)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting || isVerifying}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium text-center transition-all duration-200 ${
                  isSubmitting || isVerifying
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
                }`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isVerifying}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium text-center transition-all duration-200 ${
                  isSubmitting || isVerifying
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
                }`}
              >
                <span className="flex items-center justify-center">
                  {isSubmitting || isVerifying ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {competencia ? "Guardar Cambios" : "Registrar"}
                    </>
                  )}
                </span>
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
            document.getElementById("competenciaForm").requestSubmit()
          }
        }}
        disabled={isSubmitting || isVerifying}
        className={`fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 z-50 ${
          isSubmitting || isVerifying
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        } md:hidden`}
        title={competencia ? "Actualizar Registro" : "Registrar Competencia"}
      >
        {isSubmitting || isVerifying ? (
          <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <CheckCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  )
}

export default RegistroCompetencias
