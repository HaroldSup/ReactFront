import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Registrodeconocimientos({ conocimiento, onConocimientoRegistered, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    carnet: '', // Se muestra como CI en la UI
    fecha: '',
    examenConocimientos: '',
    nombreEvaluador: '',
    profesion: '',
    materia: '',
    carrera: '',
    habilitado: 'Habilitado', // Por defecto, siempre habilitado.
    observaciones: ''
  });

  // Para almacenar las materias postuladas (recuperadas al buscar por CI)
  const [materiasPostuladas, setMateriasPostuladas] = useState([]);
  // Para filtrar las materias según la carrera
  const [filtroCarrera, setFiltroCarrera] = useState('');

  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  // Si se está editando un registro, se precargan los datos (incluidos los campos nuevos)
  useEffect(() => {
    if (conocimiento) {
      // Se remueve la propiedad "materia" si existe, y se asignan el resto de los campos
      const { materia, ...rest } = conocimiento;
      setFormData({
        ...rest,
        profesion: conocimiento.profesion || '',
        materia: conocimiento.materia || '',
        carrera: conocimiento.carrera || '',
        habilitado: "Habilitado", // Siempre fijo en "Habilitado"
        observaciones: conocimiento.observaciones || ''
      });
    }
  }, [conocimiento]);

  // Buscar postulante por CI y autocompletar nombre, profesión y materias postuladas
  useEffect(() => {
    const fetchPostulante = async () => {
      if (formData.carnet.trim() === '') {
        setFormData((prev) => ({ ...prev, nombre: '', profesion: '' }));
        setMateriasPostuladas([]);
        return;
      }
      try {
        const response = await axios.get(`${baseURL}/postulaciones/carnet/${formData.carnet}`);
        if (response.data.data) {
          setFormData((prev) => ({
            ...prev,
            nombre: response.data.data.nombre,
            // Se asume que la API retorna la profesión en la propiedad "profesion"
            profesion: response.data.data.profesion || ''
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
          setFormData((prev) => ({ ...prev, nombre: '', profesion: '' }));
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

  // Manejo de cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Para el campo de examen, se asegura que el estado siempre sea "Habilitado"
    if (name === 'examenConocimientos') {
      setFormData((prev) => ({ ...prev, [name]: value, habilitado: "Habilitado" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Manejo específico al seleccionar una materia; asigna también la carrera correspondiente
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
      carrera: materiaObj ? materiaObj.carrera : ''
    }));
  };

  // Obtención de un arreglo único de carreras a partir de las materias postuladas
  const uniqueCarreras = Array.from(new Set(materiasPostuladas.map((mat) => mat.carrera)));
  // Filtrar materias según el filtro de carrera seleccionado
  const materiasFiltradas =
    filtroCarrera.trim() !== ''
      ? materiasPostuladas.filter((mat) => mat.carrera === filtroCarrera)
      : materiasPostuladas;

  // Cálculo de la nota final (40% del examen teórico-científico)
  const examenScore = parseFloat(formData.examenConocimientos) || 0;
  const notaFinal = (examenScore * 0.4).toFixed(2);

  // Indicador de progreso en función de los campos completados
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
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="bg-white p-6 md:p-10 rounded-lg shadow-lg w-full">
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
