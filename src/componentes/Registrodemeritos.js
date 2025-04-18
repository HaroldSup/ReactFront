"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Swal from "sweetalert2"

function RegistroDeMeritos({ merito, onMeritoRegistered, onCancel }) {
  const [formData, setFormData] = useState({
    nombrePostulante: "",
    ci: "",
    fechaEvaluacion: "",
    puntosEvaluacion: "",
    nombreEvaluador: "",
    evaluadorId: "",
    profesion: "",
    materia: "",
    carrera: "",
    habilitado: "",
    observaciones: "",
  })

  // Estado para almacenar las materias postuladas (viene de la búsqueda por CI)
  const [materiasPostuladas, setMateriasPostuladas] = useState([])
  // Estado para filtro de carrera para las materias
  const [filtroCarrera, setFiltroCarrera] = useState("")
  // Estado para controlar las materias seleccionadas para registro múltiple
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState([])
  // Estado para mostrar el modo de selección múltiple
  const [modoMultiple, setModoMultiple] = useState(false)

  // Estados para controlar el proceso de envío y verificación
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastOperationId, setLastOperationId] = useState(null)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Si existe un objeto merito (para editar), se remueven propiedades innecesarias y se carga el resto en el estado
  useEffect(() => {
    if (merito) {
      const { carrera, materia, profesion, habilitado, observaciones, ...rest } = merito
      setFormData({
        ...rest,
        profesion: profesion || "",
        materia: materia || "",
        carrera: carrera || "",
        habilitado: habilitado || "",
        observaciones: observaciones || "",
      })
      // Desactivar modo múltiple en edición
      setModoMultiple(false)
    } else {
      // Si no hay merito, establecer la fecha actual por defecto
      setFormData((prev) => ({
        ...prev,
        fechaEvaluacion: new Date().toISOString().split("T")[0],
      }))
    }
  }, [merito])

  // Función para mostrar alertas con SweetAlert2
  const showAlert = useCallback((icon, title, text, callback = null) => {
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
          ci: dataToVerify.ci,
          materia: dataToVerify.materia,
          carrera: dataToVerify.carrera,
        }

        console.log("Verificando registro existente:", verificacionData)

        // Intentar verificar directamente con un endpoint específico
        try {
          const verificacionResponse = await axios({
            method: "post",
            url: `${baseURL}/api/concurso-meritos/verificar`,
            data: verificacionData,
            timeout: 10000, // 10 segundos de timeout
          })

          console.log("Respuesta de verificación:", verificacionResponse.data)
          return verificacionResponse.data.exists
        } catch (error) {
          console.error("Error en verificación directa:", error)

          // Si falla la verificación directa, intentar obtener todos los registros
          try {
            const allRegistrosResponse = await axios.get(`${baseURL}/api/concurso-meritos`)
            const allRegistros = allRegistrosResponse.data

            // Buscar coincidencia manual por CI, materia y carrera
            const found = allRegistros.some(
              (registro) =>
                registro.ci === dataToVerify.ci &&
                registro.materia === dataToVerify.materia &&
                registro.carrera === dataToVerify.carrera &&
                (!merito || registro._id !== merito._id), // Excluir el registro actual si estamos editando
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
    [baseURL, merito],
  )

  // Buscar postulante por CI y autocompletar nombre, profesión y materias postuladas
  useEffect(() => {
    const fetchPostulante = async () => {
      if (formData.ci.trim() === "") {
        setFormData((prev) => ({ ...prev, nombrePostulante: "", profesion: "" }))
        setMateriasPostuladas([])
        setMateriasSeleccionadas([])
        return
      }
      try {
        const response = await axios.get(`${baseURL}/postulaciones/carnet/${formData.ci}`)
        if (response.data.data) {
          setFormData((prev) => ({
            ...prev,
            nombrePostulante: response.data.data.nombre,
            // Se asume que la API retorna la profesión en la propiedad "profesion"
            profesion: response.data.data.profesion || "",
          }))
          if (response.data.data.asignaturasSeleccionadas) {
            const materias =
              typeof response.data.data.asignaturasSeleccionadas === "string"
                ? JSON.parse(response.data.data.asignaturasSeleccionadas)
                : response.data.data.asignaturasSeleccionadas
            setMateriasPostuladas(materias)
            // Limpiar materias seleccionadas cuando cambia el CI
            setMateriasSeleccionadas([])
          } else {
            setMateriasPostuladas([])
            setMateriasSeleccionadas([])
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setFormData((prev) => ({ ...prev, nombrePostulante: "", profesion: "" }))
          setMateriasPostuladas([])
          setMateriasSeleccionadas([])
        }
        console.error("Error al buscar postulante por CI:", error)
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchPostulante()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [formData.ci, baseURL])

  // Manejo de cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    // Al cambiar los puntos se evalúa el estado Habilitado/No habilitado
    if (name === "puntosEvaluacion") {
      const pts = Number.parseInt(value) || 0
      const estado = pts >= 220 ? "Habilitado" : "No habilitado"
      setFormData((prev) => ({ ...prev, [name]: value, habilitado: estado }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Manejo específico para el select de Materia (filtrado por carrera)
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

  // Función para seleccionar/deseleccionar todas las materias
  const toggleSeleccionarTodasMaterias = () => {
    if (materiasSeleccionadas.length === materiasPostuladas.length) {
      // Si todas están seleccionadas, deseleccionar todas
      setMateriasSeleccionadas([])
    } else {
      // Seleccionar todas las materias
      setMateriasSeleccionadas([...materiasPostuladas])
    }
  }

  // Función para manejar la selección individual de materias
  const handleSeleccionMateria = (materia) => {
    if (materiasSeleccionadas.some((m) => m.asignatura === materia.asignatura && m.carrera === materia.carrera)) {
      // Si ya está seleccionada, quitarla
      setMateriasSeleccionadas(
        materiasSeleccionadas.filter((m) => !(m.asignatura === materia.asignatura && m.carrera === materia.carrera)),
      )
    } else {
      // Si no está seleccionada, agregarla
      setMateriasSeleccionadas([...materiasSeleccionadas, materia])
    }
  }

  // Obtenemos un arreglo único de carreras a partir de las materias postuladas
  const uniqueCarreras = Array.from(new Set(materiasPostuladas.map((mat) => mat.carrera)))

  // Filtrar materias según el filtro de carrera seleccionado
  const materiasFiltradas =
    filtroCarrera.trim() !== "" ? materiasPostuladas.filter((mat) => mat.carrera === filtroCarrera) : materiasPostuladas

  // Validación del formulario
  const validateForm = useCallback(() => {
    if (!/^\d{1,10}$/.test(formData.ci)) {
      showAlert("error", "Error", "El CI debe contener solo números y máximo 10 dígitos.")
      return false
    }

    if (!formData.nombrePostulante.trim()) {
      showAlert("error", "Error", "No se encontró un postulante con el CI ingresado.")
      return false
    }

    if (modoMultiple) {
      if (materiasSeleccionadas.length === 0) {
        showAlert("error", "Error", "Debe seleccionar al menos una materia.")
        return false
      }
    } else {
      if (!formData.materia.trim() || !formData.carrera.trim()) {
        showAlert("error", "Error", "Debe seleccionar una materia.")
        return false
      }
    }

    if (!formData.fechaEvaluacion.trim()) {
      showAlert("error", "Error", "Debe seleccionar una fecha de evaluación.")
      return false
    }

    if (!formData.puntosEvaluacion.trim() || isNaN(Number.parseInt(formData.puntosEvaluacion))) {
      showAlert("error", "Error", "Debe ingresar un valor numérico para los puntos de evaluación.")
      return false
    }

    return true
  }, [formData, showAlert, modoMultiple, materiasSeleccionadas])

  // Función para registrar múltiples materias
  const registrarMultiplesMaterias = async () => {
    // Verificar si hay materias seleccionadas
    if (materiasSeleccionadas.length === 0) {
      return showAlert("error", "Error", "Debe seleccionar al menos una materia.")
    }

    // Generar un ID único para esta operación
    const operationId = generateOperationId()
    setLastOperationId(operationId)

    // Marcar como enviando
    setIsSubmitting(true)

    // Mostrar indicador de carga
    Swal.fire({
      title: "Procesando...",
      text: `Registrando ${materiasSeleccionadas.length} materias. Por favor espere...`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      // Preparar objeto base para enviar al backend
      const baseRegistroData = {
        nombrePostulante: formData.nombrePostulante,
        ci: formData.ci,
        fechaEvaluacion: formData.fechaEvaluacion,
        puntosEvaluacion: formData.puntosEvaluacion,
        nombreEvaluador: formData.nombreEvaluador,
        profesion: formData.profesion,
        habilitado: formData.habilitado,
        observaciones: formData.observaciones,
      }

      // Añadir ID del evaluador si es un nuevo registro
      if (!merito) {
        const user = JSON.parse(localStorage.getItem("user"))
        if (user) {
          baseRegistroData.evaluadorId = user._id
          if (!baseRegistroData.nombreEvaluador) {
            baseRegistroData.nombreEvaluador = user.nombre || ""
          }
        }
      }

      // Array para almacenar resultados
      const resultados = []
      const errores = []

      // Procesar cada materia seleccionada
      for (const materia of materiasSeleccionadas) {
        const registroData = {
          ...baseRegistroData,
          materia: materia.asignatura,
          carrera: materia.carrera,
        }

        // Verificar si ya existe un registro para esta materia
        const existe = await verificarRegistroExistente(registroData)
        if (existe) {
          errores.push(`${materia.asignatura} (${materia.carrera}) - Ya existe un registro para esta materia.`)
          continue
        }

        try {
          // Crear nuevo registro
          const response = await axios({
            method: "post",
            url: `${baseURL}/api/concurso-meritos`,
            data: registroData,
            timeout: 15000, // 15 segundos de timeout
          })
          resultados.push(`${materia.asignatura} (${materia.carrera}) - Registrado correctamente.`)
        } catch (error) {
          console.error(`Error al registrar materia ${materia.asignatura}:`, error)
          errores.push(`${materia.asignatura} (${materia.carrera}) - Error: ${error.message || "Error desconocido"}`)
        }
      }

      // Cerrar el indicador de carga
      Swal.close()

      // Mostrar resultados
      if (resultados.length > 0) {
        let mensaje = `<strong>Registros exitosos (${resultados.length}):</strong><br>`
        mensaje += resultados.map((r) => `- ${r}`).join("<br>")

        if (errores.length > 0) {
          mensaje += `<br><br><strong>Errores (${errores.length}):</strong><br>`
          mensaje += errores.map((e) => `- ${e}`).join("<br>")
        }

        Swal.fire({
          icon: "success",
          title: "Proceso completado",
          html: mensaje,
          confirmButtonText: "Aceptar",
        }).then(() => {
          // Limpiar selecciones y notificar al componente padre
          setMateriasSeleccionadas([])
          if (onMeritoRegistered) {
            onMeritoRegistered()
          }
        })
      } else if (errores.length > 0) {
        let mensaje = `<strong>No se pudo completar ningún registro:</strong><br>`
        mensaje += errores.map((e) => `- ${e}`).join("<br>")

        Swal.fire({
          icon: "error",
          title: "Error",
          html: mensaje,
          confirmButtonText: "Aceptar",
        })
      }
    } catch (error) {
      console.error("Error general al registrar materias:", error)
      showAlert("error", "Error", "Ocurrió un error al procesar los registros.")
    } finally {
      // Marcar como no enviando, independientemente del resultado
      setIsSubmitting(false)
    }
  }

  // Manejo del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Si estamos en modo múltiple, usar la función específica
    if (modoMultiple) {
      return registrarMultiplesMaterias()
    }

    // Evitar múltiples envíos simultáneos
    if (isSubmitting || isVerifying) return

    // Validar el formulario
    if (!validateForm()) return

    // Generar un ID único para esta operación
    const operationId = generateOperationId()
    setLastOperationId(operationId)

    // Verificar si ya existe un registro con los mismos datos
    const registroExistente = await verificarRegistroExistente(formData)
    if (registroExistente && !merito) {
      return showAlert(
        "warning",
        "Registro duplicado",
        "Ya existe un registro para este postulante con la misma materia y carrera.",
      )
    }

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
      // Preparar objeto para enviar al backend
      const registroData = { ...formData }
      if (!merito) {
        const user = JSON.parse(localStorage.getItem("user"))
        if (user) {
          registroData.evaluadorId = user._id
          if (!registroData.nombreEvaluador) {
            registroData.nombreEvaluador = user.nombre || ""
          }
        }
      }

      let response
      if (merito) {
        // Actualizar registro existente
        response = await axios({
          method: "put",
          url: `${baseURL}/api/concurso-meritos/${merito._id}`,
          data: registroData,
          timeout: 15000, // 15 segundos de timeout
        })
      } else {
        // Crear nuevo registro
        response = await axios({
          method: "post",
          url: `${baseURL}/api/concurso-meritos`,
          data: registroData,
          timeout: 15000, // 15 segundos de timeout
        })
      }

      // Cerrar el indicador de carga
      Swal.close()

      // Verificar la respuesta
      if (response.status === 200 || response.status === 201) {
        // Pequeño retraso para asegurar que el SweetAlert anterior se cierre completamente
        setTimeout(() => {
          showAlert(
            "success",
            merito ? "¡Actualizado!" : "¡Registrado!",
            merito ? "Registro actualizado correctamente." : "Registro creado correctamente.",
            () => {
              // Solo notificar al componente padre si esta es la operación más reciente
              if (operationId === lastOperationId) {
                if (merito) {
                  onMeritoRegistered()
                } else {
                  onMeritoRegistered(response.data)
                }
              }
            },
          )
        }, 300)
      } else {
        throw new Error("Respuesta inesperada del servidor")
      }
    } catch (error) {
      console.error("Error al guardar el registro:", error)

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
      if (shouldVerifyRegistration && !merito) {
        try {
          // Cerrar el indicador de carga actual
          Swal.close()

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
            setTimeout(() => {
              showAlert(
                "success",
                "¡Registrado correctamente!",
                "A pesar del error de conexión, el registro fue guardado exitosamente.",
                () => {
                  // Solo notificar al componente padre si esta es la operación más reciente
                  if (operationId === lastOperationId) {
                    onMeritoRegistered()
                  }
                },
              )
            }, 300)
            return
          } else {
            // Intentar una última verificación después de un tiempo adicional
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const segundaVerificacion = await verificarRegistroExistente(dataToSubmit)

            if (segundaVerificacion) {
              setTimeout(() => {
                showAlert(
                  "success",
                  "¡Registrado correctamente!",
                  "El registro fue guardado exitosamente después de una verificación adicional.",
                  () => {
                    if (operationId === lastOperationId) {
                      onMeritoRegistered()
                    }
                  },
                )
              }, 300)
              return
            }

            // El registro no se guardó, mostrar el error original
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
        // Para otros tipos de errores o cuando estamos editando, mostrar el error directamente
        setTimeout(() => {
          showAlert("error", "Error", errorMessage)
        }, 300)
      }
    } finally {
      // Marcar como no enviando, independientemente del resultado
      setIsSubmitting(false)
    }
  }

  // Indicador de progreso (se ajusta la cantidad de campos obligatorios)
  const totalFields = 7 // CI, Nombre, Fecha, Puntos, Evaluador, Profesión, Observaciones (y se puede ir ajustando)
  const filledFields = Object.values(formData).filter((val) => val !== "").length
  const progressPercentage = Math.round((filledFields / totalFields) * 100)

  return (
    <div className="min-h-screen bg-gray-100 py-4 overflow-x-hidden">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {merito ? "Editar Nota" : "Registrar Nota"}
          </h2>

          {/* Indicador de Progreso */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          {/* Selector de modo (individual o múltiple) */}
          {!merito && (
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setModoMultiple(false)}
                  className={`px-4 py-2 rounded-lg ${
                    !modoMultiple ? "bg-blue-600 text-white font-bold" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Registro Individual
                </button>
                <button
                  type="button"
                  onClick={() => setModoMultiple(true)}
                  className={`px-4 py-2 rounded-lg ${
                    modoMultiple ? "bg-blue-600 text-white font-bold" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Registro Múltiple
                </button>
              </div>
              {modoMultiple && (
                <p className="mt-2 text-sm text-gray-600">
                  Modo múltiple: Seleccione varias materias para registrarlas con la misma puntuación.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} id="meritoForm" className="space-y-6">
            {/* Sección: Datos del Postulante */}
            <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">Datos del Postulante</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo CI */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">CI</label>
                  <input
                    type="text"
                    name="ci"
                    value={formData.ci}
                    onChange={handleChange}
                    placeholder="Ingrese CI (máximo 10 dígitos)"
                    maxLength="10"
                    pattern="\d{1,10}"
                    title="Solo se permiten números y máximo 10 dígitos"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Campo Nombre del Postulante (autocompletado y bloqueado) */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Nombre del Postulante</label>
                  <input
                    type="text"
                    name="nombrePostulante"
                    value={formData.nombrePostulante}
                    onChange={handleChange}
                    placeholder="Nombre autocompletado"
                    required
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"
                  />
                </div>
                {/* Campo Profesión (autocompletado y bloqueado) */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Profesión</label>
                  <input
                    type="text"
                    name="profesion"
                    value={formData.profesion}
                    onChange={handleChange}
                    placeholder="Profesión autocompletada"
                    required
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"
                  />
                </div>
                {/* Campo Fecha de Evaluación */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Fecha de Evaluación</label>
                  <input
                    type="date"
                    name="fechaEvaluacion"
                    value={formData.fechaEvaluacion}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Información Académica */}
            <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">Información Académica</h3>

              {modoMultiple ? (
                /* Vista de selección múltiple de materias */
                <>
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={toggleSeleccionarTodasMaterias}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
                    >
                      {materiasSeleccionadas.length === materiasPostuladas.length
                        ? "Deseleccionar Todas"
                        : "Seleccionar Todas las Materias"}
                    </button>
                  </div>

                  {/* Filtro para materias por carrera */}
                  <div className="mb-4">
                    <label className="block text-lg font-bold text-gray-700 mb-2">Filtrar materias por Carrera:</label>
                    <select
                      value={filtroCarrera}
                      onChange={(e) => setFiltroCarrera(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    >
                      <option value="">Mostrar todas</option>
                      {uniqueCarreras.map((carrera) => (
                        <option key={carrera} value={carrera}>
                          {carrera}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lista de materias con checkboxes */}
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Materias disponibles ({materiasFiltradas.length}):
                    </h4>
                    {materiasFiltradas.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {materiasFiltradas.map((materia, idx) => (
                          <div
                            key={idx}
                            className={`p-3 border rounded-lg ${
                              materiasSeleccionadas.some(
                                (m) => m.asignatura === materia.asignatura && m.carrera === materia.carrera,
                              )
                                ? "bg-blue-100 border-blue-500"
                                : "bg-white"
                            }`}
                          >
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={materiasSeleccionadas.some(
                                  (m) => m.asignatura === materia.asignatura && m.carrera === materia.carrera,
                                )}
                                onChange={() => handleSeleccionMateria(materia)}
                                className="h-5 w-5"
                              />
                              <span>
                                <strong>{materia.asignatura}</strong> - {materia.carrera}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No se encontraron materias para la carrera seleccionada.</p>
                    )}
                  </div>

                  {/* Resumen de materias seleccionadas */}
                  {materiasSeleccionadas.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-lg font-semibold text-green-800 mb-2">
                        Materias seleccionadas ({materiasSeleccionadas.length}):
                      </h4>
                      <ul className="list-disc list-inside">
                        {materiasSeleccionadas.map((materia, idx) => (
                          <li key={idx} className="text-green-700">
                            {materia.asignatura} - {materia.carrera}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                /* Vista de selección individual de materia */
                <>
                  {/* Filtro para materias por carrera */}
                  <div className="mb-4">
                    <label className="block text-lg font-bold text-gray-700 mb-2">Filtrar materias por Carrera:</label>
                    <select
                      value={filtroCarrera}
                      onChange={(e) => setFiltroCarrera(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    >
                      <option value="">Mostrar todas</option>
                      {uniqueCarreras.map((carrera) => (
                        <option key={carrera} value={carrera}>
                          {carrera}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Selección de Materia */}
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">Materia</label>
                    <select
                      name="materia"
                      value={formData.materia}
                      onChange={handleMateriaChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    >
                      <option value="">Seleccione la asignatura</option>
                      {materiasFiltradas.length > 0 ? (
                        materiasFiltradas.map((mat, idx) => (
                          <option key={idx} value={mat.asignatura}>
                            {mat.asignatura}
                          </option>
                        ))
                      ) : (
                        <option value="">No se encontraron materias para la carrera seleccionada</option>
                      )}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Sección: Datos de Evaluación */}
            <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">Datos de Evaluación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo Nombre de Evaluador */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Nombre de Evaluador</label>
                  <input
                    type="text"
                    name="nombreEvaluador"
                    value={formData.nombreEvaluador}
                    onChange={handleChange}
                    placeholder="Ingrese el nombre del evaluador"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                {/* Campo Puntos de Evaluación */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Puntos de Evaluación</label>
                  <input
                    type="number"
                    name="puntosEvaluacion"
                    min="0"
                    max="10000"
                    value={formData.puntosEvaluacion}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  />
                </div>
                {/* Campo Habilitado/No habilitado (calculado automáticamente) */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Estado</label>
                  <input
                    type="text"
                    name="habilitado"
                    value={formData.habilitado}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Observaciones */}
            <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">Observaciones</h3>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Ingrese observaciones..."
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting || isVerifying}
                className={`w-full sm:w-auto px-6 py-3 ${
                  isSubmitting || isVerifying ? "bg-gray-500" : "bg-gray-500 hover:bg-gray-600"
                } text-white font-semibold rounded-md shadow-md transition`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isVerifying}
                className={`w-full sm:w-auto px-6 py-3 ${
                  isSubmitting || isVerifying ? "bg-gray-500" : "bg-blue-800 hover:bg-blue-900"
                } text-white font-bold rounded-md shadow-md transition flex justify-center items-center`}
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
                ) : modoMultiple ? (
                  "Registrar Materias Seleccionadas"
                ) : merito ? (
                  "Guardar Cambios"
                ) : (
                  "Registrar"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Botón flotante de confirmación para dispositivos móviles */}
      <button
        type="button"
        onClick={() => {
          if (!isSubmitting && !isVerifying) {
            document.getElementById("meritoForm").requestSubmit()
          }
        }}
        disabled={isSubmitting || isVerifying}
        className={`fixed bottom-4 right-4 ${
          isSubmitting || isVerifying ? "bg-gray-500" : "bg-blue-800 hover:bg-blue-900"
        } text-white p-4 rounded-full shadow-lg transition md:hidden`}
        title="Guardar Registro"
      >
        {isSubmitting || isVerifying ? (
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24">
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default RegistroDeMeritos
