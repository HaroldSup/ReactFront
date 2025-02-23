import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import RegistroDeMeritos from './Registrodemeritos';

function ConcursoDeMeritos() {
  const [registros, setRegistros] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [meritoEdit, setMeritoEdit] = useState(null);
  
  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  // Obtener los registros desde el backend
  const fetchRegistros = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/concurso-meritos`);
      console.log('Registros obtenidos:', response.data);
      setRegistros(response.data);
    } catch (error) {
      console.error('Error al obtener los registros:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al cargar los registros.',
      });
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, [baseURL]);

  // Manejo de eliminación de un registro
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará el registro permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/api/concurso-meritos/${id}`);
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Registro eliminado exitosamente.',
        });
        fetchRegistros();
      } catch (error) {
        console.error('Error al eliminar el registro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al eliminar el registro.',
        });
      }
    }
  };

  // Descargar registros en formato Excel
  const handleDownloadExcel = () => {
    if (registros.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay registros para descargar.',
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      registros.map((registro, index) => ({
        Nro: index + 1,
        Nombre: registro.nombrePostulante,
        CI: registro.ci,
        Fecha: new Date(registro.fechaEvaluacion).toLocaleDateString(),
        Carrera: registro.carrera,
        Puntos: registro.puntosEvaluacion,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Concurso de Méritos');
    XLSX.writeFile(workbook, 'ConcursoDeMeritos.xlsx');
  };

  // Descargar registros en formato PDF
  const handleDownloadPDF = () => {
    if (registros.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay registros para descargar.',
      });
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Concurso de Méritos", 14, 20);

    const tableColumn = ["Nro", "Nombre", "CI", "Fecha", "Carrera", "Puntos"];
    const tableRows = [];

    registros.forEach((registro, index) => {
      const rowData = [
        index + 1,
        registro.nombrePostulante,
        registro.ci,
        new Date(registro.fechaEvaluacion).toLocaleDateString(),
        registro.carrera,
        registro.puntosEvaluacion,
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save("ConcursoDeMeritos.pdf");
  };

  // Manejo de registro o edición de un mérito
  const onMeritoRegistered = () => {
    setMostrarFormulario(false);
    fetchRegistros();
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen w-full">
      {/* Encabezado y botones */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Concurso de Méritos
        </h2>
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
            onClick={() => {
              setMeritoEdit(null);
              setMostrarFormulario(true);
            }}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
          >
            + Añadir Mérito
          </button>
        </div>
      </div>

      {mostrarFormulario ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <RegistroDeMeritos
            merito={meritoEdit}
            onMeritoRegistered={onMeritoRegistered}
            onCancel={() => setMostrarFormulario(false)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full">
          {/* Vista en tabla para pantallas medianas y superiores */}
          <table className="hidden sm:table w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-blue-800 text-white uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Nro</th>
                <th className="py-3 px-6 text-left">Nombre</th>
                <th className="py-3 px-6 text-left">CI</th>
                <th className="py-3 px-6 text-left">Fecha</th>
                <th className="py-3 px-6 text-left">Carrera</th>
                <th className="py-3 px-6 text-left">Puntos</th>
                <th className="py-3 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-light">
              {registros.map((registro, index) => (
                <tr
                  key={registro._id}
                  className="border-b border-gray-200 hover:bg-gray-100"
                >
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {registro.nombrePostulante}
                  </td>
                  <td className="py-3 px-6 text-left">{registro.ci}</td>
                  <td className="py-3 px-6 text-left">
                    {new Date(registro.fechaEvaluacion).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-left">{registro.carrera}</td>
                  <td className="py-3 px-6 text-left">
                    {registro.puntosEvaluacion}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => {
                        setMeritoEdit(registro);
                        setMostrarFormulario(true);
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(registro._id)}
                      className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Vista en tarjetas para pantallas pequeñas */}
          <div className="block sm:hidden w-full">
            {registros.map((registro, index) => (
              <div
                key={registro._id}
                className="border-b border-gray-200 hover:bg-gray-100 p-4"
              >
                <div>
                  <span className="font-bold text-gray-800">
                    {index + 1}. {registro.nombrePostulante}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600">
                    <strong>CI:</strong> {registro.ci}
                  </p>
                  <p className="text-gray-600">
                    <strong>Fecha:</strong>{" "}
                    {new Date(registro.fechaEvaluacion).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    <strong>Carrera:</strong> {registro.carrera}
                  </p>
                  <p className="text-gray-600">
                    <strong>Puntos:</strong> {registro.puntosEvaluacion}
                  </p>
                </div>
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setMeritoEdit(registro);
                      setMostrarFormulario(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(registro._id)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConcursoDeMeritos;
