import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const initialFormData = {
  nombre: '',
  nombreUsuario: '',
  email: '',
  password: '',
  activo: true,
  administrador: false,
  carreras: [],
  permisos: {
    "Lista de Acefalías": true,
    "Registrar Acefalia": true,
    "Usuarios": true,
    "Postulaciones": true,
    "Postulaciones por Carrera": true,
    "Concurso de Méritos": true,
    "Examen de Conocimientos": true,  // NUEVO: Permiso para Examen de Conocimientos
    "Examen de Competencias": true,
    "Firma Digital": true,
  },
};

const UserForm = ({ user, onUserRegistered }) => {
  const [formData, setFormData] = useState(initialFormData);

  // Determinar la URL base dependiendo del entorno
  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  // Si se recibe un usuario para editar, se carga en el formulario;
  // de lo contrario se reinicia al estado inicial (para evitar que quede en modo edición)
  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: '', // por seguridad no se muestra la contraseña
      });
    } else {
      setFormData(initialFormData);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCarrerasChange = (carrera) => {
    setFormData((prev) => ({
      ...prev,
      carreras: prev.carreras.includes(carrera)
        ? prev.carreras.filter((c) => c !== carrera)
        : [...prev.carreras, carrera],
    }));
  };

  const handlePermisosChange = (permiso) => {
    setFormData((prev) => ({
      ...prev,
      permisos: { ...prev.permisos, [permiso]: !prev.permisos[permiso] },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (user) {
        // Modo edición: actualizar usuario
        response = await axios.put(`${baseURL}/usuarios/${user._id}`, formData);
        if (response.status === 200 || response.status === 201) {
          Swal.fire({
            icon: 'success',
            title: '¡Edición exitosa!',
            text: 'Usuario editado exitosamente.',
            confirmButtonText: 'Aceptar',
          }).then(() => {
            onUserRegistered();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El usuario no fue editado correctamente.',
            confirmButtonText: 'Aceptar',
          });
        }
      } else {
        // Modo registro: crear nuevo usuario
        response = await axios.post(`${baseURL}/usuarios/register`, formData);
        if (response.status === 200 || response.status === 201) {
          Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Usuario registrado exitosamente.',
            confirmButtonText: 'Aceptar',
          }).then(() => {
            setFormData(initialFormData);
            onUserRegistered();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El usuario no fue registrado correctamente.',
            confirmButtonText: 'Aceptar',
          });
        }
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.message ||
          'Hubo un error al guardar el usuario.',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  // Cálculo del progreso de campos completados
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter((val) => {
    if (typeof val === 'string') return val.trim() !== '';
    if (typeof val === 'boolean') return true;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object' && val !== null)
      return Object.values(val).some(v => v === true);
    return val !== null && val !== undefined;
  }).length;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      {/* Contenedor responsivo centrado con ancho máximo */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="w-full bg-white p-6 md:p-10 rounded-xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-blue-800 mb-8">
            {user ? 'Editar Usuario' : 'Registrar Usuario'}
          </h2>

          {/* Indicador de Progreso */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Progreso: {progressPercentage}% completado
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} id="userForm" className="space-y-6">
            {/* Sección 1: Información Personal */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                Información Personal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre de Usuario
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
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
                    <label className="block text-sm font-medium text-gray-700">
                      Contraseña
                    </label>
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

            {/* Sección 2: Opciones */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                Opciones
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                    />
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

            {/* Sección 3: Carreras */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                Carreras
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'INGENIERÍA AGROINDUSTRIAL',
                  'INGENIERÍA CIVIL',
                  'INGENIERÍA COMERCIAL',
                  'INGENIERÍA DE SISTEMAS',
                  'INGENIERÍA EN SISTEMAS ELECTRÓNICOS',
                ].map((carrera) => (
                  <label key={carrera} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.carreras.includes(carrera)}
                      onChange={() => handleCarrerasChange(carrera)}
                    />
                    <span>{carrera}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sección 4: Permisos */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                Permisos
              </h3>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    permisos: Object.keys(prev.permisos).reduce((acc, key) => {
                      acc[key] = true;
                      return acc;
                    }, {}),
                  }));
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
                      onChange={() => handlePermisosChange(permiso)}
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
                className="py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
              >
                {user ? 'Guardar Cambios' : 'Registrar'}
              </button>
              <button
                type="button"
                onClick={onUserRegistered}
                className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700"
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
        onClick={() => document.getElementById('userForm').requestSubmit()}
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    </div>
  );
};

export default UserForm;
