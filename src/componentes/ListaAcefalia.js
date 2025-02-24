import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FaFileAlt } from 'react-icons/fa';

function ListaAcefalia({ onAddAcefalia, onEditAcefalia }) {
  const [acefalias, setAcefalias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  useEffect(() => {
    const fetchAcefalias = async () => {
      try {
        const response = await axios.get(`${baseURL}/materias`);
        setAcefalias(response.data);
      } catch (error) {
        console.error('Error al obtener las acefalías:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener las acefalías. Por favor, inténtalo más tarde.',
        });
      }
    };
    fetchAcefalias();
  }, [baseURL]);

  // Filtrar por carrera
  const filteredAcefalias = acefalias.filter(acefalia =>
    acefalia.carrera.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteAcefalia = async (acefaliaId) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará la acefalia permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/materias/${acefaliaId}`);
        setAcefalias((prev) => prev.filter((acefalia) => acefalia._id !== acefaliaId));
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Acefalia eliminada exitosamente.',
        });
      } catch (error) {
        console.error('Error al eliminar la acefalia:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al eliminar la acefalia.',
        });
      }
    }
  };

  const handleDownloadExcel = () => {
    if (acefalias.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay acefalías para descargar.',
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      acefalias.map((acefalia) => ({
        Asignatura: acefalia.asignatura,
        Requisitos: acefalia.requisitos,
        Semestre: acefalia.semestre,
        'Nivel Académico': acefalia.nivelAcademico,
        Carrera: acefalia.carrera,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Acefalias');

    XLSX.writeFile(workbook, 'Lista_Acefalias.xlsx');
  };

  const handleDownloadPDF = () => {
    if (acefalias.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay acefalías para descargar.',
      });
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Lista de Acefalias", 14, 20);
    const tableColumn = ["Nro", "Asignatura", "Requisitos", "Semestre", "Nivel Académico", "Carrera"];
    const tableRows = [];

    acefalias.forEach((acefalia, index) => {
      const requisitos = acefalia.requisitos
        ? acefalia.requisitos.split('.').filter(req => req.trim() !== "").join(" | ")
        : "";
      const rowData = [
        index + 1,
        acefalia.asignatura,
        requisitos,
        acefalia.semestre,
        acefalia.nivelAcademico,
        acefalia.carrera,
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save("Lista_Acefalias.pdf");
  };

  // Función para formatear asignaturas
  const formatAsignaturas = (asignaturas) => {
    if (!asignaturas) return "";
    if (Array.isArray(asignaturas)) {
      return asignaturas.join(" | ");
    }
    return asignaturas;
  };

  const DocumentosDetalle = ({ documentos }) => {
    return (
      <div className="grid grid-cols-2 gap-4 p-4">
        <p className="text-sm text-gray-600">[Visualización de documentos]</p>
      </div>
    );
  };

  const [expandedRows, setExpandedRows] = useState({});

  const toggleRowExpansion = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Lista de Acefalia</h2>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition"
          >
            Descargar Excel
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 transition"
          >
            Descargar PDF
          </button>
          <button
            onClick={onAddAcefalia}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
          >
            + Añadir Acefalia
          </button>
        </div>
      </div>
      
      {/* Filtro para buscar por carrera */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por carrera"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full"
        />
      </div>

      {/* Vista en tabla para pantallas medianas y superiores */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hidden sm:table">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-blue-800 text-white uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Nro</th>
              <th className="py-3 px-6 text-left">Asignatura</th>
              <th className="py-3 px-6 text-left">Requisitos</th>
              <th className="py-3 px-6 text-left">Semestre</th>
              <th className="py-3 px-6 text-left">Nivel Académico</th>
              <th className="py-3 px-6 text-left">Carrera</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {filteredAcefalias.map((acefalia, index) => (
              <tr key={acefalia._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{index + 1}</td>
                <td className="py-3 px-6 text-left font-medium text-gray-800">{acefalia.asignatura}</td>
                <td className="py-3 px-6 text-left text-gray-600">
                  {acefalia.requisitos &&
                    acefalia.requisitos.split('.').map(
                      (req, idx) => req.trim() && <p key={idx}>• {req.trim()}</p>
                    )}
                </td>
                <td className="py-3 px-6 text-left">{acefalia.semestre}</td>
                <td className="py-3 px-6 text-left">{acefalia.nivelAcademico}</td>
                <td className="py-3 px-6 text-left">{acefalia.carrera}</td>
                <td className="py-3 px-6 text-center flex justify-center space-x-2">
                  <button
                    onClick={() => onEditAcefalia(acefalia)}
                    className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteAcefalia(acefalia._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista en tarjetas para pantallas pequeñas */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden block sm:hidden">
        {filteredAcefalias.map((acefalia, index) => (
          <div key={acefalia._id} className="border-b border-gray-200 hover:bg-gray-100 p-4">
            <div>
              <span className="font-bold text-gray-800">
                {index + 1}. {acefalia.asignatura}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-gray-600 font-semibold">Requisitos:</p>
              {acefalia.requisitos &&
                acefalia.requisitos.split('.').map(
                  (req, idx) =>
                    req.trim() && (
                      <p key={idx} className="text-gray-600">
                        • {req.trim()}
                      </p>
                    )
                )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <p className="text-gray-600">
                <strong>Semestre:</strong> {acefalia.semestre}
              </p>
              <p className="text-gray-600">
                <strong>Nivel Académico:</strong> {acefalia.nivelAcademico}
              </p>
              <p className="text-gray-600 col-span-2">
                <strong>Carrera:</strong> {acefalia.carrera}
              </p>
            </div>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => onEditAcefalia(acefalia)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDeleteAcefalia(acefalia._id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListaAcefalia;
