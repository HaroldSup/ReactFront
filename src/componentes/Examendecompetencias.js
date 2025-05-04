"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import RegistroCompetencias from "./RegistroCompetencias"
import logoEMI from "../images/emiemi.png"

function Examendecompetencias() {
  const [registros, setRegistros] = useState([])
  const [registrosFiltrados, setRegistrosFiltrados] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [competenciaEdit, setCompetenciaEdit] = useState(null)
  const [filtros, setFiltros] = useState({
    busqueda: "",
    campo: "todos", // Opciones: todos, nombre, carnet, tipoEvaluador, materia, carrera
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Obtener registros del backend y filtrar según el usuario
  const fetchRegistros = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/examen-competencias`)
      console.log("Registros obtenidos:", response.data)

      // Recuperar datos del usuario desde localStorage (clave "user")
      const user = JSON.parse(localStorage.getItem("user"))
      console.log("Usuario logueado:", user)

      let registrosData = response.data
      if (user && !user.administrador) {
        registrosData = registrosData.filter((registro) => registro.evaluadorId && registro.evaluadorId === user._id)
      }
      setRegistros(registrosData)
      setRegistrosFiltrados(registrosData) // Inicialmente, mostrar todos los registros
    } catch (error) {
      console.error("Error al obtener los registros:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al cargar los registros.",
      })
    }
  }

  useEffect(() => {
    fetchRegistros()
  }, [baseURL])

  // Aplicar filtros cuando cambian los criterios de búsqueda
  useEffect(() => {
    aplicarFiltros()
  }, [filtros, registros])

  // Función para aplicar los filtros a los registros
  const aplicarFiltros = () => {
    const { busqueda, campo } = filtros

    if (!busqueda.trim()) {
      setRegistrosFiltrados(registros)
      return
    }

    const busquedaLower = busqueda.toLowerCase().trim()

    const resultadosFiltrados = registros.filter((registro) => {
      // Si el campo es "todos", buscar en todos los campos
      if (campo === "todos") {
        return (
          (registro.nombre?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.carnet?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.tipoEvaluador?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.materia?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.carrera?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.nombreEvaluador?.toLowerCase() || "").includes(busquedaLower)
        )
      }

      // Buscar en el campo específico
      switch (campo) {
        case "nombre":
          return (registro.nombre?.toLowerCase() || "").includes(busquedaLower)
        case "carnet":
          return (registro.carnet?.toLowerCase() || "").includes(busquedaLower)
        case "tipoEvaluador":
          return (registro.tipoEvaluador?.toLowerCase() || "").includes(busquedaLower)
        case "evaluador":
          return (registro.nombreEvaluador?.toLowerCase() || "").includes(busquedaLower)
        case "materia":
          return (registro.materia?.toLowerCase() || "").includes(busquedaLower)
        case "carrera":
          return (registro.carrera?.toLowerCase() || "").includes(busquedaLower)
        default:
          return false
      }
    })

    setRegistrosFiltrados(resultadosFiltrados)
  }

  // Manejar cambios en el campo de búsqueda
  const handleBusquedaChange = (e) => {
    setFiltros({
      ...filtros,
      busqueda: e.target.value,
    })
  }

  // Manejar cambios en el campo de filtro
  const handleCampoChange = (e) => {
    setFiltros({
      ...filtros,
      campo: e.target.value,
    })
  }

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      campo: "todos",
    })
  }

  // Manejo de eliminación de registro
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto eliminará el registro permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/api/examen-competencias/${id}`)
        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "Registro eliminado exitosamente.",
        })
        fetchRegistros()
      } catch (error) {
        console.error("Error al eliminar el registro:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un problema al eliminar el registro.",
        })
      }
    }
  }

  // Función para descargar PDF
  const handleDownloadPDF = () => {
    if (registros.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay registros para descargar.",
      })
      return
    }

    // Agrupar registros con reduce
    const grouped = registros.reduce((acc, registro) => {
      const key = `${registro.carnet}-${registro.materia}-${registro.carrera}`
      // Sumar las dos notas de cada evaluación (Plan de Trabajo + Procesos Pedagógicos)
      const notaTotal = Number(registro.notaPlanTrabajo) + Number(registro.notaProcesosPedagogicos)

      if (!acc[key]) {
        acc[key] = {
          carnet: registro.carnet,
          nombre: registro.nombre,
          materia: registro.materia,
          carrera: registro.carrera,
          evaluaciones: [],
        }
      }

      acc[key].evaluaciones.push({
        evaluador: registro.nombreEvaluador || "N/A",
        tipo: registro.tipoEvaluador,
        nota: notaTotal,
      })

      return acc
    }, {})

    const groupedArray = Object.values(grouped).map((group, index) => {
      const evaluaciones = group.evaluaciones.reduce((acc, ev) => {
        acc[ev.tipo] = ev.nota
        return acc
      }, {})

      // Aseguramos que existan las tres notas (Evaluador 1, Evaluador 2, Presidente)
      const evaluador1 = evaluaciones["Evaluador 1"] || 0.0
      const evaluador2 = evaluaciones["Evaluador 2"] || 0.0
      // CAMBIO: Usar "Presidente Tribunal" con T mayúscula
      const presidente = evaluaciones["Presidente Tribunal"] || 0.0

      const total = evaluador1 + evaluador2 + presidente
      const promedio = (total / 3).toFixed(1).replace(".", ",")

      return {
        nro: index + 1,
        nombre: group.nombre,
        materia: group.materia,
        evaluador1,
        evaluador2,
        presidenteTribunal: presidente,
        promedio,
      }
    })

    const doc = new jsPDF()

    // Configuración de márgenes
    const margenIzquierdo = 10
    const margenSuperior = 10
    const anchoUtil = doc.internal.pageSize.width - margenIzquierdo * 2
    const altoEncabezado = 25

    // Dibujar recuadro del encabezado
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.rect(margenIzquierdo, margenSuperior, anchoUtil, altoEncabezado)

    // Sección 1: Logo (izquierda)
    const logoWidth = anchoUtil * 0.25
    doc.line(margenIzquierdo + logoWidth, margenSuperior, margenIzquierdo + logoWidth, margenSuperior + altoEncabezado)

    // Sección 2: Título (centro)
    const tituloWidth = anchoUtil * 0.5
    doc.line(
      margenIzquierdo + logoWidth + tituloWidth,
      margenSuperior,
      margenIzquierdo + logoWidth + tituloWidth,
      margenSuperior + altoEncabezado,
    )

    // Intentar cargar el logo
    try {
      const img = new Image()
      img.src = logoEMI

      img.onload = () => {
        doc.addImage(img, "PNG", margenIzquierdo + 2, margenSuperior + 2, logoWidth - 4, altoEncabezado - 4)
        continuarGeneracionPDF()
      }

      img.onerror = (error) => {
        console.error("Error al cargar el logo:", error)
        mostrarPlaceholder()
        continuarGeneracionPDF()
      }
    } catch (error) {
      console.error("Error al procesar el logo:", error)
      mostrarPlaceholder()
      continuarGeneracionPDF()
    }

    function mostrarPlaceholder() {
      doc.setDrawColor(200, 200, 200)
      doc.setFillColor(240, 240, 240)
      doc.rect(margenIzquierdo + 2, margenSuperior + 2, logoWidth - 4, altoEncabezado - 4, "FD")
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text("LOGO EMI", margenIzquierdo + logoWidth / 2, margenSuperior + altoEncabezado / 2, {
        align: "center",
      })
    }

    function continuarGeneracionPDF() {
      // Título en el centro
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text(
        "RESULTADOS FINALES DEL EXAMEN DE COMPETENCIAS",
        margenIzquierdo + logoWidth + tituloWidth / 2,
        margenSuperior + altoEncabezado / 2,
        { align: "center" },
      )

      // Información derecha (Código, Versión, Página)
      const seccionDerecha = margenIzquierdo + logoWidth + tituloWidth
      const anchoDerecha = anchoUtil - logoWidth - tituloWidth
      const altoFila = altoEncabezado / 3

      doc.line(seccionDerecha, margenSuperior + altoFila, seccionDerecha + anchoDerecha, margenSuperior + altoFila)
      doc.line(
        seccionDerecha,
        margenSuperior + altoFila * 2,
        seccionDerecha + anchoDerecha,
        margenSuperior + altoFila * 2,
      )

      const mitadDerecha = seccionDerecha + anchoDerecha / 2
      doc.line(mitadDerecha, margenSuperior, mitadDerecha, margenSuperior + altoFila * 2)

      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")

      doc.text("Código:", seccionDerecha + 5, margenSuperior + altoFila / 2 + 2)
      doc.text("CB-UEA.EA-R-22", seccionDerecha + anchoDerecha - 3, margenSuperior + altoFila / 2 + 2, {
        align: "right",
      })

      doc.text("Versión:", seccionDerecha + 5, margenSuperior + altoFila + altoFila / 2 + 2)
      doc.text("1.0", seccionDerecha + anchoDerecha - 3, margenSuperior + altoFila + altoFila / 2 + 2, {
        align: "right",
      })

      doc.text("Página 1 de 1", seccionDerecha + anchoDerecha / 2, margenSuperior + altoFila * 2 + altoFila / 2 + 2, {
        align: "center",
      })

      // Preparar datos para la tabla
      const tableColumn = [
        { title: "N°", dataKey: "nro" },
        { title: "Nombres y\nApellidos", dataKey: "nombre" },
        { title: "Materia a la que\npostula", dataKey: "materia" },
        { title: "Puntaje\nEvaluador 1", dataKey: "evaluador1" },
        { title: "Puntaje\nEvaluador 2", dataKey: "evaluador2" },
        { title: "Puntaje\nPresidente\nTribunal", dataKey: "presidenteTribunal" },
        { title: "PROMEDIO\nTOTAL", dataKey: "promedio" },
      ]

      const tableData = []

      groupedArray.forEach((record) => {
        tableData.push({
          nro: record.nro,
          nombre: record.nombre || "",
          materia: record.materia || "",
          evaluador1: Number.parseFloat(record.evaluador1).toFixed(1).replace(".", ","),
          evaluador2: Number.parseFloat(record.evaluador2).toFixed(1).replace(".", ","),
          presidenteTribunal: Number.parseFloat(record.presidenteTribunal).toFixed(1).replace(".", ","),
          promedio: record.promedio,
        })
      })

      // Ya no completamos hasta 25 filas, solo usamos los datos existentes

      const colorGrisClaro = [230, 230, 230]

      // Usar autoTable para generar la tabla
      doc.autoTable({
        startY: margenSuperior + altoEncabezado + 5,
        columns: tableColumn,
        body: tableData,
        theme: "grid",
        margin: { left: margenIzquierdo, right: margenIzquierdo },
        tableWidth: anchoUtil,
        headStyles: {
          fillColor: colorGrisClaro,
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          cellPadding: 2,
        },
        styles: {
          fontSize: 10,
          cellPadding: 2,
          lineWidth: 0.5,
          lineColor: [0, 0, 0],
          font: "helvetica",
        },
        didParseCell: (data) => {
          data.cell.styles.lineColor = [0, 0, 0]
          data.cell.styles.lineWidth = 0.5
        },
      })

      // Obtener la posición Y final de la tabla
      const finalY = doc.autoTable.previous.finalY || margenSuperior + altoEncabezado + 5 + tableData.length * 10

      // Obtener fecha actual con zona horaria de Bolivia (UTC-4)
      const fechaActual = new Date()
      // Ajustar a la zona horaria de Bolivia (UTC-4)
      const fechaBolivia = new Date(fechaActual.getTime() - (fechaActual.getTimezoneOffset() + 240) * 60000)

      const dia = fechaBolivia.getDate()
      const meses = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ]
      const mes = meses[fechaBolivia.getMonth()]
      const anio = fechaBolivia.getFullYear()

      const fechaFormateada = `Cochabamba, ${dia} de ${mes} de ${anio}`

      // Espacio reducido después de la tabla
      const espacioPostTabla = 15

      // Centrar la fecha
      const anchoDocumento = doc.internal.pageSize.width
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text(fechaFormateada, anchoDocumento / 2, finalY + espacioPostTabla, { align: "center" })

      // Espacio reducido entre fecha y firma
      const espacioEntreFechaYFirma = 30

      // Línea para la firma
      const anchoLinea = 60
      doc.setLineWidth(0.5)
      doc.line(
        anchoDocumento / 2 - anchoLinea / 2,
        finalY + espacioPostTabla + espacioEntreFechaYFirma - 10,
        anchoDocumento / 2 + anchoLinea / 2,
        finalY + espacioPostTabla + espacioEntreFechaYFirma - 10,
      )

      // Centrar el texto del presidente (manteniendo PDTE.)
      doc.setFont("helvetica", "bold")
      doc.text(
        "PDTE. DE LA COMISIÓN EVALUADORA – EXAMEN DE COMPETENCIAS",
        anchoDocumento / 2,
        finalY + espacioPostTabla + espacioEntreFechaYFirma,
        { align: "center" },
      )

      // Agregar número de página en la parte inferior
      const espacioPagina = 15
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(
        "Página 1 de 1",
        anchoDocumento / 2,
        finalY + espacioPostTabla + espacioEntreFechaYFirma + espacioPagina,
        { align: "center" },
      )

      doc.save("resultados_examen_competencias.pdf")
    }
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen w-full">
      {/* Encabezado y botones */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Registro de Competencias</h2>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 transition"
          >
            Descargar PDF
          </button>
          <button
            onClick={() => {
              setCompetenciaEdit(null)
              setMostrarFormulario(true)
            }}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
          >
            + Añadir Registro
          </button>
        </div>
      </div>

      {/* Sección de filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center w-full md:w-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar..."
                value={filtros.busqueda}
                onChange={handleBusquedaChange}
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="ml-2 p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              title="Mostrar filtros avanzados"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {mostrarFiltros && (
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="flex items-center">
                <label htmlFor="campo" className="mr-2 text-sm font-medium text-gray-700">
                  Filtrar por:
                </label>
                <select
                  id="campo"
                  value={filtros.campo}
                  onChange={handleCampoChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los campos</option>
                  <option value="nombre">Nombre</option>
                  <option value="carnet">Carnet</option>
                  <option value="tipoEvaluador">Tipo Evaluador</option>
                  <option value="evaluador">Evaluador</option>
                  <option value="materia">Materia</option>
                  <option value="carrera">Carrera</option>
                </select>
              </div>
              <button
                onClick={limpiarFiltros}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {registrosFiltrados.length} de {registros.length} registros
        </div>
      </div>

      {mostrarFormulario ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <RegistroCompetencias
            competencia={competenciaEdit}
            onCompetenciaRegistered={(nuevoRegistro) => {
              setMostrarFormulario(false)
              const user = JSON.parse(localStorage.getItem("user"))
              if (user && !user.administrador) {
                if (nuevoRegistro) {
                  setRegistros([nuevoRegistro])
                  setRegistrosFiltrados([nuevoRegistro])
                } else {
                  fetchRegistros()
                }
              } else {
                fetchRegistros()
              }
            }}
            onCancel={() => setMostrarFormulario(false)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full">
          {/* Vista en tabla para pantallas medianas y superiores */}
          <div className="overflow-x-auto w-full hidden sm:block">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-blue-800 text-white uppercase text-sm leading-normal">
                <tr>
                  <th className="py-3 px-6 text-left">Nro</th>
                  <th className="py-3 px-6 text-left">Evaluador</th>
                  <th className="py-3 px-6 text-left">Tipo Evaluador</th>
                  <th className="py-3 px-6 text-left">Nombre</th>
                  <th className="py-3 px-6 text-left">Carnet</th>
                  <th className="py-3 px-6 text-left">Materia</th>
                  <th className="py-3 px-6 text-left">Carrera</th>
                  <th className="py-3 px-6 text-left">Fecha</th>
                  <th className="py-3 px-6 text-left">Nota Plan Trabajo (30%)</th>
                  <th className="py-3 px-6 text-left">Nota Procesos Pedagógicos (30%)</th>
                  <th className="py-3 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-light">
                {registrosFiltrados.length > 0 ? (
                  registrosFiltrados.map((registro, index) => (
                    <tr key={registro._id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{index + 1}</td>
                      <td className="py-3 px-6 text-left">{registro.nombreEvaluador || ""}</td>
                      <td className="py-3 px-6 text-left">{registro.tipoEvaluador}</td>
                      <td className="py-3 px-6 text-left">{registro.nombre}</td>
                      <td className="py-3 px-6 text-left">{registro.carnet}</td>
                      <td className="py-3 px-6 text-left">{registro.materia}</td>
                      <td className="py-3 px-6 text-left">{registro.carrera}</td>
                      <td className="py-3 px-6 text-left">{new Date(registro.fecha).toLocaleDateString()}</td>
                      <td className="py-3 px-6 text-left">{registro.notaPlanTrabajo}</td>
                      <td className="py-3 px-6 text-left">{registro.notaProcesosPedagogicos}</td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => {
                              setCompetenciaEdit(registro)
                              setMostrarFormulario(true)
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="py-6 text-center text-gray-500">
                      No se encontraron registros que coincidan con los criterios de búsqueda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Vista en tarjetas para pantallas pequeñas */}
          <div className="block sm:hidden w-full">
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((registro, index) => (
                <div key={registro._id} className="border-b border-gray-200 hover:bg-gray-100 p-4">
                  <div>
                    <span className="font-bold text-gray-800">
                      {index + 1}. {registro.nombre}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-600">
                      <strong>Evaluador:</strong> {registro.nombreEvaluador || ""}
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
                      <strong>Carrera:</strong> {registro.carrera}
                    </p>
                    <p className="text-gray-600">
                      <strong>Fecha:</strong> {new Date(registro.fecha).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>Nota Plan Trabajo (30%):</strong> {registro.notaPlanTrabajo}
                    </p>
                    <p className="text-gray-600">
                      <strong>Nota Procesos Pedagógicos (30%):</strong> {registro.notaProcesosPedagogicos}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        setCompetenciaEdit(registro)
                        setMostrarFormulario(true)
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
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No se encontraron registros que coincidan con los criterios de búsqueda
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Examendecompetencias
