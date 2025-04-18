"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Swal from "sweetalert2"

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

function AcefaliaForm({ acefalia, onAcefaliaRegistered }) {
  const [formData, setFormData] = useState({
    asignatura: "",
    requisitos: "",
    semestre: "",
    nivelAcademico: "Grado", // Se asigna "Grado" por defecto
    carrera: "",
    gestion: "I-2024",
    horasTeoria: 0,
    horasPracticas: 0,
    horasLaboratorio: 0,
    motivosAcefalia: "",
  })

  // Estado para controlar si hay una solicitud en curso
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Estado para controlar si se está verificando el registro
  const [isVerifying, setIsVerifying] = useState(false)
  // Estado para almacenar el ID de la última operación
  const [lastOperationId, setLastOperationId] = useState(null)

  // Determinar la URL base dependiendo del entorno
  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Si se recibe una acefalia para edición, se carga en el formulario
  useEffect(() => {
    if (acefalia) {
      setFormData({ ...acefalia })
    }
  }, [acefalia])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

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

  const validateForm = useCallback(() => {
    // Expresiones regulares para validaciones:
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
    const numericRegex = /^[0-9]+$/

    if (!formData.asignatura.trim() || !nameRegex.test(formData.asignatura.trim())) {
      showAlert("error", "Asignatura inválida", "La asignatura es obligatoria y debe contener solo letras.")
      return false
    }
    if (!formData.requisitos.trim()) {
      showAlert("error", "Requisitos vacíos", "El campo requisitos es obligatorio.")
      return false
    }
    if (!formData.semestre) {
      showAlert("error", "Semestre no seleccionado", "Debe seleccionar un semestre.")
      return false
    }
    if (!formData.nivelAcademico) {
      showAlert("error", "Nivel académico", "Debe seleccionar un nivel académico.")
      return false
    }
    if (!formData.carrera) {
      showAlert("error", "Carrera no seleccionada", "Debe seleccionar una carrera.")
      return false
    }
    if (!formData.gestion.trim()) {
      showAlert("error", "Gestión vacía", "El campo gestión es obligatorio.")
      return false
    }
    // Validaciones para las horas (deben ser numéricas y no negativas)
    if (isNaN(formData.horasTeoria) || formData.horasTeoria < 0) {
      showAlert("error", "Horas Teoría inválidas", "Las horas de teoría deben ser un número no negativo.")
      return false
    }
    if (isNaN(formData.horasPracticas) || formData.horasPracticas < 0) {
      showAlert("error", "Horas Prácticas inválidas", "Las horas prácticas deben ser un número no negativo.")
      return false
    }
    if (isNaN(formData.horasLaboratorio) || formData.horasLaboratorio < 0) {
      showAlert("error", "Horas Laboratorio inválidas", "Las horas de laboratorio deben ser un número no negativo.")
      return false
    }
    if (!formData.motivosAcefalia.trim()) {
      showAlert("error", "Motivos vacíos", "El campo de motivos de la acefalia es obligatorio.")
      return false
    }

    return true
  }, [formData, showAlert])

  // Función para verificar si una materia ya existe
  const verificarMateria = useCallback(
    async (dataToVerify) => {
      try {
        setIsVerifying(true)

        // Datos mínimos necesarios para verificar
        const verificacionData = {
          asignatura: dataToVerify.asignatura,
          carrera: dataToVerify.carrera,
          semestre: dataToVerify.semestre,
        }

        console.log("Verificando materia:", verificacionData)

        // Asegúrate de que la URL sea correcta - ajusta según tu estructura de API
        const verificacionUrl = `${baseURL}/materias/verificar`

        const verificacionResponse = await axios({
          method: "post",
          url: verificacionUrl,
          data: verificacionData,
          timeout: 10000, // 10 segundos de timeout
        })

        console.log("Respuesta de verificación:", verificacionResponse.data)

        return verificacionResponse.data.exists
      } catch (error) {
        console.error("Error al verificar materia:", error)

        // Si hay un error al verificar, intentamos una búsqueda alternativa
        try {
          // Intenta obtener todas las materias y filtrar manualmente
          const allMateriasResponse = await axios.get(`${baseURL}/materias`)
          const allMaterias = allMateriasResponse.data

          // Buscar coincidencia manual
          const found = allMaterias.some(
            (materia) =>
              materia.asignatura === dataToVerify.asignatura &&
              materia.carrera === dataToVerify.carrera &&
              materia.semestre === dataToVerify.semestre,
          )

          console.log("Verificación alternativa:", found)
          return found
        } catch (secondError) {
          console.error("Error en verificación alternativa:", secondError)
          return false
        }
      } finally {
        setIsVerifying(false)
      }
    },
    [baseURL],
  )

  // Función para generar un ID único para la operación
  const generateOperationId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5)
  }, [])

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
      const url = acefalia
        ? `${baseURL}/materias/${acefalia._id}` // Para editar
        : `${baseURL}/materias/register` // Para crear

      const method = acefalia ? "put" : "post"

      const response = await axios({
        method: method,
        url: url,
        data: dataToSubmit,
        timeout: 15000, // Timeout de 15 segundos
      })

      // Cerrar el indicador de carga
      Swal.close()

      // Verificar la respuesta
      if (response.status === 200 || response.status === 201) {
        // Pequeño retraso para asegurar que el SweetAlert anterior se cierre completamente
        setTimeout(() => {
          showAlert(
            "success",
            acefalia ? "¡Actualizado!" : "¡Registrado!",
            acefalia ? "Materia actualizada exitosamente." : "Materia registrada exitosamente.",
            () => {
              // Solo notificar al componente padre si esta es la operación más reciente
              if (operationId === lastOperationId && onAcefaliaRegistered) {
                onAcefaliaRegistered()
              }
            },
          )
        }, 300)
      } else {
        throw new Error("Respuesta inesperada del servidor")
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error)

      // Determinar el mensaje de error apropiado
      let errorMessage = "Hubo un problema al procesar la solicitud. Inténtalo de nuevo."
      let shouldVerifyRegistration = false

      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        errorMessage = error.response.data?.message || "Error en la respuesta del servidor."
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió respuesta - posible problema de red
        errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión a internet."
        shouldVerifyRegistration = true // Verificar si se registró a pesar del error
      } else {
        // Algo ocurrió al configurar la solicitud
        errorMessage = error.message || "Error al preparar la solicitud."
      }

      // Si es un error de conexión y no estamos editando, verificar si los datos se guardaron
      if (shouldVerifyRegistration && !acefalia) {
        try {
          // Cerrar el indicador de carga actual
          Swal.close()

          // Mostrar indicador de verificación
          Swal.fire({
            title: "Verificando registro...",
            text: "Estamos verificando si la materia fue registrada correctamente",
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            didOpen: () => {
              Swal.showLoading()
            },
          })

          // Esperar un momento antes de verificar (para dar tiempo a que se complete la operación en el servidor)
          await new Promise((resolve) => setTimeout(resolve, 3000))

          // Verificar si la materia se registró a pesar del error
          const materiaRegistrada = await verificarMateria(dataToSubmit)

          // Cerrar el indicador de verificación
          Swal.close()

          if (materiaRegistrada) {
            // La materia sí se registró a pesar del error de conexión
            setTimeout(() => {
              showAlert(
                "success",
                "¡Registrado correctamente!",
                "A pesar del error de conexión, la materia fue registrada exitosamente.",
                () => {
                  // Solo notificar al componente padre si esta es la operación más reciente
                  if (operationId === lastOperationId && onAcefaliaRegistered) {
                    onAcefaliaRegistered()
                  }
                },
              )
            }, 300)
            return
          } else {
            // Intentar una última verificación después de un tiempo adicional
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const segundaVerificacion = await verificarMateria(dataToSubmit)

            if (segundaVerificacion) {
              setTimeout(() => {
                showAlert(
                  "success",
                  "¡Registrado correctamente!",
                  "La materia fue registrada exitosamente después de una verificación adicional.",
                  () => {
                    if (operationId === lastOperationId && onAcefaliaRegistered) {
                      onAcefaliaRegistered()
                    }
                  },
                )
              }, 300)
              return
            }

            // La materia no se registró, mostrar el error original
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

  // Cálculo del progreso de campos completados
  const totalFields = Object.keys(formData).length
  const filledFields = Object.values(formData).filter((val) => val !== "" && val !== null).length
  const progressPercentage = Math.round((filledFields / totalFields) * 100)

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      {/* Contenedor responsivo centrado con ancho máximo */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="w-full bg-white p-6 sm:p-10 rounded-xl shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-blue-800 mb-4">
            {acefalia ? "Editar Acefalia" : "Registrar Acefalia"}
          </h2>
          {/* Indicador de Progreso */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección 1: Información de la Materia */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Información de la Materia</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Asignatura */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Asignatura:</label>
                  <input
                    type="text"
                    name="asignatura"
                    value={formData.asignatura}
                    onChange={handleChange}
                    onKeyPress={(e) => {
                      // Permitir solo letras (incluyendo acentos y ñ) y espacios
                      const allowed = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]$/
                      if (!allowed.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {/* Semestre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Semestre:</label>
                  <select
                    name="semestre"
                    value={formData.semestre}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">--Seleccionar--</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={`SEMESTRE ${i + 1}`}>
                        SEMESTRE {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Gestión */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gestión:</label>
                  <input
                    type="text"
                    name="gestion"
                    value={formData.gestion}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {/* Nivel Académico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nivel Académico:</label>
                  <select
                    name="nivelAcademico"
                    value={formData.nivelAcademico}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Grado">Grado</option>
                  </select>
                </div>
                {/* Carrera */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Carrera:</label>
                  <select
                    name="carrera"
                    value={formData.carrera}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">--Seleccionar--</option>
                    <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                    <option value="Ingeniería de Sistemas Electrónicos">Ingeniería de Sistemas Electrónicos</option>
                    <option value="Ingeniería Agroindustrial">Ingeniería Agroindustrial</option>
                    <option value="Ingeniería Civil">Ingeniería Civil</option>
                    <option value="Ingeniería Comercial">Ingeniería Comercial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección 2: Horas */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Horas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Horas Teoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horas Teoría:</label>
                  <input
                    type="number"
                    name="horasTeoria"
                    value={formData.horasTeoria}
                    onChange={handleChange}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {/* Horas Prácticas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horas Prácticas:</label>
                  <input
                    type="number"
                    name="horasPracticas"
                    value={formData.horasPracticas}
                    onChange={handleChange}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {/* Horas Laboratorio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horas Laboratorio:</label>
                  <input
                    type="number"
                    name="horasLaboratorio"
                    value={formData.horasLaboratorio}
                    onChange={handleChange}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Detalles */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Detalles</h3>
              <div className="grid grid-cols-1 gap-6">
                {/* Requisitos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requisitos:</label>
                  <textarea
                    name="requisitos"
                    value={formData.requisitos}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {/* Motivos de la Acefalia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Motivos de la Acefalia:</label>
                  <textarea
                    name="motivosAcefalia"
                    value={formData.motivosAcefalia}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Botones de Aceptar/Actualizar y Cancelar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
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
                ) : acefalia ? (
                  "Actualizar"
                ) : (
                  "Aceptar"
                )}
              </button>
              <button
                type="button"
                disabled={isSubmitting || isVerifying}
                className={`flex-1 py-2 px-4 ${
                  isSubmitting || isVerifying ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"
                } text-white font-semibold rounded-lg shadow-md transition duration-200`}
                onClick={() => {
                  if (!isSubmitting && !isVerifying) {
                    showAlert("info", "Cancelado", "La operación fue cancelada")
                  }
                }}
              >
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
        className={`fixed bottom-4 right-4 ${
          isSubmitting || isVerifying ? "bg-gray-500" : "bg-blue-800 hover:bg-blue-900"
        } text-white p-4 rounded-full shadow-lg transition md:hidden`}
        title="Enviar Formulario"
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

export default AcefaliaForm
