"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import RegistroCompetencias from "./RegistroCompetencias"
import logoEMI from "../images/emiemi.png"

function Examendecompetencias() {
  const [registros, setRegistros] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [competenciaEdit, setCompetenciaEdit] = useState(null)
  //const [filterCareer, setFilterCareer] = useState("") // Filtro por carrera

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

      if (user && !user.administrador) {
        const registrosFiltrados = response.data.filter(
          (registro) => registro.evaluadorId && registro.evaluadorId === user._id,
        )
        setRegistros(registrosFiltrados)
      } else {
        setRegistros(response.data)
      }
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

  // Reemplaza completamente la función handleDownloadExcel con esta versión mejorada:
  const handleDownloadExcel = () => {
    if (registros.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay registros para descargar.",
      })
      return
    }

    // Agrupar registros con reduce - igual que en PDF
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
      const presidente = evaluaciones["Presidente Tribunal"] || 0.0

      const total = evaluador1 + evaluador2 + presidente
      const promedio = (total / 3).toFixed(1)

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

    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new()

    // Preparar los datos para Excel con un formato mejorado
    const datosExcel = []

    // Encabezado con información institucional
    datosExcel.push(["ESCUELA MILITAR DE INGENIERÍA", "", "", "", "", "", ""])
    datosExcel.push(["UNIDAD DE EVALUACIÓN ACADÉMICA", "", "", "", "", "", ""])
    datosExcel.push(["", "", "", "", "", "", ""])

    // Información del documento
    datosExcel.push(["RESULTADOS FINALES DEL EXAMEN DE COMPETENCIAS", "", "", "", "", "", ""])
    datosExcel.push(["", "", "", "", "", "", ""])
    datosExcel.push(["", "", "", "", "", "", ""])

    // Encabezados de la tabla
    datosExcel.push([
      "N°",
      "Nombres y Apellidos",
      "Materia a la que postula",
      "Puntaje Evaluador 1",
      "Puntaje Evaluador 2",
      "Puntaje Presidente Tribunal",
      "PROMEDIO TOTAL",
    ])

    // Datos de estudiantes
    groupedArray.forEach((record) => {
      datosExcel.push([
        record.nro,
        record.nombre || "",
        record.materia || "",
        Number.parseFloat(record.evaluador1).toFixed(1).replace(".", ","),
        Number.parseFloat(record.evaluador2).toFixed(1).replace(".", ","),
        Number.parseFloat(record.presidenteTribunal).toFixed(1).replace(".", ","),
        Number.parseFloat(record.promedio).toFixed(1).replace(".", ","),
      ])
    })

    // Ya no completamos hasta 25 filas, solo usamos los datos existentes

    // Espacio para firmas
    datosExcel.push(["", "", "", "", "", "", ""])
    datosExcel.push(["", "", "", "", "", "", ""])

    // Obtener fecha formateada
    const fecha = new Date()
    const dia = fecha.getDate()
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
    const mes = meses[fecha.getMonth()]
    const anio = fecha.getFullYear()
    const fechaFormateada = `Cochabamba, ${dia} de ${mes} de ${anio}`

    datosExcel.push([fechaFormateada, "", "", "", "", "", ""])
    datosExcel.push(["", "", "", "", "", "", ""])
    datosExcel.push(["PDTE. DE LA COMISIÓN EVALUADORA – EXAMEN DE COMPETENCIAS", "", "", "", "", "", ""])
    datosExcel.push(["", "", "", "", "", "", ""])
    datosExcel.push(["Página 1 de 1", "", "", "", "", "", ""])

    // Crear una hoja de cálculo con los datos
    const ws = XLSX.utils.aoa_to_sheet(datosExcel)

    // Configurar ancho de columnas para mejor visualización
    const wscols = [
      { wch: 5 }, // N°
      { wch: 30 }, // Nombres y Apellidos
      { wch: 30 }, // Materia
      { wch: 15 }, // Evaluador 1
      { wch: 15 }, // Evaluador 2
      { wch: 20 }, // Presidente Tribunal
      { wch: 15 }, // PROMEDIO TOTAL
    ]
    ws["!cols"] = wscols

    // Configurar altura de filas para los encabezados
    const wsrows = [
      { hpt: 25 }, // Altura para fila 1
      { hpt: 25 }, // Altura para fila 2
      { hpt: 15 }, // Altura para fila 3
      { hpt: 30 }, // Altura para fila 4 (título)
      { hpt: 25 }, // Altura para fila 5
      { hpt: 15 }, // Altura para fila 6
      { hpt: 30 }, // Altura para fila 7 (encabezados de tabla)
    ]
    ws["!rows"] = wsrows

    // Aplicar estilos a celdas específicas

    // Estilo para el título institucional
    ws["A1"] = {
      v: "ESCUELA MILITAR DE INGENIERÍA",
      t: "s",
      s: {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" },
      },
    }
    // Fusionar celdas para el título institucional
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // A1:G1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // A2:G2
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // A4:G4
    ]

    // Estilo para la unidad
    ws["A2"] = {
      v: "UNIDAD DE EVALUACIÓN ACADÉMICA",
      t: "s",
      s: {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
      },
    }

    // Estilo para el título principal
    ws["A4"] = {
      v: "RESULTADOS FINALES DEL EXAMEN DE COMPETENCIAS",
      t: "s",
      s: {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" },
      },
    }

    // Estilos para los encabezados de la tabla
    for (let col = 0; col < 7; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 6, c: col })
      ws[cellRef] = {
        ...ws[cellRef],
        s: {
          fill: { fgColor: { rgb: "4472C4" } }, // Azul institucional
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        },
      }
    }

    // Estilos para los datos de la tabla
    for (let row = 7; row < 7 + groupedArray.length; row++) {
      for (let col = 0; col < 7; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
        if (ws[cellRef]) {
          ws[cellRef] = {
            ...ws[cellRef],
            s: {
              alignment: { horizontal: col === 1 || col === 2 ? "left" : "center", vertical: "center" },
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
              },
            },
          }
        }
      }
    }

    // Estilo para la fecha
    const fechaRow = 7 + groupedArray.length + 2
    ws[XLSX.utils.encode_cell({ r: fechaRow, c: 0 })] = {
      ...ws[XLSX.utils.encode_cell({ r: fechaRow, c: 0 })],
      s: {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: "center" }, // Centrar la fecha
      },
    }
    // Fusionar celdas para la fecha
    if (!ws["!merges"]) ws["!merges"] = []
    ws["!merges"].push({ s: { r: fechaRow, c: 0 }, e: { r: fechaRow, c: 6 } })

    // Estilo para la firma
    const firmaRow = fechaRow + 2
    ws[XLSX.utils.encode_cell({ r: firmaRow, c: 0 })] = {
      ...ws[XLSX.utils.encode_cell({ r: firmaRow, c: 0 })],
      s: {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: "center" },
      },
    }
    // Fusionar celdas para la firma
    ws["!merges"].push({ s: { r: firmaRow, c: 0 }, e: { r: firmaRow, c: 6 } })

    // Estilo para el número de página
    const paginaRow = firmaRow + 2
    ws[XLSX.utils.encode_cell({ r: paginaRow, c: 0 })] = {
      ...ws[XLSX.utils.encode_cell({ r: paginaRow, c: 0 })],
      s: {
        font: { sz: 10 },
        alignment: { horizontal: "center" }, // Centrar el número de página
      },
    }
    // Fusionar celdas para el número de página
    ws["!merges"].push({ s: { r: paginaRow, c: 0 }, e: { r: paginaRow, c: 6 } })

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Resultados")

    // Guardar el archivo
    XLSX.writeFile(wb, "resultados_examen_competencias.xlsx")
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

      // Centrar el texto del presidente
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
              setCompetenciaEdit(null)
              setMostrarFormulario(true)
            }}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
          >
            + Añadir Registro
          </button>
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
                {registros.map((registro, index) => (
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista en tarjetas para pantallas pequeñas */}
          <div className="block sm:hidden w-full">
            {registros.map((registro, index) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Examendecompetencias
