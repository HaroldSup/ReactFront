import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Registrodeconocimientos from './Registrodeconocimientos';

function Examendeconocimientos() {
  const [registros, setRegistros] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [conocimientoEdit, setConocimientoEdit] = useState(null);

  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  // Obtener los registros desde el backend
  const fetchRegistros = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/examen-conocimientos`);
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
        await axios.delete(`${baseURL}/api/examen-conocimientos/${id}`);
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

  // Manejo de registro o edición de un conocimiento
  const onConocimientoRegistered = () => {
    setMostrarFormulario(false);
    fetchRegistros();
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
        'Nombre Evaluador': registro.nombreEvaluador || '',
        'Tipo Evaluador': registro.tipoEvaluador,
        Nombre: registro.nombre,
        Carnet: registro.carnet,
        Materia: registro.materia,
        Fecha: new Date(registro.fecha).toLocaleDateString(),
        'Nota Final (40%)': registro.notaFinal,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');

    XLSX.writeFile(workbook, 'Registros_Conocimientos.xlsx');
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
    doc.text('Registros de Examen de Conocimientos', 14, 20);

    const tableColumn = [
      'Nro',
      'Nombre Evaluador',
      'Tipo Evaluador',
      'Nombre',
      'Carnet',
      'Materia',
      'Fecha',
      'Nota Final (40%)',
    ];
    const tableRows = [];

    registros.forEach((registro, index) => {
      const rowData = [
        index + 1,
        registro.nombreEvaluador || '',
        registro.tipoEvaluador,
        registro.nombre,
        registro.carnet,
        registro.materia,
        new Date(registro.fecha).toLocaleDateString(),
        registro.notaFinal,
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save('Registros_Conocimientos.pdf');
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen w-full">
      {/* Encabezado y botones */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Examen de Conocimientos
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
              setConocimientoEdit(null);
              setMostrarFormulario(true);
            }}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
          >
            + Añadir Registro
          </button>
        </div>
      </div>

      {mostrarFormulario ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Registrodeconocimientos
            conocimiento={conocimientoEdit}
            onConocimientoRegistered={onConocimientoRegistered}
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
                <th className="py-3 px-6 text-left">Evaluador</th>
                <th className="py-3 px-6 text-left">Tipo Evaluador</th>
                <th className="py-3 px-6 text-left">Nombre</th>
                <th className="py-3 px-6 text-left">Carnet</th>
                <th className="py-3 px-6 text-left">Materia</th>
                <th className="py-3 px-6 text-left">Fecha</th>
                <th className="py-3 px-6 text-left">Nota Final (40%)</th>
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
                    {registro.nombreEvaluador || ''}
                  </td>
                  <td className="py-3 px-6 text-left">{registro.tipoEvaluador}</td>
                  <td className="py-3 px-6 text-left">{registro.nombre}</td>
                  <td className="py-3 px-6 text-left">{registro.carnet}</td>
                  <td className="py-3 px-6 text-left">{registro.materia}</td>
                  <td className="py-3 px-6 text-left">
                    {new Date(registro.fecha).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-left">{registro.notaFinal}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => {
                          setConocimientoEdit(registro);
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
                    </div>
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
                    {index + 1}. {registro.nombre}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600">
                    <strong>Evaluador:</strong> {registro.nombreEvaluador || ''}
                  </p>
                  <p className="text-gray-600">
                    <strong>Tipo Evaluador:</strong> {registro.tipoEvaluador}
                  </p>
                  <p className="text-gray-600">
                    <strong>Carnet:</strong> {registro.carnet}
                  </p>
                  <p className="text-gray-600">
                    <strong>Materia:</strong> {registro.materia}
                  </p>
                  <p className="text-gray-600">
                    <strong>Fecha:</strong>{' '}
                    {new Date(registro.fecha).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    <strong>Nota Final (40%):</strong> {registro.notaFinal}
                  </p>
                </div>
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setConocimientoEdit(registro);
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

export default Examendeconocimientos;
