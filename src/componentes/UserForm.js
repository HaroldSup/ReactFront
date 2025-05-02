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
  carrera: "",
  permisos: {
    "Lista de Acefalías": true,
    "Registrar Acefalia": true,
    Usuarios: true,
    Postulaciones: true,
    "Postulaciones por Carrera": true,
    "Concurso de Méritos": true,
    "Examen de Conocimientos": true,
    "Examen de Competencias": true,
    "Firma Digital": true,
    Reportes: true,
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastOperationId, setLastOperationId] = useState(null)
  const [passwordVisible, setPasswordVisible] = useState(false)

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

  // Función para seleccionar/deseleccionar todos los permisos
  const toggleAllPermissions = (value) => {
    setFormData((prev) => ({
      ...prev,
      permisos: Object.keys(prev.permisos).reduce((acc, key) => {
        acc[key] = value
        return acc
      }, {}),
    }))
  }

  // Agrupar permisos por categorías
  const permissionCategories = {
    "Gestión de Acefalías": ["Lista de Acefalías", "Registrar Acefalia"],
    "Gestión de Usuarios": ["Usuarios"],
    "Gestión de Postulaciones": ["Postulaciones", "Postulaciones por Carrera"],
    "Evaluación y Exámenes": ["Concurso de Méritos", "Examen de Conocimientos", "Examen de Competencias"],
    "Herramientas y Reportes": ["Firma Digital", "Reportes"],
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-4 px-2 sm:py-6">
      <div className="w-full mx-auto">
        <div className="w-full bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-xl border border-gray-100">
          {/* Encabezado */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
              {user ? (
                <span className="text-blue-600 font-bold text-xl">👤</span>
              ) : (
                <span className="text-blue-600 font-bold text-xl">➕</span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {user ? "Editar Usuario" : "Registrar Nuevo Usuario"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              {user
                ? "Actualiza la información y permisos del usuario"
                : "Complete el formulario para crear un nuevo usuario en el sistema"}
            </p>
          </div>

          {/* Indicador de Progreso */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">Progreso del formulario</p>
              <p className="text-sm font-medium text-blue-600">{progressPercentage}%</p>
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

          <form onSubmit={handleSubmit} id="userForm" className="space-y-6">
            {/* Sección 1: Información Personal */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <span className="mr-2">👤</span>
                  Información Personal
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Nombre completo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">👤</span>
                      </div>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Ingrese nombre completo"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Nombre de usuario */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">👤</span>
                      </div>
                      <input
                        type="text"
                        name="nombreUsuario"
                        value={formData.nombreUsuario}
                        onChange={handleChange}
                        required
                        placeholder="Ingrese nombre de usuario"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">✉️</span>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="ejemplo@dominio.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Contraseña (solo para nuevos usuarios) */}
                  {!user && (
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">🔒</span>
                        </div>
                        <input
                          type={passwordVisible ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          placeholder="Ingrese contraseña segura"
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {passwordVisible ? (
                            <span className="text-gray-400 hover:text-gray-600">👁️</span>
                          ) : (
                            <span className="text-gray-400 hover:text-gray-600">👁️‍🗨️</span>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 8 caracteres</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 2: Carrera y Opciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Selección de Carrera */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                    <span className="mr-2">💼</span>
                    Carrera
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Seleccione una carrera</label>
                    <select
                      name="carrera"
                      value={formData.carrera}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">-- Seleccione --</option>
                      {carrerasList.map((carrera) => (
                        <option key={carrera} value={carrera}>
                          {carrera}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Opciones */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                    <span className="mr-2">⚙️</span>
                    Opciones
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${formData.activo ? "bg-green-100" : "bg-red-100"}`}>
                          {formData.activo ? (
                            <span className="text-green-600">✔️</span>
                          ) : (
                            <span className="text-red-600">❗</span>
                          )}
                        </div>
                        <span className="ml-3 font-medium">Usuario Activo</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="activo"
                          checked={formData.activo}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${formData.administrador ? "bg-purple-100" : "bg-gray-100"}`}>
                          {formData.administrador ? (
                            <span className="text-purple-600">🛡️</span>
                          ) : (
                            <span className="text-gray-600">👤</span>
                          )}
                        </div>
                        <span className="ml-3 font-medium">Usuario Administrador</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="administrador"
                          checked={formData.administrador}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4: Permisos */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <span className="mr-2">🔒</span>
                  Permisos
                </h3>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <button
                    type="button"
                    onClick={() => toggleAllPermissions(true)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
                  >
                    <span className="mr-1.5">✔️</span>
                    Seleccionar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllPermissions(false)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center"
                  >
                    <span className="mr-1.5">❌</span>
                    Deseleccionar Todos
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {Object.entries(permissionCategories).map(([category, permissions]) => (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-700 text-sm sm:text-base">{category}</h4>
                      </div>
                      <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {permissions.map((permiso) => (
                          <div
                            key={permiso}
                            className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors ${
                              formData.permisos[permiso]
                                ? "bg-blue-50 border border-blue-200"
                                : "bg-gray-50 border border-gray-200"
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-medium">{permiso}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permisos[permiso]}
                                onChange={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    permisos: { ...prev.permisos, [permiso]: !prev.permisos[permiso] },
                                  }))
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
              <button
                type="button"
                disabled={isSubmitting || isVerifying}
                onClick={onUserRegistered}
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
                      <span className="mr-2">💾</span>
                      {user ? "Guardar Cambios" : "Registrar Usuario"}
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
            document.getElementById("userForm").requestSubmit()
          }
        }}
        disabled={isSubmitting || isVerifying}
        className={`fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 z-50 ${
          isSubmitting || isVerifying
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        } md:hidden`}
        title={user ? "Guardar Cambios" : "Registrar Usuario"}
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
          <span className="text-white">💾</span>
        )}
      </button>
    </div>
  )
}

export default UserForm
