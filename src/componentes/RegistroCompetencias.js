import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function RegistroCompetencias({ competencia, onCompetenciaRegistered, onCancel }) {
  // Lista de asignaturas por defecto (ya no se utilizará para el select de materia)
  const asignaturasList = [
    'Inteligencia Artificial II',
    'Inteligencia Artificial I',
    'Métodos Numéricos',
    'Ingeniería de Software II',
    'Investigación Operativa II',
    'Investigación Operativa I',
    'Internet de las Cosas',
    'Redes de Computadoras',
    'Sistemas Operativos y Servidores',
    'Trabajo de Grado',
    'trabajo de grado II',
    'inteligencia artificial',
    'Ecuaciones diferenciales',
  ];

  const [formData, setFormData] = useState({
    tipoEvaluador: '',
    nombre: '',
    carnet: '',
    materia: '',
    fecha: '',
    planConcordancia: '',
    planCompetencia: '',
    planContenidos: '',
    planEstrategiasEnsenanza: '',
    planEstrategiasEvaluacion: '',
    procesoMotivacion: '',
    procesoDominio: '',
    procesoTICs: '',
    procesoExplicacion: ''
  });

  // Nuevo estado para almacenar las materias postuladas
  const [materiasPostuladas, setMateriasPostuladas] = useState([]);

  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  useEffect(() => {
    if (competencia) {
      setFormData({
        ...competencia
      });
      if (competencia.asignaturasSeleccionadas) {
        setMateriasPostuladas(
          typeof competencia.asignaturasSeleccionadas === 'string'
            ? JSON.parse(competencia.asignaturasSeleccionadas)
            : competencia.asignaturasSeleccionadas
        );
      }
    }
  }, [competencia]);

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

  // Cálculos de la Segunda Etapa
  const stage2Sum =
    (parseInt(formData.planConcordancia) || 0) +
    (parseInt(formData.planCompetencia) || 0) +
    (parseInt(formData.planContenidos) || 0) +
    (parseInt(formData.planEstrategiasEnsenanza) || 0) +
    (parseInt(formData.planEstrategiasEvaluacion) || 0);
  const stage2Promedio = ((stage2Sum / 100) * 30).toFixed(2);

  // Cálculos de la Tercera Etapa
  const stage3Sum =
    (parseInt(formData.procesoMotivacion) || 0) +
    (parseInt(formData.procesoDominio) || 0) +
    (parseInt(formData.procesoTICs) || 0) +
    (parseInt(formData.procesoExplicacion) || 0);
  const stage3Promedio = ((stage3Sum / 100) * 30).toFixed(2);

  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(val => val !== '' && val !== null).length;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  const stage2Color =
    stage2Sum <= 60 ? "text-red-500" : stage2Sum > 80 ? "text-green-500" : "text-yellow-600";
  const stage3Color =
    stage3Sum <= 60 ? "text-red-500" : stage3Sum > 80 ? "text-green-500" : "text-yellow-600";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (stage2Sum > 100 || stage3Sum > 100) {
      Swal.fire('Error', 'La sumatoria de puntajes excede el máximo permitido.', 'error');
      return;
    }

    const dataToSend = { 
      ...formData, 
      notaPlanTrabajo: stage2Promedio, 
      notaProcesosPedagogicos: stage3Promedio 
    };

    try {
      if (competencia) {
        await axios.put(`${baseURL}/api/examen-competencias/${competencia._id}`, dataToSend);
        Swal.fire('Éxito', 'Registro actualizado correctamente.', 'success');
      } else {
        await axios.post(`${baseURL}/api/examen-competencias`, dataToSend);
        Swal.fire('Éxito', 'Registro creado correctamente.', 'success');
      }
      onCompetenciaRegistered();
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
            <p className="text-xs text-red-500 mt-1">Debe seleccionar un tipo de evaluador.</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Registro de datos del postulante */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              Registro de datos del postulante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
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

          {/* Segunda Etapa: Exposición del Plan de Trabajo */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              Segunda Etapa: Exposición del Plan de Trabajo (30%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Concordancia con el perfil profesional
                </label>
                <select
                  name="planConcordancia"
                  value={formData.planConcordancia}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para este criterio"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="20">20 - Excelente</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Competencia
                </label>
                <select
                  name="planCompetencia"
                  value={formData.planCompetencia}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para competencia"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="20">20 - Excelente</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Contenidos
                </label>
                <select
                  name="planContenidos"
                  value={formData.planContenidos}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para contenidos"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="20">20 - Excelente</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Estrategias de enseñanza
                </label>
                <select
                  name="planEstrategiasEnsenanza"
                  value={formData.planEstrategiasEnsenanza}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para estrategias de enseñanza"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="20">20 - Excelente</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Estrategias de evaluación
                </label>
                <select
                  name="planEstrategiasEvaluacion"
                  value={formData.planEstrategiasEvaluacion}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para estrategias de evaluación"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="20">20 - Excelente</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-lg font-semibold ${stage2Color}`}>
                Sumatoria: {stage2Sum} / 100
              </p>
              <p className="text-lg font-semibold">Promedio (30%): {stage2Promedio}</p>
            </div>
          </div>

          {/* Tercera Etapa: Evaluación de Procesos Pedagógicos */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              Tercera Etapa: Evaluación de Procesos Pedagógicos y Didácticos (30%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Motivación a los estudiantes
                </label>
                <select
                  name="procesoMotivacion"
                  value={formData.procesoMotivacion}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para motivación"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="25">25 - Excelente</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Dominio y Conocimiento de la unidad didáctica
                </label>
                <select
                  name="procesoDominio"
                  value={formData.procesoDominio}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para dominio y conocimiento"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="25">25 - Excelente</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Uso de las TICs
                </label>
                <select
                  name="procesoTICs"
                  value={formData.procesoTICs}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para el uso de las TICs"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="25">25 - Excelente</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Explicación de la unidad temática en relación con el perfil profesional
                </label>
                <select
                  name="procesoExplicacion"
                  value={formData.procesoExplicacion}
                  onChange={handleChange}
                  required
                  title="Seleccione la puntuación para la explicación de la unidad"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="10">10 - Regular</option>
                  <option value="15">15 - Bueno</option>
                  <option value="25">25 - Excelente</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-lg font-semibold ${stage3Color}`}>
                Sumatoria: {stage3Sum} / 100
              </p>
              <p className="text-lg font-semibold">Promedio (30%): {stage3Promedio}</p>
            </div>
          </div>

          {/* Resultados */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Resultados</h3>
            <div className="text-xl font-semibold">
              <p>Plan de Trabajo (30%): {stage2Promedio}</p>
              <p>Procesos Pedagógicos (30%): {stage3Promedio}</p>
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
              {competencia ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>

      {/* Botón flotante para móviles */}
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

export default RegistroCompetencias;
