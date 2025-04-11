// Reportes.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function Reportes() {
  const [reportData, setReportData] = useState([]);
  const [filterCareer, setFilterCareer] = useState("");
  const [filterCI, setFilterCI] = useState("");
  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Realizar las tres peticiones simultáneas
        const [meritosRes, conocimientosRes, competenciasRes] = await Promise.all([
          axios.get(`${baseURL}/api/concurso-meritos`),
          axios.get(`${baseURL}/api/examen-conocimientos`),
          axios.get(`${baseURL}/api/examen-competencias`)
        ]);

        const meritos = meritosRes.data;
        const conocimientos = conocimientosRes.data;
        const competencias = competenciasRes.data;

        // Map para méritos (usa "carnet" o "ci")
        const meritosMap = new Map();
        meritos.forEach(record => {
          const id = record.carnet || record.ci;
          if (id) {
            if (!meritosMap.has(id)) {
              meritosMap.set(id, {
                puntosEvaluacion: Number(record.puntosEvaluacion) || 0,
                nombre: record.nombrePostulante || record.nombre || ''
              });
            }
          }
        });

        // Map para conocimientos (usa "carnet" o "ci")
        const conocimientosMap = new Map();
        conocimientos.forEach(record => {
          const id = record.carnet || record.ci;
          if (id) {
            if (!conocimientosMap.has(id)) {
              conocimientosMap.set(id, {
                notaFinal: Number(record.notaFinal) || 0,
                nombre: record.nombrePostulante || record.nombre || ''
              });
            }
          }
        });

        // Map para competencias (agrupado por combinación: (carnet, materia, carrera))
        const competenciasMap = new Map();
        competencias.forEach(record => {
          const id = record.carnet || record.ci;
          if (id && record.materia && record.carrera) {
            const key = `${id}-${record.materia}-${record.carrera}`;
            if (!competenciasMap.has(key)) {
              competenciasMap.set(key, {
                carnet: id,
                materia: record.materia,
                carrera: record.carrera,
                notaPlanTrabajo: Number(record.notaPlanTrabajo) || 0,
                notaProcesosPedagogicos: Number(record.notaProcesosPedagogicos) || 0,
                nombre: record.nombre || ''
              });
            } else {
              const prev = competenciasMap.get(key);
              competenciasMap.set(key, {
                ...prev,
                notaPlanTrabajo: prev.notaPlanTrabajo + (Number(record.notaPlanTrabajo) || 0),
                notaProcesosPedagogicos: prev.notaProcesosPedagogicos + (Number(record.notaProcesosPedagogicos) || 0)
              });
            }
          }
        });

        // Unir datos y calcular el puntaje final
        const reportArray = [];
        let index = 1;
        competenciasMap.forEach(data => {
          const { carnet, materia, carrera } = data;
          const meritoData = meritosMap.get(carnet) || { puntosEvaluacion: 0, nombre: '' };
          const conocimientoData = conocimientosMap.get(carnet) || { notaFinal: 0, nombre: '' };

          const nombre = meritoData.nombre || conocimientoData.nombre || data.nombre;

          // Fórmula final
          const finalScore =
            meritoData.puntosEvaluacion +
            conocimientoData.notaFinal +
            data.notaPlanTrabajo +
            data.notaProcesosPedagogicos;

          reportArray.push({
            nro: index++,
            carnet,
            nombre,
            materia,
            carrera,
            meritos: meritoData.puntosEvaluacion,
            conocimientos: conocimientoData.notaFinal,
            competenciaPlanTrabajo: data.notaPlanTrabajo,
            competenciaProcesos: data.notaProcesosPedagogicos,
            finalScore: finalScore.toFixed(2)
          });
        });

        // Ordenar de mayor a menor puntaje final
        reportArray.sort((a, b) => b.finalScore - a.finalScore);
        setReportData(reportArray);
      } catch (error) {
        console.error('Error al obtener datos para el reporte:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al cargar los datos del reporte.'
        });
      }
    };

    fetchData();
  }, [baseURL]);

  // Filtrar los datos según "carrera" y "carnet"
  const filteredData = reportData.filter(record =>
    record.carrera.toLowerCase().includes(filterCareer.toLowerCase()) &&
    record.carnet.toLowerCase().includes(filterCI.toLowerCase())
  );

  // Exportar a Excel usando los datos filtrados
  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay datos para descargar.'
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map(record => ({
        Nro: record.nro,
        Carnet: record.carnet,
        Nombre: record.nombre,
        Materia: record.materia,
        Carrera: record.carrera,
        Méritos: record.meritos,
        'Conocimientos (40%)': record.conocimientos,
        'Competencia Plan Trabajo (30%)': record.competenciaPlanTrabajo,
        'Competencia Clase Magistral (30%)': record.competenciaProcesos,
        'Puntaje Final': record.finalScore
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte General de Notas');
    XLSX.writeFile(workbook, 'ReporteGeneralDeNotas.xlsx');
  };

  // Exportar a PDF usando los datos filtrados
  const handleDownloadPDF = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay datos para descargar.'
      });
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte General de Notas', 14, 20);

    const tableColumn = [
      'Nro',
      'Carnet',
      'Nombre',
      'Materia',
      'Carrera',
      'Méritos',
      'Conocimientos (40%)',
      'Competencia Plan Trabajo (30%)',
      'Competencia Clase Magistral (30%)',
      'Puntaje Final'
    ];
    const tableRows = [];

    filteredData.forEach(record => {
      const rowData = [
        record.nro,
        record.carnet,
        record.nombre,
        record.materia,
        record.carrera,
        record.meritos,
        record.conocimientos,
        record.competenciaPlanTrabajo,
        record.competenciaProcesos,
        record.finalScore
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30
    });
    doc.save('ReporteGeneralDeNotas.pdf');
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen w-full">
      {/* Encabezado: título, filtros y botones de descarga */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Reporte General de Notas</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div>
            <label htmlFor="filterCareer" className="block text-gray-700 mb-1">
              Filtrar por Carrera:
            </label>
            <input
              id="filterCareer"
              type="text"
              value={filterCareer}
              onChange={(e) => setFilterCareer(e.target.value)}
              placeholder="Ingrese la carrera..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label htmlFor="filterCI" className="block text-gray-700 mb-1">
              Filtrar por CI:
            </label>
            <input
              id="filterCI"
              type="text"
              value={filterCI}
              onChange={(e) => setFilterCI(e.target.value)}
              placeholder="Ingrese el CI..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
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
        </div>
      </div>

      {/* Contenedor a pantalla completa y con scroll horizontal si la tabla es muy ancha */}
      <div className="bg-white rounded-xl shadow-lg w-full overflow-x-auto">
        {/* Vista en tabla para pantallas medianas y superiores */}
        <table className="min-w-full bg-white border border-gray-200 hidden sm:table">
          <thead className="bg-blue-800 text-white uppercase text-sm leading-normal">
            <tr>
              <th className="py-3 px-4 text-left">Nro</th>
              <th className="py-3 px-4 text-left">Carnet</th>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Materia</th>
              <th className="py-3 px-4 text-left">Carrera</th>
              <th className="py-3 px-4 text-left">Méritos</th>
              <th className="py-3 px-4 text-left">Conocimientos (40%)</th>
              <th className="py-3 px-4 text-left">Comp. PT (30%)</th>
              <th className="py-3 px-4 text-left">Comp. CM (30%)</th>
              <th className="py-3 px-4 text-left">Puntaje Final</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {filteredData.map(record => (
              <tr key={`${record.carnet}-${record.materia}-${record.carrera}`} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-2 px-4">{record.nro}</td>
                <td className="py-2 px-4">{record.carnet}</td>
                <td className="py-2 px-4">{record.nombre}</td>
                <td className="py-2 px-4">{record.materia}</td>
                <td className="py-2 px-4">{record.carrera}</td>
                <td className="py-2 px-4">{record.meritos}</td>
                <td className="py-2 px-4">{record.conocimientos}</td>
                <td className="py-2 px-4">{record.competenciaPlanTrabajo}</td>
                <td className="py-2 px-4">{record.competenciaProcesos}</td>
                <td className="py-2 px-4">{record.finalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista en tarjetas para pantallas pequeñas */}
      <div className="bg-white rounded-xl shadow-lg block sm:hidden mt-4">
        {filteredData.map((record) => (
          <div
            key={`${record.carnet}-${record.materia}-${record.carrera}`}
            className="border-b border-gray-200 hover:bg-gray-100 p-4"
          >
            <div className="mb-1">
              <span className="font-bold text-gray-800">
                {record.nro}. {record.nombre}
              </span>
            </div>
            <p className="text-gray-600">
              <strong>Carnet:</strong> {record.carnet}
            </p>
            <p className="text-gray-600">
              <strong>Materia:</strong> {record.materia}
            </p>
            <p className="text-gray-600">
              <strong>Carrera:</strong> {record.carrera}
            </p>
            <p className="text-gray-600">
              <strong>Méritos:</strong> {record.meritos}
            </p>
            <p className="text-gray-600">
              <strong>Conocimientos (40%):</strong> {record.conocimientos}
            </p>
            <p className="text-gray-600">
              <strong>Comp. Plan Trabajo (30%):</strong> {record.competenciaPlanTrabajo}
            </p>
            <p className="text-gray-600">
              <strong>Comp. Clase Magistral (30%):</strong> {record.competenciaProcesos}
            </p>
            <p className="text-gray-600">
              <strong>Puntaje Final:</strong> {record.finalScore}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reportes;
