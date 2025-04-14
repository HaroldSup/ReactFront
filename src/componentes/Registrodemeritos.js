import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function RegistroDeMeritos({ merito, onMeritoRegistered, onCancel }) {
  const [formData, setFormData] = useState({
    nombrePostulante: '',
    ci: '',
    fechaEvaluacion: '',
    puntosEvaluacion: '',
    nombreEvaluador: '',
    evaluadorId: '',
    profesion: '',
    materia: '',
    carrera: '',
    habilitado: '',
    observaciones: '',
  });

  // Estado para almacenar las materias postuladas (viene de la búsqueda por CI)
  const [materiasPostuladas, setMateriasPostuladas] = useState([]);
  // Estado para filtro de carrera para las materias
  const [filtroCarrera, setFiltroCarrera] = useState('');

  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  // Si existe un objeto merito (para editar), se remueven propiedades innecesarias y se carga el resto en el estado
  useEffect(() => {
    if (merito) {
      const { carrera, materia, profesion, habilitado, observaciones, ...rest } = merito;
      setFormData({
        ...rest,
        profesion: profesion || '',
        materia: materia || '',
        carrera: carrera || '',
        habilitado: habilitado || '',
        observaciones: observaciones || '',
      });
    }
  }, [merito]);

  // Buscar postulante por CI y autocompletar nombre, profesión y materias postuladas
  useEffect(() => {
    const fetchPostulante = async () => {
      if (formData.ci.trim() === '') {
        setFormData((prev) => ({ ...prev, nombrePostulante: '', profesion: '' }));
        setMateriasPostuladas([]);
        return;
      }
      try {
        const response = await axios.get(`${baseURL}/postulaciones/carnet/${formData.ci}`);
        if (response.data.data) {
          setFormData((prev) => ({
            ...prev,
            nombrePostulante: response.data.data.nombre,
            // Se asume que la API retorna la profesión en la propiedad "profesion"
            profesion: response.data.data.profesion || '',
          }));
          if (response.data.data.asignaturasSeleccionadas) {
            const materias =
              typeof response.data.data.asignaturasSeleccionadas === 'string'
                ? JSON.parse(response.data.data.asignaturasSeleccionadas)
                : response.data.data.asignaturasSeleccionadas;
            setMateriasPostuladas(materias);
          } else {
            setMateriasPostuladas([]);
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setFormData((prev) => ({ ...prev, nombrePostulante: '', profesion: '' }));
          setMateriasPostuladas([]);
        }
        console.error('Error al buscar postulante por CI:', error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchPostulante();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.ci, baseURL]);

  // Manejo de cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Al cambiar los puntos se evalúa el estado Habilitado/No habilitado
    if (name === 'puntosEvaluacion') {
      const pts = parseInt(value) || 0;
      const estado = pts >= 220 ? 'Habilitado' : 'No habilitado';
      setFormData((prev) => ({ ...prev, [name]: value, habilitado: estado }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Manejo específico para el select de Materia (filtrado por carrera)
  const handleMateriaChange = (e) => {
    const selectedMateria = e.target.value;
    const materiasFiltradas =
      filtroCarrera.trim() !== ''
        ? materiasPostuladas.filter((mat) => mat.carrera === filtroCarrera)
        : materiasPostuladas;
    const materiaObj = materiasFiltradas.find((mat) => mat.asignatura === selectedMateria);
    setFormData((prev) => ({
      ...prev,
      materia: selectedMateria,
      carrera: materiaObj ? materiaObj.carrera : '',
    }));
  };

  // Obtenemos un arreglo único de carreras a partir de las materias postuladas
  const uniqueCarreras = Array.from(new Set(materiasPostuladas.map((mat) => mat.carrera)));

  // Filtrar materias según el filtro de carrera seleccionado
  const materiasFiltradas =
    filtroCarrera.trim() !== ''
      ? materiasPostuladas.filter((mat) => mat.carrera === filtroCarrera)
      : materiasPostuladas;

  // Manejo del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{1,10}$/.test(formData.ci)) {
      Swal.fire('Error', 'El CI debe contener solo números y máximo 10 dígitos.', 'error');
      return;
    }

    try {
      // Preparar objeto para enviar al backend
      let registroData = { ...formData };
      if (!merito) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          registroData.evaluadorId = user._id;
          if (!registroData.nombreEvaluador) {
            registroData.nombreEvaluador = user.nombre || '';
          }
        }
      }

      if (merito) {
        await axios.put(`${baseURL}/api/concurso-meritos/${merito._id}`, registroData);
        Swal.fire('Éxito', 'Registro actualizado correctamente.', 'success');
        onMeritoRegistered();
      } else {
        const response = await axios.post(`${baseURL}/api/concurso-meritos`, registroData);
        Swal.fire('Éxito', 'Registro creado correctamente.', 'success');
        onMeritoRegistered(response.data);
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

  // Indicador de progreso (se ajusta la cantidad de campos obligatorios)
  const totalFields = 7; // CI, Nombre, Fecha, Puntos, Evaluador, Profesión, Observaciones (y se puede ir ajustando)
  const filledFields = Object.values(formData).filter((val) => val !== '').length;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="min-h-screen bg-gray-100 py-4 overflow-x-hidden">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {merito ? 'Editar Nota' : 'Registrar Nota'}
          </h2>

          {/* Indicador de Progreso */}
          <div className="mb-4">
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

          <form onSubmit={handleSubmit} id="meritoForm" className="space-y-6">
            {/* Sección: Datos del Postulante */}
            <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">
                Datos del Postulante
              </h3>
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
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Nombre del Postulante
                  </label>
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
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Profesión
                  </label>
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
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Fecha de Evaluación
                  </label>
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

            {/* Sección: Información Académica (Filtrar y seleccionar Materia) */}
            <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">
                Información Académica
              </h3>
              {/* Filtro para materias por carrera */}
              <div className="mb-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Filtrar materias por Carrera:
                </label>
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
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Materia
                </label>
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
                    <option value="">
                      No se encontraron materias para la carrera seleccionada
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* Sección: Datos de Evaluación */}
            <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">
                Datos de Evaluación
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo Nombre de Evaluador */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Nombre de Evaluador
                  </label>
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
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Puntos de Evaluación
                  </label>
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
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Estado
                  </label>
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
              <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4">
                Observaciones
              </h3>
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
                className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-blue-800 text-white font-bold rounded-md shadow-md hover:bg-blue-900 transition"
              >
                {merito ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Botón flotante de confirmación para dispositivos móviles */}
      <button
        type="button"
        onClick={() => document.getElementById('meritoForm').requestSubmit()}
        className="fixed bottom-4 right-4 bg-blue-800 text-white p-4 rounded-full shadow-lg hover:bg-blue-900 transition md:hidden"
        title="Guardar Registro"
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

export default RegistroDeMeritos;
