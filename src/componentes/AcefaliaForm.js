import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function AcefaliaForm({ acefalia, onAcefaliaRegistered }) {
  const [formData, setFormData] = useState({
    asignatura: '',
    requisitos: '',
    semestre: '',
    nivelAcademico: 'Grado', // Se asigna "Grado" por defecto
    carrera: '',
    gestion: 'I-2024',
    horasTeoria: 0,
    horasPracticas: 0,
    horasLaboratorio: 0,
    motivosAcefalia: '',
  });

  // Determinar la URL base dependiendo del entorno
  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  // Si se recibe una acefalia para edición, se carga en el formulario
  useEffect(() => {
    if (acefalia) {
      setFormData({ ...acefalia });
    }
  }, [acefalia]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Expresiones regulares para validaciones:
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    const numericRegex = /^[0-9]+$/;

    if (!formData.asignatura.trim() || !nameRegex.test(formData.asignatura.trim())) {
      return Swal.fire({
        icon: 'error',
        title: 'Asignatura inválida',
        text: 'La asignatura es obligatoria y debe contener solo letras.',
      });
    }
    if (!formData.requisitos.trim()) {
      return Swal.fire({
        icon: 'error',
        title: 'Requisitos vacíos',
        text: 'El campo requisitos es obligatorio.',
      });
    }
    if (!formData.semestre) {
      return Swal.fire({
        icon: 'error',
        title: 'Semestre no seleccionado',
        text: 'Debe seleccionar un semestre.',
      });
    }
    if (!formData.nivelAcademico) {
      return Swal.fire({
        icon: 'error',
        title: 'Nivel académico',
        text: 'Debe seleccionar un nivel académico.',
      });
    }
    if (!formData.carrera) {
      return Swal.fire({
        icon: 'error',
        title: 'Carrera no seleccionada',
        text: 'Debe seleccionar una carrera.',
      });
    }
    if (!formData.gestion.trim()) {
      return Swal.fire({
        icon: 'error',
        title: 'Gestión vacía',
        text: 'El campo gestión es obligatorio.',
      });
    }
    // Validaciones para las horas (deben ser numéricas y no negativas)
    if (isNaN(formData.horasTeoria) || formData.horasTeoria < 0) {
      return Swal.fire({
        icon: 'error',
        title: 'Horas Teoría inválidas',
        text: 'Las horas de teoría deben ser un número no negativo.',
      });
    }
    if (isNaN(formData.horasPracticas) || formData.horasPracticas < 0) {
      return Swal.fire({
        icon: 'error',
        title: 'Horas Prácticas inválidas',
        text: 'Las horas prácticas deben ser un número no negativo.',
      });
    }
    if (isNaN(formData.horasLaboratorio) || formData.horasLaboratorio < 0) {
      return Swal.fire({
        icon: 'error',
        title: 'Horas Laboratorio inválidas',
        text: 'Las horas de laboratorio deben ser un número no negativo.',
      });
    }
    if (!formData.motivosAcefalia.trim()) {
      return Swal.fire({
        icon: 'error',
        title: 'Motivos vacíos',
        text: 'El campo de motivos de la acefalia es obligatorio.',
      });
    }

    // Si todas las validaciones pasan, se procede a enviar el formulario.
    try {
      const url = acefalia
        ? `${baseURL}/materias/${acefalia._id}` // Para editar
        : `${baseURL}/materias/register`;      // Para crear

      const method = acefalia ? 'put' : 'post';

      const response = await axios({
        method: method,
        url: url,
        data: formData,
      });

      if (response.status === 200 || response.status === 201) {
        Swal.fire({
          icon: 'success',
          title: acefalia ? '¡Actualizado!' : '¡Registrado!',
          text: acefalia
            ? 'Materia actualizada exitosamente.'
            : 'Materia registrada exitosamente.',
        });
        if (onAcefaliaRegistered) onAcefaliaRegistered();
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.message ||
          'Hubo un problema al procesar la solicitud. Inténtalo de nuevo.',
      });
    }
  };

  // Cálculo del progreso de campos completados
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(
    (val) => val !== '' && val !== null
  ).length;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      {/* Contenedor responsivo centrado con ancho máximo */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="w-full bg-white p-6 sm:p-10 rounded-xl shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-blue-800 mb-4">
            {acefalia ? 'Editar Acefalia' : 'Registrar Acefalia'}
          </h2>
          {/* Indicador de Progreso */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
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
                      const allowed = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]$/;
                      if (!allowed.test(e.key)) {
                        e.preventDefault();
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
                        e.preventDefault();
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
                        e.preventDefault();
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
                        e.preventDefault();
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
                className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-200"
              >
                {acefalia ? 'Actualizar' : 'Aceptar'}
              </button>
              <button
                type="button"
                className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-200"
                onClick={() =>
                  Swal.fire({
                    icon: 'info',
                    title: 'Cancelado',
                    text: 'La operación fue cancelada',
                  })
                }
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
        onClick={() => document.querySelector('form').requestSubmit()}
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
  );
}

export default AcefaliaForm;
