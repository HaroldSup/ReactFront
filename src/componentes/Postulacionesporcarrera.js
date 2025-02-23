import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import swal from 'sweetalert';
import { FaFileAlt } from 'react-icons/fa';

// Lista de documentos requeridos y sus etiquetas
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

// Función para extraer el nombre del archivo (sin la ruta)
const getFileName = (filePath) => {
  if (!filePath) return '';
  return filePath.split('\\').pop().split('/').pop();
};

// Función para formatear la información de las asignaturas postuladas  
const formatAsignaturas = (asignaturas) => {
  if (!asignaturas) return '';
  if (!Array.isArray(asignaturas)) {
    try {
      asignaturas = JSON.parse(asignaturas);
    } catch (e) {
      return asignaturas;
    }
  }
  return asignaturas
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        const { asignatura, departamento, nivel } = item;
        return `${asignatura || ''} (${departamento || ''}, ${nivel || ''})`;
      }
      return item;
    })
    .join(' | ');
};

// Función para generar un resumen de la documentación para Excel
const formatDocumentosForExcel = (documentos) => {
  if (!documentos) return '';
  return documentosList
    .map((doc) => {
      const archivo = documentos[doc.key];
      return `${doc.label}: ${archivo ? getFileName(archivo) : 'Sin Archivos'}`;
    })
    .join(' || ');
};

// Componente que muestra los documentos en tarjetas (2 columnas, con íconos)
const DocumentosDetalle = ({ documentos, baseURL }) => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {documentosList.map((doc, idx) => (
        <div key={idx} className="flex items-center border border-gray-200 p-2 rounded-md">
          <FaFileAlt className="text-blue-500 mr-2" size={20} />
          <div>
            <span className="font-bold">{doc.label}:</span>
            {documentos && documentos[doc.key] ? (
              <a
                href={`${baseURL}/uploads/${getFileName(documentos[doc.key])}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline block"
              >
                {getFileName(documentos[doc.key])}
              </a>
            ) : (
              <span className="text-gray-500 block">Sin Archivos</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

function Postulacionesporcarrera() {
  const [postulaciones, setPostulaciones] = useState([]);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [filterCareer, setFilterCareer] = useState(""); // Nuevo estado para el filtro

  const baseURL = 'http://localhost:5000'; // Ajusta según tu configuración

  useEffect(() => {
    const fetchPostulaciones = async () => {
      try {
        const response = await axios.get(`${baseURL}/postulaciones`);
        setPostulaciones(response.data.data || []);
      } catch (error) {
        console.error('Error al obtener las postulaciones:', error);
        setError('Error al obtener las postulaciones. Intenta nuevamente.');
      }
    };

    fetchPostulaciones();
  }, [baseURL]);

  // Se filtran las postulaciones según la carrera ingresada
  const filteredPostulaciones = postulaciones.filter((postulacion) => {
    if (!filterCareer) return true;
    return postulacion.carrera && 
      postulacion.carrera.toLowerCase().includes(filterCareer.toLowerCase());
  });

  const toggleRowExpansion = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleDelete = (postulacionId) => {
    swal({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará la postulación de forma permanente.",
      icon: "warning",
      buttons: ["Cancelar", "Eliminar"],
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          await axios.delete(`${baseURL}/postulaciones/${postulacionId}`);
          setPostulaciones(postulaciones.filter((p) => p._id !== postulacionId));
          swal("Postulación eliminada exitosamente.", { icon: "success" });
        } catch (error) {
          console.error("Error al eliminar la postulación:", error);
          swal("Error al eliminar la postulación.", { icon: "error" });
        }
      }
    });
  };

  // Descargar solo las postulaciones filtradas en Excel
  const handleDownloadExcel = () => {
    if (filteredPostulaciones.length === 0) {
      alert('No hay postulaciones para descargar.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredPostulaciones.map((postulacion) => ({
        'Nombre Completo': postulacion.nombre,
        'Correo Electrónico': postulacion.correo,
        'Número de Celular': postulacion.celular,
        'Carnet de Identidad': postulacion.ci,
        'Universidad CEUB': postulacion.universidad,
        'Año de Titulación': postulacion.anioTitulacion,
        'Carrera': postulacion.carrera, // Incluimos la carrera en el reporte
        Profesión: postulacion.profesion,
        'Tipo de Docente': postulacion.tipoDocente,
        Asignaturas: formatAsignaturas(postulacion.asignaturasSeleccionadas),
        Documentos: formatDocumentosForExcel(postulacion.documentos),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Postulaciones');
    XLSX.writeFile(workbook, 'Postulaciones.xlsx');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Encabezado con filtro y botón para descargar Excel */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-800 mb-2 md:mb-0">
          Postulaciones Registradas
        </h2>
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="Filtrar por Carrera"
            value={filterCareer}
            onChange={(e) => setFilterCareer(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Descargar Excel
          </button>
        </div>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {filteredPostulaciones.length === 0 && !error ? (
        <p className="text-gray-600">No hay postulaciones registradas para esta carrera.</p>
      ) : (
        <>
          {/* Vista en tabla para pantallas medianas y superiores */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Nombre Completo</th>
                  <th className="border border-gray-300 px-4 py-2">Correo</th>
                  <th className="border border-gray-300 px-4 py-2">Celular</th>
                  <th className="border border-gray-300 px-4 py-2">C.I.</th>
                  <th className="border border-gray-300 px-4 py-2">Universidad CEUB</th>
                  <th className="border border-gray-300 px-4 py-2">Año de Titulación</th>
                  <th className="border border-gray-300 px-4 py-2">Carrera</th>
                  <th className="border border-gray-300 px-4 py-2">Profesión</th>
                  <th className="border border-gray-300 px-4 py-2">Tipo de Docente</th>
                  <th className="border border-gray-300 px-4 py-2">Materias Postuladas</th>
                  <th className="border border-gray-300 px-4 py-2">Documentación</th>
                  <th className="border border-gray-300 px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPostulaciones.map((postulacion, index) => (
                  <React.Fragment key={postulacion._id}>
                    <tr className="hover:bg-gray-100">
                      <td className="border border-gray-300 px-4 py-2">{postulacion.nombre}</td>
                      <td className="border border-gray-300 px-4 py-2">{postulacion.correo}</td>
                      <td className="border border-gray-300 px-4 py-2">{postulacion.celular}</td>
                      <td className="border border-gray-300 px-4 py-2">{postulacion.ci}</td>
                      <td className="border border-gray-300 px-4 py-2">{postulacion.universidad}</td>
                      <td className="border border-gray-300 px-4 py-2">{postulacion.anioTitulacion}</td>
                      <td className="border border-gray-300 px-4 py-2">{postulacion.carrera}</td>
                      <td className="border border-gray-300 px-4 py-2">{postulacion.profesion}</td>
                      <td className="border border-gray-300 px-4 py-2">{postulacion.tipoDocente}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {formatAsignaturas(postulacion.asignaturasSeleccionadas)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          onClick={() => toggleRowExpansion(index)}
                          className="text-blue-500 underline hover:text-blue-700"
                        >
                          {expandedRows[index] ? 'Ocultar Documentos' : 'Ver Documentos'}
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          onClick={() => handleDelete(postulacion._id)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                    {expandedRows[index] && (
                      <tr>
                        <td colSpan="12" className="border border-gray-300">
                          <DocumentosDetalle documentos={postulacion.documentos} baseURL={baseURL} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista en tarjetas para pantallas pequeñas */}
          <div className="block sm:hidden">
            {filteredPostulaciones.map((postulacion, index) => (
              <div key={postulacion._id} className="border border-gray-300 rounded-lg p-4 mb-4 hover:bg-gray-100">
                <div className="mb-2">
                  <span className="font-bold text-gray-800">{postulacion.nombre}</span>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600"><strong>Correo:</strong> {postulacion.correo}</p>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600"><strong>Celular:</strong> {postulacion.celular}</p>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600"><strong>C.I.:</strong> {postulacion.ci}</p>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600"><strong>Universidad CEUB:</strong> {postulacion.universidad}</p>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600"><strong>Año de Titulación:</strong> {postulacion.anioTitulacion}</p>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600"><strong>Carrera:</strong> {postulacion.carrera}</p>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600"><strong>Profesión:</strong> {postulacion.profesion}</p>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600"><strong>Tipo de Docente:</strong> {postulacion.tipoDocente}</p>
                </div>
                <div className="mb-1">
                  <p className="text-gray-600">
                    <strong>Materias Postuladas:</strong> {formatAsignaturas(postulacion.asignaturasSeleccionadas)}
                  </p>
                </div>
                <div className="mb-1">
                  <button
                    onClick={() => toggleRowExpansion(index)}
                    className="text-blue-500 underline hover:text-blue-700"
                  >
                    {expandedRows[index] ? 'Ocultar Documentos' : 'Ver Documentos'}
                  </button>
                </div>
                {expandedRows[index] && (
                  <div className="mt-2">
                    <DocumentosDetalle documentos={postulacion.documentos} baseURL={baseURL} />
                  </div>
                )}
                <div className="mt-2">
                  <button
                    onClick={() => handleDelete(postulacion._id)}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Postulacionesporcarrera;
