// Reportes.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function Reportes() {
  const [reportData, setReportData] = useState([]);
  const [filterCareer, setFilterCareer] = useState(""); // Filtro por carrera
  const [filterCI, setFilterCI] = useState(""); // Filtro por CI del postulante
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

        // Para méritos: se utiliza "carnet" si existe, de lo contrario "ci"
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

        // Para conocimientos: se agrupa igualmente por "carnet" o "ci"
        const conocimientosMap = new Map();
        conocimientos.forEach(record => {
          const id = record.carnet || record.ci;
          if (id) {
            if (!conocimientosMap.has(id)) {
              conocimientosMap.set(id, {
                // Se asume que la notaFinal ya viene ponderada al 40%
                notaFinal: Number(record.notaFinal) || 0,
                nombre: record.nombrePostulante || record.nombre || ''
              });
            }
          }
        });

        // Para competencias: se agrupa por la combinación única (carnet, materia, carrera)
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
                // Se asume que cada nota ya viene ponderada al 30%
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

        // Fusionar datos: Se crea un registro por cada combinación única (carnet, materia, carrera)
        const reportArray = [];
        let index = 1;
        competenciasMap.forEach(data => {
          const { carnet, materia, carrera } = data;
          // Se obtienen los datos globales de méritos y conocimientos usando el id del estudiante
          const meritoData = meritosMap.get(carnet) || { puntosEvaluacion: 0, nombre: '' };
          const conocimientoData = conocimientosMap.get(carnet) || { notaFinal: 0, nombre: '' };

          // Se determina el nombre tomando el disponible en cualquiera de las fuentes
          const nombre = meritoData.nombre || conocimientoData.nombre || data.nombre;

          // Cálculo del puntaje final:
          // Se suma: méritos (tal cual) + conocimientos (ya ponderada al 40) + plan de trabajo (30) + clase magistral (30)
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

        // Ordenar la lista por puntaje final (de mayor a menor)
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

  // Filtrado de los datos según la carrera y CI ingresados
  const filteredData = reportData.filter(record =>
    record.carrera.toLowerCase().includes(filterCareer.toLowerCase()) &&
    record.carnet.toLowerCase().includes(filterCI.toLowerCase())
  );

  // Función para exportar a Excel usando los datos filtrados
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

  // Función para exportar a PDF usando los datos filtrados
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
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Encabezado con título y controles de filtro y descarga */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Reporte General de Notas</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Filtro por Carrera */}
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
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          {/* Filtro por CI */}
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
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
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

      {/* Tabla del reporte utilizando los datos filtrados */}
      <div className="bg-white rounded-xl shadow-lg overflow-auto">
        <table className="w-full text-gray-700 text-sm">
          <thead className="bg-blue-800 text-white uppercase">
            <tr>
              <th className="py-3 px-4 text-left">Nro</th>
              <th className="py-3 px-4 text-left">Carnet</th>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Materia</th>
              <th className="py-3 px-4 text-left">Carrera</th>
              <th className="py-3 px-4 text-left">Méritos</th>
              <th className="py-3 px-4 text-left">Conocimientos (40%)</th>
              <th className="py-3 px-4 text-left">Competencia Plan Trabajo (30%)</th>
              <th className="py-3 px-4 text-left">Competencia Clase Magistral (30%)</th>
              <th className="py-3 px-4 text-left">Puntaje Final</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(record => (
              <tr key={`${record.carnet}-${record.materia}-${record.carrera}`} className="border-b hover:bg-gray-100">
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
    </div>
  );
}

export default Reportes;
