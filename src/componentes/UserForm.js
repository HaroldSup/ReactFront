"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Swal from "sweetalert2"

const initialFormData = {
  nombre: "",
  nombreUsuario: "",
  email: "",
  password: "",
  activo: true,
  administrador: false,
  carrera: "", // Nuevo campo de carrera (string)
  permisos: {
    "Lista de Acefalías": true,
    "Registrar Acefalia": true,
    Usuarios: true,
    Postulaciones: true,
    "Postulaciones por Carrera": true,
    "Concurso de Méritos": true,
    "Examen de Conocimientos": true, // NUEVO: Permiso para Examen de Conocimientos
    "Examen de Competencias": true,
    "Firma Digital": true,
  },
}

const carrerasList = [
  "Ingeniería de Sistemas",
  "Ingeniería de Sistemas Electrónicos",
  "Ingeniería Agroindustrial",
  "Ingeniería Civil",
  "Ingeniería Comercial",
]

const UserForm = ({ user, onUserRegistered }) => {
  const [formData, setFormData] = useState(initialFormData)

  // Estados para controlar el proceso de envío y verificación
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastOperationId, setLastOperationId] = useState(null)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: "", // por seguridad no se muestra la contraseña
      })
    } else {
      setFormData(initialFormData)
    }
  }, [user])

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

  // Función para verificar si un usuario ya existe
  const verificarUsuario = useCallback(
    async (dataToVerify) => {
      try {
        setIsVerifying(true)

        // Datos mínimos necesarios para verificar
        const verificacionData = {
          email: dataToVerify.email,
          nombreUsuario: dataToVerify.nombreUsuario,
        }

        console.log("Verificando usuario:", verificacionData)

        // Intentar verificar directamente con un endpoint específico
        try {
          const verificacionResponse = await axios({
            method: "post",
            url: `${baseURL}/usuarios/verificar`,
            data: verificacionData,
            timeout: 10000, // 10 segundos de timeout
          })

          console.log("Respuesta de verificación:", verificacionResponse.data)
          return verificacionResponse.data.exists
        } catch (error) {
          console.error("Error en verificación directa:", error)

          // Si falla la verificación directa, intentar obtener todos los usuarios
          try {
            const allUsuariosResponse = await axios.get(`${baseURL}/usuarios`)
            const allUsuarios = allUsuariosResponse.data

            // Buscar coincidencia manual por email o nombre de usuario
            const found = allUsuarios.some(
              (usuario) => usuario.email === dataToVerify.email || usuario.nombreUsuario === dataToVerify.nombreUsuario,
            )

            console.log("Verificación alternativa:", found)
            return found
          } catch (secondError) {
            console.error("Error en verificación alternativa:", secondError)
            return false
          }
        }
      } catch (error) {
        console.error("Error al verificar usuario:", error)
        return false
      } finally {
        setIsVerifying(false)
      }
    },
    [baseURL],
  )

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Evitar múltiples envíos simultáneos
    if (isSubmitting || isVerifying) return

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
      let response
      if (user) {
        // Editar usuario existente
        response = await axios({
          method: "put",
          url: `${baseURL}/usuarios/${user._id}`,
          data: formData,
          timeout: 15000, // 15 segundos de timeout
        })

        // Cerrar el indicador de carga
        Swal.close()

        // Verificar la respuesta
        if (response.status === 200 || response.status === 201) {
          // Pequeño retraso para asegurar que el SweetAlert anterior se cierre completamente
          setTimeout(() => {
            showAlert("success", "¡Edición exitosa!", "Usuario editado exitosamente.", () => {
              // Solo notificar al componente padre si esta es la operación más reciente
              if (operationId === lastOperationId && onUserRegistered) {
                onUserRegistered()
              }
            })
          }, 300)
        } else {
          throw new Error("Respuesta inesperada del servidor")
        }
      } else {
        // Registrar nuevo usuario
        response = await axios({
          method: "post",
          url: `${baseURL}/usuarios/register`,
          data: formData,
          timeout: 15000, // 15 segundos de timeout
        })

        // Cerrar el indicador de carga
        Swal.close()

        // Verificar la respuesta
        if (response.status === 200 || response.status === 201) {
          // Pequeño retraso para asegurar que el SweetAlert anterior se cierre completamente
          setTimeout(() => {
            showAlert("success", "¡Registro exitoso!", "Usuario registrado exitosamente.", () => {
              // Limpiar el formulario y notificar al componente padre
              setFormData(initialFormData)
              // Solo notificar al componente padre si esta es la operación más reciente
              if (operationId === lastOperationId && onUserRegistered) {
                onUserRegistered()
              }
            })
          }, 300)
        } else {
          throw new Error("Respuesta inesperada del servidor")
        }
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error)

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
      if (shouldVerifyRegistration && !user) {
        try {
          // Cerrar el indicador de carga actual
          Swal.close()

          // Mostrar indicador de verificación
          Swal.fire({
            title: "Verificando registro...",
            text: "Estamos verificando si el usuario fue registrado correctamente",
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            didOpen: () => {
              Swal.showLoading()
            },
          })

          // Esperar un momento antes de verificar (para dar tiempo a que se complete la operación en el servidor)
          await new Promise((resolve) => setTimeout(resolve, 3000))

          // Verificar si el usuario se registró a pesar del error
          const usuarioRegistrado = await verificarUsuario(dataToSubmit)

          // Cerrar el indicador de verificación
          Swal.close()

          if (usuarioRegistrado) {
            // El usuario sí se registró a pesar del error de conexión
            setTimeout(() => {
              showAlert(
                "success",
                "¡Registrado correctamente!",
                "A pesar del error de conexión, el usuario fue registrado exitosamente.",
                () => {
                  // Limpiar el formulario y notificar al componente padre
                  setFormData(initialFormData)
                  // Solo notificar al componente padre si esta es la operación más reciente
                  if (operationId === lastOperationId && onUserRegistered) {
                    onUserRegistered()
                  }
                },
              )
            }, 300)
            return
          } else {
            // Intentar una última verificación después de un tiempo adicional
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const segundaVerificacion = await verificarUsuario(dataToSubmit)

            if (segundaVerificacion) {
              setTimeout(() => {
                showAlert(
                  "success",
                  "¡Registrado correctamente!",
                  "El usuario fue registrado exitosamente después de una verificación adicional.",
                  () => {
                    // Limpiar el formulario y notificar al componente padre
                    setFormData(initialFormData)
                    if (operationId === lastOperationId && onUserRegistered) {
                      onUserRegistered()
                    }
                  },
                )
              }, 300)
              return
            }

            // El usuario no se registró, mostrar el error original
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
  const filledFields = Object.values(formData).filter((val) => {
    if (typeof val === "string") return val.trim() !== ""
    if (typeof val === "boolean") return true
    if (Array.isArray(val)) return val.length > 0
    if (typeof val === "object" && val !== null) return Object.values(val).some((v) => v === true)
    return val !== null && val !== undefined
  }).length
  const progressPercentage = Math.round((filledFields / totalFields) * 100)

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="w-full bg-white p-6 md:p-10 rounded-xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-blue-800 mb-8">
            {user ? "Editar Usuario" : "Registrar Usuario"}
          </h2>

          {/* Indicador de Progreso */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} id="userForm" className="space-y-6">
            {/* Sección 1: Información Personal */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                  <input
                    type="text"
                    name="nombreUsuario"
                    value={formData.nombreUsuario}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {!user && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sección 2: Selección de Carrera */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Carrera</h3>
              <select
                name="carrera"
                value={formData.carrera}
                onChange={handleChange}
                required
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleccione una carrera</option>
                {carrerasList.map((carrera) => (
                  <option key={carrera} value={carrera}>
                    {carrera}
                  </option>
                ))}
              </select>
            </div>

            {/* Sección 3: Opciones */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Opciones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} />
                    <span>Usuario Activo</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="administrador"
                      checked={formData.administrador}
                      onChange={handleChange}
                    />
                    <span>Usuario Administrador</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sección 4: Permisos */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Permisos</h3>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    permisos: Object.keys(prev.permisos).reduce((acc, key) => {
                      acc[key] = true
                      return acc
                    }, {}),
                  }))
                }}
                className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 mb-4"
              >
                Seleccionar Todos
              </button>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.keys(formData.permisos).map((permiso) => (
                  <label key={permiso} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permisos[permiso]}
                      onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          permisos: { ...prev.permisos, [permiso]: !prev.permisos[permiso] },
                        }))
                      }}
                    />
                    <span>{permiso}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row justify-end space-x-4 mt-6">
              <button
                type="submit"
                disabled={isSubmitting || isVerifying}
                className={`py-2 px-4 ${
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
                ) : user ? (
                  "Guardar Cambios"
                ) : (
                  "Registrar"
                )}
              </button>
              <button
                type="button"
                disabled={isSubmitting || isVerifying}
                onClick={onUserRegistered}
                className={`py-2 px-4 ${
                  isSubmitting || isVerifying ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"
                } text-white font-semibold rounded-lg shadow-md transition duration-200`}
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
            document.getElementById("userForm").requestSubmit()
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

export default UserForm
