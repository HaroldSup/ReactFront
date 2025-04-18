"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Swal from "sweetalert2"

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
      } else {
        // Crear nuevo registro
        response = await axios({
          method: "post",
          url: `${baseURL}/api/examen-competencias`,
          data: dataToSend,
          timeout: 15000, // 15 segundos de timeout
        })
      }

      // Cerrar el indicador de carga
      Swal.close()

      // Verificar la respuesta
      if (response.status === 200 || response.status === 201) {
        // Pequeño retraso para asegurar que el SweetAlert anterior se cierre completamente
        setTimeout(() => {
          Swal.fire({
            icon: "success",
            title: competencia ? "¡Actualizado!" : "¡Registrado!",
            text: competencia ? "Registro actualizado exitosamente." : "Registro creado exitosamente.",
            confirmButtonText: "Aceptar",
          }).then(() => {
            // Llamar directamente a onCompetenciaRegistered como en el código original
            if (onCompetenciaRegistered) {
              onCompetenciaRegistered(competencia ? null : response.data)
            }
          })
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
      if (shouldVerifyRegistration && !competencia) {
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
                "A pesar del error de conexión, el registro fue guardado exitosamente. Redirigiendo en 2 segundos...",
                () => {
                  // Solo notificar al componente padre si esta es la operación más reciente
                  if (operationId === lastOperationId) {
                    onCompetenciaRegistered()
                  }
                },
                true, // Activar redirección automática
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
                  "El registro fue guardado exitosamente después de una verificación adicional. Redirigiendo en 2 segundos...",
                  () => {
                    if (operationId === lastOperationId) {
                      onCompetenciaRegistered()
                    }
                  },
                  true, // Activar redirección automática
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

  // Obtenemos un arreglo único de carreras a partir de las materias postuladas
  const uniqueCarreras = Array.from(new Set(materiasPostuladas.map((mat) => mat.carrera)))

  // Filtrar materias según el filtro de carrera
  const materiasFiltradas =
    filtroCarrera.trim() !== "" ? materiasPostuladas.filter((mat) => mat.carrera === filtroCarrera) : materiasPostuladas

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            {competencia ? "Editar Competencia" : "Registrar Competencia"}
          </h2>

          {/* Indicador de Progreso */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          {/* Selección del tipo de evaluador */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <label className="block text-lg font-bold text-gray-700 mb-2">Seleccionar tipo de Evaluador</label>
            <select
              name="tipoEvaluador"
              value={formData.tipoEvaluador}
              onChange={handleChange}
              required
              title="Seleccione el tipo de evaluador"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione</option>
              <option value="Evaluador 1">Evaluador 1</option>
              <option value="Evaluador 2">Evaluador 2</option>
              <option value="Presidente Tribunal">Presidente Tribunal</option>
            </select>
            {formData.tipoEvaluador === "" && (
              <p className="text-xs text-red-500 mt-1">Debe seleccionar un tipo de evaluador.</p>
            )}
          </div>

          <form onSubmit={handleSubmit} id="competenciaForm" className="space-y-6">
            {/* Registro de datos del postulante */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Registro de datos del postulante</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo CI */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">CI</label>
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Campo Nombre del Postulante */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Nombre del Postulante</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    readOnly
                    placeholder="Nombre autocompletado"
                    title="El nombre se autocompleta al ingresar el CI"
                    required
                    className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* Filtro para materias: se filtran por carrera */}
              <div className="mt-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">Filtrar materias por Carrera:</label>
                <select
                  value={filtroCarrera}
                  onChange={(e) => setFiltroCarrera(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Selección de la materia postulada (filtrada por la carrera seleccionada) */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Seleccionar Materia Postulada</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Materia</label>
                  <select
                    name="materia"
                    value={formData.materia}
                    onChange={handleMateriaChange}
                    required
                    title="Seleccione la asignatura a la que postula"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección para ingresar el Nombre del Evaluador */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Nombre de Evaluador</h3>
              <input
                type="text"
                name="nombreEvaluador"
                value={formData.nombreEvaluador}
                onChange={handleChange}
                placeholder="Ingrese el nombre del evaluador"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Segunda Etapa: Exposición del Plan de Trabajo (30%) */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                Segunda Etapa: Exposición del Plan de Trabajo (30%)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Concordancia con el perfil profesional
                  </label>
                  <select
                    name="planConcordancia"
                    value={formData.planConcordancia}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para este criterio"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="20">20 - Excelente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Competencia</label>
                  <select
                    name="planCompetencia"
                    value={formData.planCompetencia}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para competencia"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="20">20 - Excelente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Contenidos</label>
                  <select
                    name="planContenidos"
                    value={formData.planContenidos}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para contenidos"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="20">20 - Excelente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Estrategias de enseñanza</label>
                  <select
                    name="planEstrategiasEnsenanza"
                    value={formData.planEstrategiasEnsenanza}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para estrategias de enseñanza"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="20">20 - Excelente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Estrategias de evaluación</label>
                  <select
                    name="planEstrategiasEvaluacion"
                    value={formData.planEstrategiasEvaluacion}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para estrategias de evaluación"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="20">20 - Excelente</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-lg font-semibold ${stage2Color}`}>Sumatoria: {stage2Sum} / 100</p>
                <p className="text-lg font-semibold">Promedio (30%): {stage2Promedio}</p>
              </div>
            </div>

            {/* Tercera Etapa: Evaluación de Procesos Pedagógicos y Didácticos (30%) */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                Tercera Etapa: Evaluación de Procesos Pedagógicos y Didácticos (30%)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Motivación a los estudiantes</label>
                  <select
                    name="procesoMotivacion"
                    value={formData.procesoMotivacion}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para motivación"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="25">25 - Excelente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Dominio y Conocimiento de la unidad didáctica
                  </label>
                  <select
                    name="procesoDominio"
                    value={formData.procesoDominio}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para dominio y conocimiento"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="25">25 - Excelente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Uso de las TICs</label>
                  <select
                    name="procesoTICs"
                    value={formData.procesoTICs}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para el uso de las TICs"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="25">25 - Excelente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Explicación de la unidad temática en relación con el perfil profesional
                  </label>
                  <select
                    name="procesoExplicacion"
                    value={formData.procesoExplicacion}
                    onChange={handleChange}
                    required
                    title="Seleccione la puntuación para la explicación de la unidad"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione</option>
                    <option value="10">10 - Regular</option>
                    <option value="15">15 - Bueno</option>
                    <option value="25">25 - Excelente</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-lg font-semibold ${stage3Color}`}>Sumatoria: {stage3Sum} / 100</p>
                <p className="text-lg font-semibold">Promedio (30%): {stage3Promedio}</p>
              </div>
            </div>

            {/* Resultados */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Resultados</h3>
              <div className="text-xl font-semibold">
                <p>Plan de Trabajo (30%): {stage2Promedio}</p>
                <p>Procesos Pedagógicos (30%): {stage3Promedio}</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-800 text-white font-semibold rounded-lg shadow-md hover:bg-blue-900 transition duration-200"
              >
                {competencia ? "Guardar Cambios" : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Botón flotante para móviles */}
      <button
        type="button"
        onClick={() => document.getElementById("competenciaForm").requestSubmit()}
        className="fixed bottom-4 right-4 bg-blue-800 text-white p-4 rounded-full shadow-lg hover:bg-blue-900 transition md:hidden"
        title="Enviar Formulario"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  )
}

export default RegistroCompetencias
