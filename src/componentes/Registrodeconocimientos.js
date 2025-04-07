import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Registrodeconocimientos({ conocimiento, onConocimientoRegistered, onCancel }) {
  const [formData, setFormData] = useState({
    tipoEvaluador: '',
    nombre: '',
    carnet: '', // Internamente se sigue llamando "carnet", pero en la UI lo mostraremos como "CI"
    // Se eliminó "materia"
    fecha: '',
    examenConocimientos: '',
    nombreEvaluador: ''
  });

  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  useEffect(() => {
    if (conocimiento) {
      // Se remueve la propiedad "materia" en caso de existir en el objeto conocimiento
      const { materia, ...rest } = conocimiento;
      setFormData(rest);
    }
  }, [conocimiento]);

  // Buscar postulante por carnet y autocompletar nombre
  useEffect(() => {
    const fetchPostulante = async () => {
      if (formData.carnet.trim() === '') {
        setFormData((prev) => ({ ...prev, nombre: '' }));
        return;
      }
      try {
        const response = await axios.get(`${baseURL}/postulaciones/carnet/${formData.carnet}`);
        if (response.data.data) {
          setFormData((prev) => ({
            ...prev,
            nombre: response.data.data.nombre
          }));
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setFormData((prev) => ({ ...prev, nombre: '' }));
        }
        console.error('Error al buscar postulante por carnet:', error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchPostulante();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.carnet, baseURL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Calcular la nota final (40% del examen)
  const examenScore = parseFloat(formData.examenConocimientos) || 0;
  const notaFinal = (examenScore * 0.4).toFixed(2);

  // Progreso de campos completados
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter((val) => val !== '' && val !== null).length;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = { ...formData, notaFinal };

    try {
      if (conocimiento && conocimiento._id) {
        await axios.put(`${baseURL}/api/examen-conocimientos/${conocimiento._id}`, dataToSend);
        Swal.fire('Éxito', 'Registro actualizado correctamente.', 'success');
        onConocimientoRegistered();
      } else {
        // Asignar evaluadorId desde localStorage para nuevo registro
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          dataToSend.evaluadorId = user._id;
          if (!dataToSend.nombreEvaluador) {
            dataToSend.nombreEvaluador = user.nombre || '';
          }
        }
        const response = await axios.post(`${baseURL}/api/examen-conocimientos`, dataToSend);
        Swal.fire('Éxito', 'Registro creado correctamente.', 'success');
        onConocimientoRegistered(response.data);
      }
    } catch (error) {
      console.error('Error al guardar el registro:', error);
      Swal.fire(
        'Error',
        error.response?.data?.message || 'Ocurrió un problema al guardar el registro.',
        'error'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      {/* Contenedor responsivo */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="bg-white p-6 md:p-10 rounded-lg shadow-lg w-full">
          {/* Encabezado principal */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {conocimiento ? 'Editar Conocimiento' : 'Registrar Conocimiento'}
          </h2>

          {/* Indicador de Progreso */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} id="conocimientoForm" className="space-y-6">
            {/* Selección de tipo de evaluador */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Seleccionar tipo de Evaluador
              </label>
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
              {formData.tipoEvaluador === '' && (
                <p className="text-xs text-red-500 mt-1">Debe seleccionar un tipo de evaluador.</p>
              )}
            </div>

            {/* Campo Nombre de Evaluador reposicionado */}
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

            {/* Primera Etapa: Evaluación de Conocimiento Teórico-Científico */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">
                Primera Etapa: Evaluación de Conocimiento Teórico-Científico
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo CI a la izquierda */}
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
                {/* Campo Nombre del Postulante a la derecha, bloqueado */}
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
              {/* Campo de Examen Conocimientos (40%) */}
              <div className="mt-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Examen Conocimientos (40%)
                </label>
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

            {/* Nota Final */}
            <div className="p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">Nota Final</h3>
              <div className="text-lg sm:text-xl font-semibold">
                <p>Examen (40%): {(examenScore * 0.4).toFixed(2)}</p>
                <p className="mt-2">Nota Final: {notaFinal}</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-blue-800 text-white font-bold rounded-lg shadow-md hover:bg-blue-900 transition duration-200"
              >
                {conocimiento ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Botón flotante para dispositivos móviles */}
      <button
        type="button"
        onClick={() => document.getElementById('conocimientoForm').requestSubmit()}
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

export default Registrodeconocimientos;
