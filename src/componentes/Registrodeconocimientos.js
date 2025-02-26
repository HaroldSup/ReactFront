import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Registrodeconocimientos({ conocimiento, onConocimientoRegistered, onCancel }) {
  const [formData, setFormData] = useState({
    tipoEvaluador: '',
    nombre: '',
    carnet: '',
    materia: '',
    fecha: '',
    examenConocimientos: '',
    // NUEVO: Campo para el nombre del evaluador
    nombreEvaluador: ''
  });

  // Estado para almacenar las materias postuladas
  const [materiasPostuladas, setMateriasPostuladas] = useState([]);

  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  useEffect(() => {
    if (conocimiento) {
      setFormData({ ...conocimiento });
      if (conocimiento.asignaturasSeleccionadas) {
        setMateriasPostuladas(
          typeof conocimiento.asignaturasSeleccionadas === 'string'
            ? JSON.parse(conocimiento.asignaturasSeleccionadas)
            : conocimiento.asignaturasSeleccionadas
        );
      }
    }
  }, [conocimiento]);

  // Buscar postulante por carnet y autocompletar nombre y materias postuladas
  useEffect(() => {
    const fetchPostulante = async () => {
      if (formData.carnet.trim() === '') {
        setFormData(prev => ({ ...prev, nombre: '' }));
        setMateriasPostuladas([]);
        return;
      }
      try {
        const response = await axios.get(`${baseURL}/postulaciones/carnet/${formData.carnet}`);
        if (response.data.data) {
          setFormData(prev => ({
            ...prev,
            nombre: response.data.data.nombre
          }));
          if (response.data.data.asignaturasSeleccionadas) {
            const materias = typeof response.data.data.asignaturasSeleccionadas === 'string'
              ? JSON.parse(response.data.data.asignaturasSeleccionadas)
              : response.data.data.asignaturasSeleccionadas;
            setMateriasPostuladas(materias);
          } else {
            setMateriasPostuladas([]);
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setFormData(prev => ({ ...prev, nombre: '' }));
          setMateriasPostuladas([]);
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calcular la nota final (40% del examen)
  const examenScore = parseFloat(formData.examenConocimientos) || 0;
  const notaFinal = (examenScore * 0.4).toFixed(2);

  // Progreso de campos completados
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(val => val !== '' && val !== null).length;
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
        // Pasar el registro recién creado al callback
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-6 relative">
      <div className="w-full max-w-4xl bg-white p-6 sm:p-10 rounded-xl shadow-2xl">
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
            <p className="text-xs text-red-500 mt-1">
              Debe seleccionar un tipo de evaluador.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primera Etapa: Evaluación de Conocimiento Teórico-Científico */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              Primera Etapa: Evaluación de Conocimiento Teórico-Científico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  readOnly
                  placeholder="El nombre se autocompleta al ingresar el carnet"
                  title="El nombre se autocompleta al ingresar el carnet"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Carnet</label>
                <input
                  type="text"
                  name="carnet"
                  value={formData.carnet}
                  onChange={handleChange}
                  placeholder="Ej: 12345678"
                  title="Ingrese el número de carnet del postulante"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Materia</label>
                <select
                  name="materia"
                  value={formData.materia}
                  onChange={handleChange}
                  required
                  title="Seleccione la asignatura a la que postula"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione la asignatura</option>
                  {materiasPostuladas.length > 0 ? (
                    materiasPostuladas.map((mat, idx) => (
                      <option key={idx} value={mat.asignatura}>
                        {mat.asignatura}
                      </option>
                    ))
                  ) : (
                    <option value="">No se encontraron materias postuladas</option>
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

          {/* NUEVO: Campo Nombre de Evaluador */}
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

          {/* Nota Final */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Nota Final</h3>
            <div className="text-xl font-semibold">
              <p>Examen (40%): {(examenScore * 0.4).toFixed(2)}</p>
              <p className="mt-2">Nota Final: {notaFinal}</p>
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
              {conocimiento ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </div>
        </form>
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

export default Registrodeconocimientos;
