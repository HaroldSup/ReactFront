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
  GraduationCap,
  ClipboardCheck,
} from "lucide-react"

function Registrodeconocimientos({ conocimiento, onConocimientoRegistered, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: "",
    carnet: "", // Se muestra como CI en la UI
    fecha: "",
    examenConocimientos: "",
    nombreEvaluador: "",
    profesion: "",
    materia: "",
    carrera: "",
    habilitado: "Habilitado", // Por defecto, siempre habilitado.
    observaciones: "",
  })

  // Para almacenar las materias postuladas (recuperadas al buscar por CI)
  const [materiasPostuladas, setMateriasPostuladas] = useState([])
  // Para filtrar las materias según la carrera
  const [filtroCarrera, setFiltroCarrera] = useState("")

  // Estados para controlar el proceso de envío y verificación
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastOperationId, setLastOperationId] = useState(null)

  // Estado para controlar la vista en dispositivos móviles
  const [activeTab, setActiveTab] = useState(0)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Si se está editando un registro, se precargan los datos (incluidos los campos nuevos)
  useEffect(() => {
    if (conocimiento) {
      // Se remueve la propiedad "materia" si existe, y se asignan el resto de los campos
      const { materia, ...rest } = conocimiento
      setFormData({
        ...rest,
        profesion: conocimiento.profesion || "",
        materia: conocimiento.materia || "",
        carrera: conocimiento.carrera || "",
        habilitado: "Habilitado", // Siempre fijo en "Habilitado"
        observaciones: conocimiento.observaciones || "",
      })
    } else {
      // Si no hay conocimiento, establecer la fecha actual por defecto
      setFormData((prev) => ({
        ...prev,
        fecha: new Date().toISOString().split("T")[0],
      }))
    }
  }, [conocimiento])

  // Reemplazar la función showAlert completa con esta implementación más directa
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
          carnet: dataToVerify.carnet,
          materia: dataToVerify.materia,
          carrera: dataToVerify.carrera,
        }

        console.log("Verificando registro existente:", verificacionData)

        // Intentar verificar directamente con un endpoint específico
        try {
          const verificacionResponse = await axios({
            method: "post",
            url: `${baseURL}/api/examen-conocimientos/verificar`,
            data: verificacionData,
            timeout: 10000, // 10 segundos de timeout
          })

          console.log("Respuesta de verificación:", verificacionResponse.data)
          return verificacionResponse.data.exists
        } catch (error) {
          console.error("Error en verificación directa:", error)

          // Si falla la verificación directa, intentar obtener todos los registros
          try {
            const allRegistrosResponse = await axios.get(`${baseURL}/api/examen-conocimientos`)
            const allRegistros = allRegistrosResponse.data

            // Buscar coincidencia manual por carnet, materia y carrera
            const found = allRegistros.some(
              (registro) =>
                registro.carnet === dataToVerify.carnet &&
                registro.materia === dataToVerify.materia &&
                registro.carrera === dataToVerify.carrera &&
                (!conocimiento || registro._id !== conocimiento._id), // Excluir el registro actual si estamos editando
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
    [baseURL, conocimiento],
  )

  // Buscar postulante por CI y autocompletar nombre, profesión y materias postuladas
  useEffect(() => {
    const fetchPostulante = async () => {
      if (formData.carnet.trim() === "") {
        setFormData((prev) => ({ ...prev, nombre: "", profesion: "" }))
        setMateriasPostuladas([])
        return
      }
      try {
        const response = await axios.get(`${baseURL}/postulaciones/carnet/${formData.carnet}`)
        if (response.data.data) {
          setFormData((prev) => ({
            ...prev,
            nombre: response.data.data.nombre,
            // Se asume que la API retorna la profesión en la propiedad "profesion"
            profesion: response.data.data.profesion || "",
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
          setFormData((prev) => ({ ...prev, nombre: "", profesion: "" }))
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

  // Manejo de cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target
    // Para el campo de examen, se asegura que el estado siempre sea "Habilitado"
    if (name === "examenConocimientos") {
      setFormData((prev) => ({ ...prev, [name]: value, habilitado: "Habilitado" }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Manejo específico al seleccionar una materia; asigna también la carrera correspondiente
  const handleMateriaChange = (e) => {
    const selectedMateria = e.target.value
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

  // Obtención de un arreglo único de carreras a partir de las materias postuladas
  const uniqueCarreras = Array.from(new Set(materiasPostuladas.map((mat) => mat.carrera)))
  // Filtrar materias según el filtro de carrera seleccionado
  const materiasFiltradas =
    filtroCarrera.trim() !== "" ? materiasPostuladas.filter((mat) => mat.carrera === filtroCarrera) : materiasPostuladas

  // Cálculo de la nota final (40% del examen teórico-científico)
  const examenScore = Number.parseFloat(formData.examenConocimientos) || 0
  const notaFinal = (examenScore * 0.4).toFixed(2)

  // Validación del formulario
  const validateForm = useCallback(() => {
    if (!/^\d{1,10}$/.test(formData.carnet)) {
      showAlert("error", "Error", "El CI debe contener solo números y máximo 10 dígitos.")
      return false
    }

    if (!formData.nombre.trim()) {
      showAlert("error", "Error", "No se encontró un postulante con el CI ingresado.")
      return false
    }

    if (!formData.materia.trim() || !formData.carrera.trim()) {
      showAlert("error", "Error", "Debe seleccionar una materia.")
      return false
    }

    if (!formData.fecha.trim()) {
      showAlert("error", "Error", "Debe seleccionar una fecha.")
      return false
    }

    if (!formData.examenConocimientos.trim() || isNaN(Number.parseFloat(formData.examenConocimientos))) {
      showAlert("error", "Error", "Debe ingresar un valor numérico para el examen de conocimientos.")
      return false
    }

    return true
  }, [formData, showAlert])

  // Indicador de progreso en función de los campos completados
  const totalFields = Object.keys(formData).length
  const filledFields = Object.values(formData).filter((val) => val !== "" && val !== null).length
  const progressPercentage = Math.round((filledFields / totalFields) * 100)

  // Reemplazar la función handleSubmit completa with this implementation más simple
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Evitar múltiples envíos simultáneos
    if (isSubmitting || isVerifying) return

    // Validar el formulario
    if (!validateForm()) return

    // Generar un ID único para esta operación
    const operationId = generateOperationId()
    setLastOperationId(operationId)

    // Verificar si ya existe un registro con los mismos datos
    const registroExistente = await verificarRegistroExistente(formData)
    if (registroExistente && !conocimiento) {
      return showAlert(
        "warning",
        "Registro duplicado",
        "Ya existe un registro para este postulante con la misma materia y carrera.",
      )
    }

    // Marcar como enviando
    setIsSubmitting(true)

    // Guardar los datos que se van a enviar para verificación posterior
    const dataToSubmit = { ...formData, notaFinal }

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
      if (conocimiento && conocimiento._id) {
        // Actualizar registro existente
        await axios({
          method: "put",
          url: `${baseURL}/api/examen-conocimientos/${conocimiento._id}`,
          data: dataToSubmit,
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
          if (onConocimientoRegistered) {
            onConocimientoRegistered()
          }
        })
      } else {
        // Preparar datos para nuevo registro
        const user = JSON.parse(localStorage.getItem("user"))
        if (user) {
          dataToSubmit.evaluadorId = user._id
          if (!dataToSubmit.nombreEvaluador) {
            dataToSubmit.nombreEvaluador = user.nombre || ""
          }
        }

        // Crear nuevo registro
        const response = await axios({
          method: "post",
          url: `${baseURL}/api/examen-conocimientos`,
          data: dataToSubmit,
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
          if (onConocimientoRegistered) {
            onConocimientoRegistered(response.data)
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
      if (shouldVerifyRegistration && !conocimiento) {
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
              if (onConocimientoRegistered) {
                onConocimientoRegistered()
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
                if (onConocimientoRegistered) {
                  onConocimientoRegistered()
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

  // Definir las secciones para la navegación por pestañas en móvil
  const tabs = [
    { id: 0, name: "Datos", icon: <User className="w-5 h-5" /> },
    { id: 1, name: "Académico", icon: <Book className="w-5 h-5" /> },
    { id: 2, name: "Evaluación", icon: <Award className="w-5 h-5" /> },
    { id: 3, name: "Observaciones", icon: <FileText className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-4 px-2 sm:py-6">
      <div className="w-full mx-auto">
        <div className="w-full bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-xl border border-gray-100">
          {/* Encabezado */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
              <ClipboardCheck className="h-8 w-8 text-blue-700" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {conocimiento ? "Editar Registro de Conocimientos" : "Registro de Conocimientos"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Complete el formulario para {conocimiento ? "actualizar" : "registrar"} el examen de conocimientos
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
          <form onSubmit={handleSubmit} id="conocimientoForm" className="space-y-6">
            {/* Sección 1: Datos del Evaluador y Postulante */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 0 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Datos del Evaluador y Postulante
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Nombre de Evaluador */}
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

                  {/* Campo Profesión */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profesión <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="profesion"
                        value={formData.profesion}
                        onChange={handleChange}
                        placeholder="Profesión autocompletada"
                        readOnly
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Se autocompleta al ingresar el CI</p>
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
              </div>
            </div>

            {/* Sección 2: Información Académica */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 1 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <Book className="h-5 w-5 mr-2" />
                  Información Académica
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Filtro para materias por Carrera */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar materias por Carrera:</label>
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

            {/* Sección 3: Evaluación de Conocimiento */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 2 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Evaluación de Conocimiento
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Campo Examen Conocimientos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Examen Conocimientos (40%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Award className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      name="examenConocimientos"
                      value={formData.examenConocimientos}
                      onChange={handleChange}
                      placeholder="Ingrese la nota del examen"
                      title="Ingrese la nota del examen"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Nota Final */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                    Nota Final
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700">
                      Examen (40%): <span className="font-semibold">{(examenScore * 0.4).toFixed(2)}</span>
                    </p>
                    <p className="text-base font-bold text-blue-800">Nota Final: {notaFinal}</p>
                  </div>
                </div>

                {/* Campo Estado (fijo "Habilitado") */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <input
                      type="text"
                      name="habilitado"
                      value={formData.habilitado}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 border border-green-300 rounded-lg bg-gray-100 cursor-not-allowed text-green-700"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Estado fijo para examen de conocimientos</p>
                </div>
              </div>
            </div>

            {/* Sección 4: Observaciones */}
            <div
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${activeTab !== 3 && "hidden md:block"}`}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Observaciones
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="relative">
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    placeholder="Ingrese observaciones..."
                    rows="4"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  ></textarea>
                </div>
                <p className="mt-1 text-xs text-gray-500">Información adicional sobre la evaluación</p>
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
                      {conocimiento ? "Guardar Cambios" : "Registrar"}
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
            document.getElementById("conocimientoForm").requestSubmit()
          }
        }}
        disabled={isSubmitting || isVerifying}
        className={`fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 z-50 ${
          isSubmitting || isVerifying
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        } md:hidden`}
        title={conocimiento ? "Actualizar Registro" : "Registrar Conocimiento"}
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

export default Registrodeconocimientos
