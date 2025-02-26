import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaFileAlt } from 'react-icons/fa';

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Lista de documentos
const documentosList = [
  { key: 'cartaDocenteAntiguoLicenciatura', label: 'Carta de Postulación Docente Antiguo Licenciatura' },
  { key: 'cartaDocenteAntiguoTecnologico', label: 'Carta de Postulación Docente Antiguo Tecnológico' },
  { key: 'cartaDocenteAntiguoMateriaMilitar', label: 'Carta de Postulación Docente Antiguo Materia Militar' },
  { key: 'cartaDocenteNuevoLicenciatura', label: 'Carta de Postulación Docente Nuevo Licenciatura' },
  { key: 'cartaDocenteNuevoTecnologico', label: 'Carta de Postulación Docente Nuevo Tecnológico' },
  { key: 'cartaDocenteNuevoMateriaMilitar', label: 'Carta de Postulación Docente Nuevo Materia Militar' },
  { key: 'hojaVida', label: 'Hoja de Vida según modelo de la EMI' },
  { key: 'tituloLicenciatura', label: 'Título Licenciatura' },
  { key: 'tituloTecnicoSuperior', label: 'Título Técnico Superior' },
  { key: 'diplomadoEducacionSuperiorCompetencias', label: 'Diplomado Educación Superior por Competencias' },
  { key: 'cursosEspecialidad', label: 'Cursos de Especialidad' },
  { key: 'maestria', label: 'Maestría' },
  { key: 'doctorado', label: 'Doctorado' },
  { key: 'posDoctorado', label: 'Pos-Doctorado' },
  { key: 'cursos80a160', label: 'Cursos (80-160 Hrs Académicas)' },
  { key: 'cursoDiplomadoMayor160', label: 'Curso o diplomado (>160 Hrs Académicas)' },
  { key: 'cursoIdiomaIngles', label: 'Curso de Idioma Inglés' },
  { key: 'libros', label: 'Libros' },
  { key: 'textosAcademicos', label: 'Textos Académicos, Reglamentos y Manuales' },
  { key: 'guiasFolletos', label: 'Guías o folletos' },
  { key: 'articulosInvestigacion', label: 'Artículos de Investigación' },
  { key: 'congresos', label: 'Congresos' },
  { key: 'simposiosSeminarios', label: 'Simposios o seminarios' },
  { key: 'experienciaDocenteEMI', label: 'Experiencia Docente en la EMI' },
  { key: 'experienciaDocenteOtrasInstituciones', label: 'Experiencia Docente en otras Instituciones' },
  { key: 'tutorTrabajoGrado', label: 'Tutor de Trabajo de Grado' },
  { key: 'miembroTribunalTrabajoGrado', label: 'Miembro de Tribunal Trabajo de Grado' },
  { key: 'actividadProfesional', label: 'Actividad profesional (Respaldada)' },
  { key: 'participacionVidaUniversitaria', label: 'Participación en vida universitaria (Evidencias)' },
];

const allowedTypes = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Opciones de carreras
const carrerasList = [
  "Ingeniería de Sistemas",
  "Ingeniería de Sistemas Electrónicos",
  "Ingeniería Agroindustrial",
  "Ingeniería Comercial"
];

function RegistroPostulacion() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    celular: '',
    ci: '',
    universidad: '',
    profesion: '',
    anioTitulacion: '',
    carrera: '',
    tipoDocente: '',
    documentos: {},
    asignaturasSeleccionadas: [],
  });

  const [nuevaAsignatura, setNuevaAsignatura] = useState({
    asignatura: '',
    nivel: 'Grado',
  });

  // Estado para almacenar las materias registradas en la base de datos
  const [materias, setMaterias] = useState([]);

  // Expresiones regulares para validaciones
  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  const soloNumeros = /^[0-9]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // useEffect para obtener las materias desde el backend
  useEffect(() => {
    axios.get('http://localhost:5000/materias')
      .then((response) => {
        setMaterias(response.data);
      })
      .catch((error) => {
        console.error('Error al obtener materias:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener las materias. Intenta nuevamente más tarde.',
        });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'carrera') {
      setNuevaAsignatura({
        asignatura: '',
        nivel: 'Grado',
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        !allowedTypes.includes(file.type) &&
        !file.name.toLowerCase().endsWith('.pdf') &&
        !file.name.toLowerCase().endsWith('.xls') &&
        !file.name.toLowerCase().endsWith('.xlsx')
      ) {
        Swal.fire({
          icon: 'error',
          title: 'Formato no permitido',
          text: 'Solo se permiten archivos PDF y Excel.',
        });
        e.target.value = '';
        return;
      }
      setFormData((prev) => ({
        ...prev,
        documentos: {
          ...prev.documentos,
          [e.target.name]: file,
        },
      }));
    }
  };

  const handleNewSubjectChange = (e) => {
    const { name, value } = e.target;
    setNuevaAsignatura((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addAsignatura = () => {
    if (!nuevaAsignatura.asignatura.trim()) {
      return Swal.fire({
        icon: 'error',
        title: 'Campo incompleto',
        text: 'Por favor, seleccione una asignatura.',
      });
    }
    if (formData.asignaturasSeleccionadas.length >= 3) {
      return Swal.fire({
        icon: 'error',
        title: 'Máximo alcanzado',
        text: 'Solo se pueden registrar máximo 3 materias.',
      });
    }
    // Se crea un nuevo objeto que incluye la carrera actual
    const nuevaAsignaturaConCarrera = { ...nuevaAsignatura, carrera: formData.carrera };
    setFormData((prev) => ({
      ...prev,
      asignaturasSeleccionadas: [...prev.asignaturasSeleccionadas, nuevaAsignaturaConCarrera],
    }));
    Swal.fire({
      icon: 'success',
      title: 'Asignatura agregada',
      text: 'La materia fue agregada correctamente.',
    });
    setNuevaAsignatura({
      asignatura: '',
      nivel: 'Grado',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !soloLetras.test(formData.nombre.trim())) {
      return Swal.fire({ icon: 'error', title: 'Nombre inválido', text: 'El nombre es obligatorio y debe contener solo letras.' });
    }
    if (!emailRegex.test(formData.correo.trim())) {
      return Swal.fire({ icon: 'error', title: 'Correo inválido', text: 'El correo electrónico es inválido.' });
    }
    if (!formData.celular.trim() || !soloNumeros.test(formData.celular.trim())) {
      return Swal.fire({ icon: 'error', title: 'Celular inválido', text: 'El número de celular es obligatorio y debe contener solo números.' });
    }
    if (!formData.ci.trim() || !soloNumeros.test(formData.ci.trim())) {
      return Swal.fire({ icon: 'error', title: 'Carnet inválido', text: 'El carnet de identidad es obligatorio y debe contener solo números.' });
    }
    if (!formData.universidad.trim() || !soloLetras.test(formData.universidad.trim())) {
      return Swal.fire({ icon: 'error', title: 'Universidad inválida', text: 'La universidad es obligatoria y debe contener solo letras.' });
    }
    if (!formData.anioTitulacion.trim() || !soloNumeros.test(formData.anioTitulacion.trim())) {
      return Swal.fire({ icon: 'error', title: 'Año inválido', text: 'El año de titulación es obligatorio y debe ser numérico.' });
    }
    if (!formData.profesion.trim() || !soloLetras.test(formData.profesion.trim())) {
      return Swal.fire({ icon: 'error', title: 'Profesión inválida', text: 'La profesión es obligatoria y debe contener solo letras.' });
    }
    if (!formData.carrera.trim()) {
      return Swal.fire({ icon: 'error', title: 'Carrera inválida', text: 'La carrera es obligatoria.' });
    }
    if (!formData.tipoDocente) {
      return Swal.fire({ icon: 'error', title: 'Tipo de Docente', text: 'El tipo de docente es obligatorio.' });
    }
    if (formData.asignaturasSeleccionadas.length === 0) {
      return Swal.fire({ icon: 'error', title: 'Materias pendientes', text: 'Debe agregar al menos una materia postulada.' });
    }

    try {
      const data = new FormData();
      data.append('nombre', formData.nombre.trim());
      data.append('correo', formData.correo.trim());
      data.append('celular', formData.celular.trim());
      data.append('ci', formData.ci.trim());
      data.append('universidad', formData.universidad.trim());
      data.append('profesion', formData.profesion.trim());
      data.append('anioTitulacion', formData.anioTitulacion.trim());
      data.append('carrera', formData.carrera.trim());
      data.append('tipoDocente', formData.tipoDocente);
      data.append('asignaturasSeleccionadas', JSON.stringify(formData.asignaturasSeleccionadas));

      documentosList.forEach((doc) => {
        if (formData.documentos[doc.key]) {
          data.append(doc.key, formData.documentos[doc.key]);
        }
      });

      const response = await axios.post('http://localhost:5000/postulaciones', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: response.data.message || 'Postulación registrada correctamente',
      });
    } catch (error) {
      console.error('Error al registrar la postulación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.message ||
          'Hubo un error al registrar la postulación. Por favor, intenta de nuevo.',
      });
    }
  };

  // Cálculo del porcentaje de progreso
  const personalFields = ['nombre', 'correo', 'celular', 'ci', 'universidad', 'profesion', 'anioTitulacion', 'carrera', 'tipoDocente'];
  const filledPersonal = personalFields.filter((key) => formData[key] !== '').length;
  const asignaturaFilled = formData.asignaturasSeleccionadas.length > 0 ? 1 : 0;
  const documentosFilled = Object.keys(formData.documentos).length > 0 ? 1 : 0;
  const totalFields = personalFields.length + 2;
  const progressPercentage = Math.round(((filledPersonal + asignaturaFilled + documentosFilled) / totalFields) * 100);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 sm:p-6 relative">
      {/* Contenedor con fondo de imagen */}
      <div
        className="w-full max-w-7xl p-6 sm:p-10 rounded-xl shadow-2xl"
        style={{
          backgroundImage: 'url(EMI.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Indicador de Progreso */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">Progreso: {progressPercentage}% completado</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Encabezado */}
        <div className="text-center mb-8">
          <img src="logo.png" alt="Logo EMI" className="mx-auto h-16" />
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-800 mt-4">Postúlate Como Docente</h1>
          <p className="mt-2 text-sm sm:text-base text-yellow-600">
            Postulación de cátedras declaradas en acefalía para el periodo I/2025
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Información Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Nombre Completo:</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ingrese su nombre completo"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Correo Electrónico:</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Número de Celular:</label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 12345678"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Carnet de Identidad:</label>
                <input
                  type="text"
                  name="ci"
                  value={formData.ci}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 12345678"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Universidad del CEUB:</label>
                <input
                  type="text"
                  name="universidad"
                  value={formData.universidad}
                  onChange={handleChange}
                  required
                  placeholder="Nombre de la universidad"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Año de Titulación:</label>
                <input
                  type="number"
                  name="anioTitulacion"
                  value={formData.anioTitulacion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 2020"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Profesión:</label>
                <input
                  type="text"
                  name="profesion"
                  value={formData.profesion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Licenciado/a en..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Carrera:</label>
                <select
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione una carrera</option>
                  {carrerasList.map((carrera, idx) => (
                    <option key={idx} value={carrera}>
                      {carrera}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Tipo de Docente:</label>
                <select
                  name="tipoDocente"
                  value={formData.tipoDocente}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione</option>
                  <option value="Docente Antiguo">Docente Antiguo</option>
                  <option value="Docente Nuevo">Docente Nuevo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Materias Postuladas */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Materias Postuladas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SELECT PARA LA ASIGNATURA */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Asignatura:</label>
                <select
                  name="asignatura"
                  value={nuevaAsignatura.asignatura}
                  onChange={handleNewSubjectChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione una asignatura</option>
                  {formData.carrera &&
                    materias
                      .filter((materia) => materia.carrera === formData.carrera)
                      .filter((materia) =>
                        !formData.asignaturasSeleccionadas.some(
                          (item) => item.asignatura === materia.asignatura
                        )
                      )
                      .map((materia) => (
                        <option key={materia._id} value={materia.asignatura}>
                          {materia.asignatura}
                        </option>
                      ))
                  }
                </select>
              </div>

              {/* NIVEL DE ENSEÑANZA (únicamente "Grado") */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Nivel de Enseñanza:</label>
                <select
                  name="nivel"
                  value={nuevaAsignatura.nivel}
                  onChange={handleNewSubjectChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Grado">Grado</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={addAsignatura}
              className="mt-4 w-full py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
            >
              Agregar Asignatura
            </button>
            {formData.asignaturasSeleccionadas.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-gray-700">Asignaturas Agregadas:</h3>
                <ul className="list-disc list-inside">
                  {formData.asignaturasSeleccionadas.map((item, index) => (
                    <li key={index} className="text-gray-800">
                      {item.asignatura} - {item.nivel} - {item.carrera}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Documentación */}
          <div className="p-6 bg-blue-50 rounded-lg border">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Documentación en Formato PDF/Excel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentosList.map((doc, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg flex items-center space-x-4">
                  <div className="text-blue-600">
                    <FaFileAlt size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{doc.label}</div>
                    <div className="text-sm text-gray-500">
                      {formData.documentos[doc.key]
                        ? formData.documentos[doc.key].name
                        : 'Sin Archivo'}
                    </div>
                  </div>
                  <div>
                    <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition">
                      Subir Archivo
                      <input
                        type="file"
                        name={doc.key}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf, .xls, .xlsx, application/pdf, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-200"
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={() =>
                Swal.fire({ icon: 'info', title: 'Cancelado', text: 'Operación cancelada' })
              }
              className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistroPostulacion;
