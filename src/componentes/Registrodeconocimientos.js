"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Swal from "sweetalert2"

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

    try {
      if (conocimiento && conocimiento._id) {
        // Actualizar registro existente
        await axios({
          method: "put",
          url: `${baseURL}/api/examen-conocimientos/${conocimiento._id}`,
          data: dataToSubmit,
          timeout: 15000, // 15 segundos de timeout
        })

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

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="bg-white p-6 md:p-10 rounded-lg shadow-lg w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {conocimiento ? "Editar Conocimiento" : "Registrar Conocimiento"}
          </h2>

          {/* Indicador de Progreso */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} id="conocimientoForm" className="space-y-6">
            {/* Nombre de Evaluador */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <label className="block text-lg font-bold text-gray-700 mb-2">Nombre de Evaluador</label>
              <input
                type="text"
                name="nombreEvaluador"
                value={formData.nombreEvaluador}
                onChange={handleChange}
                placeholder="Ingrese el nombre del evaluador"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Datos del Postulante */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl font-bold text-gray-700 mb-4">Datos del Postulante</h3>
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
                {/* Campo Profesión */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Profesión</label>
                  <input
                    type="text"
                    name="profesion"
                    value={formData.profesion}
                    onChange={handleChange}
                    placeholder="Profesión autocompletada"
                    readOnly
                    required
                    className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"
                  />
                </div>
              </div>
              {/* Campo Fecha */}
              <div className="mt-4">
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

            {/* Información Académica */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl font-bold text-gray-700 mb-4">Información Académica</h3>
              {/* Filtro para materias por Carrera */}
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
            </div>

            {/* Evaluación de Conocimiento */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl font-bold text-gray-700 mb-4">
                Primera Etapa: Evaluación de Conocimiento Teórico-Científico
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo Examen Conocimientos */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Examen Conocimientos (40%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="examenConocimientos"
                    value={formData.examenConocimientos}
                    onChange={handleChange}
                    placeholder="Ingrese la nota del examen"
                    title="Ingrese la nota del examen"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Nota Final */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl font-bold text-gray-700 mb-4">Nota Final</h3>
              <div className="text-lg font-semibold">
                <p>Examen (40%): {(examenScore * 0.4).toFixed(2)}</p>
                <p className="mt-2">Nota Final: {notaFinal}</p>
              </div>
            </div>

            {/* Información adicional: Observaciones y Estado */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo Observaciones */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    placeholder="Ingrese observaciones..."
                    rows="4"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  ></textarea>
                </div>
                {/* Campo Estado (fijo "Habilitado") */}
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

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting || isVerifying}
                className={`w-full sm:w-auto px-6 py-3 ${
                  isSubmitting || isVerifying ? "bg-gray-500" : "bg-gray-600 hover:bg-gray-700"
                } text-white font-semibold rounded-lg shadow-md transition duration-200`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isVerifying}
                className={`w-full sm:w-auto px-6 py-3 ${
                  isSubmitting || isVerifying ? "bg-gray-500" : "bg-blue-800 hover:bg-blue-900"
                } text-white font-bold rounded-lg shadow-md transition duration-200 flex justify-center items-center`}
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
                ) : conocimiento ? (
                  "Guardar Cambios"
                ) : (
                  "Registrar"
                )}
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

export default Registrodeconocimientos
