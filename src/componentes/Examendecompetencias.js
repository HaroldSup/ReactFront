"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import RegistroCompetencias from "./RegistroCompetencias"
import logoEMI from "../images/emiemi.png"
import {
  Search,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Plus,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
} from "lucide-react"
import * as XLSX from "xlsx"

function Examendecompetencias() {
  const [registros, setRegistros] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [competenciaEdit, setCompetenciaEdit] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [filters, setFilters] = useState({
    carrera: "",
    tipoEvaluador: "",
    gestion: "",
    materia: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Obtener registros del backend y filtrar según el usuario
  const fetchRegistros = async () => {
    setIsLoading(true)
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
    } catch (error) {
      console.error("Error al obtener los registros:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al cargar los registros.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistros()
  }, [baseURL])

  // Extraer valores únicos para los filtros
  const uniqueCarreras = [...new Set(registros.map((r) => r.carrera).filter(Boolean))].sort()
  const uniqueTiposEvaluador = [...new Set(registros.map((r) => r.tipoEvaluador).filter(Boolean))].sort()
  const uniqueGestiones = [
    ...new Set(
      registros
        .map((r) => {
          if (r.fecha) {
            return new Date(r.fecha).getFullYear().toString()
          }
          return null
        })
        .filter(Boolean),
    ),
  ].sort((a, b) => b - a)
  const uniqueMaterias = [...new Set(registros.map((r) => r.materia).filter(Boolean))].sort()

  // Filtrar registros
  const filteredRegistros = registros.filter((registro) => {
    const matchesSearch =
      registro.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.carnet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.tipoEvaluador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.materia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.carrera?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.nombreEvaluador?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCarrera = filters.carrera ? registro.carrera === filters.carrera : true
    const matchesTipoEvaluador = filters.tipoEvaluador ? registro.tipoEvaluador === filters.tipoEvaluador : true
    const matchesMateria = filters.materia ? registro.materia === filters.materia : true
    const matchesGestion = filters.gestion
      ? new Date(registro.fecha).getFullYear().toString() === filters.gestion
      : true

    return matchesSearch && matchesCarrera && matchesTipoEvaluador && matchesGestion && matchesMateria
  })

  // Calcular elementos para la página actual
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredRegistros.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage)

  // Función para cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Asegurar que la página actual es válida
  useEffect(() => {
    if (currentPage > Math.ceil(filteredRegistros.length / itemsPerPage) && currentPage > 1) {
      setCurrentPage(1)
    }
  }, [filteredRegistros.length, currentPage, itemsPerPage])

  const resetFilters = () => {
    setFilters({
      carrera: "",
      tipoEvaluador: "",
      gestion: "",
      materia: "",
    })
    setSearchTerm("")
  }

  const handleDownloadExcel = () => {
    if (filteredRegistros.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay registros para descargar con el filtro aplicado.",
      })
      return
    }
    const worksheet = XLSX.utils.json_to_sheet(
      filteredRegistros.map((registro) => ({
        Evaluador: registro.nombreEvaluador,
        "Tipo Evaluador": registro.tipoEvaluador,
        Nombre: registro.nombre,
        Carnet: registro.carnet,
        Materia: registro.materia,
        Carrera: registro.carrera,
        Fecha: new Date(registro.fecha).toLocaleDateString(),
        "Nota Plan Trabajo": registro.notaPlanTrabajo,
        "Nota Procesos Pedagógicos": registro.notaProcesosPedagogicos,
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Examen_Competencias")
    XLSX.writeFile(workbook, "Examen_Competencias.xlsx")
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
        setRegistros((prev) => prev.filter((registro) => registro._id !== id))
        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "Registro eliminado exitosamente.",
        })
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

  // ✅ FUNCIÓN MODIFICADA PARA AGRUPAR POR CARRERA
  const handleDownloadPDF = () => {
    if (registros.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay registros para descargar.",
      })
      return
    }

    // ✅ PASO 1: Agrupar registros por carnet-materia-carrera
    const grouped = registros.reduce((acc, registro) => {
      const key = `${registro.carnet}-${registro.materia}-${registro.carrera}`
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

    // ✅ PASO 2: Procesar evaluaciones y crear array de datos
    const groupedArray = Object.values(grouped).map((group) => {
      const evaluaciones = group.evaluaciones.reduce((acc, ev) => {
        acc[ev.tipo] = ev.nota
        return acc
      }, {})
      const evaluador1 = evaluaciones["Evaluador 1"] || 0.0
      const evaluador2 = evaluaciones["Evaluador 2"] || 0.0
      const presidente = evaluaciones["Presidente Tribunal"] || 0.0
      const total = evaluador1 + evaluador2 + presidente
      const promedio = (total / 3).toFixed(1).replace(".", ",")
      return {
        nombre: group.nombre,
        materia: group.materia,
        carrera: group.carrera,
        evaluador1,
        evaluador2,
        presidenteTribunal: presidente,
        promedio,
      }
    })

    // ✅ PASO 3: Agrupar por carrera
    const registrosPorCarrera = {}
    groupedArray.forEach((registro) => {
      const carrera = registro.carrera || "Sin Carrera"
      if (!registrosPorCarrera[carrera]) {
        registrosPorCarrera[carrera] = []
      }
      registrosPorCarrera[carrera].push(registro)
    })

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height

    // ✅ PASO 4: Procesar cada carrera
    let carreraIndex = 0
    Object.entries(registrosPorCarrera).forEach(([carrera, registrosCarrera]) => {
      if (carreraIndex > 0) {
        doc.addPage()
      }
      carreraIndex++

      // Configuración de márgenes
      const margenIzquierdo = 10
      const margenSuperior = 10
      const anchoUtil = pageWidth - margenIzquierdo * 2
      const altoEncabezado = 25

      // Dibujar recuadro del encabezado
      doc.setDrawColor(0)
      doc.setLineWidth(0.5)
      doc.rect(margenIzquierdo, margenSuperior, anchoUtil, altoEncabezado)

      // Sección 1: Logo (izquierda)
      const logoWidth = anchoUtil * 0.25
      doc.line(
        margenIzquierdo + logoWidth,
        margenSuperior,
        margenIzquierdo + logoWidth,
        margenSuperior + altoEncabezado,
      )

      // Sección 2: Título (centro)
      const tituloWidth = anchoUtil * 0.5
      doc.line(
        margenIzquierdo + logoWidth + tituloWidth,
        margenSuperior,
        margenIzquierdo + logoWidth + tituloWidth,
        margenSuperior + altoEncabezado,
      )

      // ✅ AGREGAR LOGO
      try {
        const img = new Image()
        img.src = logoEMI
        img.crossOrigin = "anonymous"
        doc.addImage(img, "PNG", margenIzquierdo + 2, margenSuperior + 2, logoWidth - 4, altoEncabezado - 4)
      } catch (error) {
        console.error("Error al cargar el logo:", error)
        // Placeholder para el logo
        doc.setDrawColor(200, 200, 200)
        doc.setFillColor(240, 240, 240)
        doc.rect(margenIzquierdo + 2, margenSuperior + 2, logoWidth - 4, altoEncabezado - 4, "FD")
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text("LOGO EMI", margenIzquierdo + logoWidth / 2, margenSuperior + altoEncabezado / 2, {
          align: "center",
        })
      }

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

      // ✅ AGREGAR TEXTO SIMPLE DE CARRERA
      const yCarrera = margenSuperior + altoEncabezado + 10
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`CARRERA: ${carrera}`, margenIzquierdo, yCarrera)

      // ✅ RENUMERAR POR CARRERA
      const tableData = registrosCarrera.map((record, index) => ({
        nro: index + 1,
        nombre: record.nombre || "",
        materia: record.materia || "",
        evaluador1: Number.parseFloat(record.evaluador1).toFixed(1).replace(".", ","),
        evaluador2: Number.parseFloat(record.evaluador2).toFixed(1).replace(".", ","),
        presidenteTribunal: Number.parseFloat(record.presidenteTribunal).toFixed(1).replace(".", ","),
        promedio: record.promedio,
      }))

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

      const colorGrisClaro = [230, 230, 230]

      // Usar autoTable para generar la tabla
      doc.autoTable({
        startY: yCarrera + 10,
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

      // ✅ AGREGAR FIRMA Y FECHA AL FINAL DE CADA CARRERA
      const finalY = doc.autoTable.previous.finalY || yCarrera + 10 + tableData.length * 10

      // Verificar espacio para firma
      if (finalY + 80 > pageHeight - 20) {
        doc.addPage()
        const nuevaY = margenSuperior
        agregarFirmaYFecha(doc, nuevaY, pageWidth, margenIzquierdo)
      } else {
        agregarFirmaYFecha(doc, finalY, pageWidth, margenIzquierdo)
      }
    })

    doc.save("resultados_examen_competencias.pdf")
  }

  // ✅ FUNCIÓN PARA AGREGAR FIRMA Y FECHA
  const agregarFirmaYFecha = (doc, yPos, pageWidth, margenIzquierdo) => {
    // Obtener fecha actual con zona horaria de Bolivia (UTC-4)
    const fechaActual = new Date()
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

    // Espacio después de la tabla
    const espacioPostTabla = 15

    // Centrar la fecha
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(fechaFormateada, pageWidth / 2, yPos + espacioPostTabla, { align: "center" })

    // Espacio entre fecha y firma
    const espacioEntreFechaYFirma = 30

    // Línea para la firma
    const anchoLinea = 60
    doc.setLineWidth(0.5)
    doc.line(
      pageWidth / 2 - anchoLinea / 2,
      yPos + espacioPostTabla + espacioEntreFechaYFirma - 10,
      pageWidth / 2 + anchoLinea / 2,
      yPos + espacioPostTabla + espacioEntreFechaYFirma - 10,
    )

    // Texto del presidente
    doc.setFont("helvetica", "bold")
    doc.text(
      "PDTE. DE LA COMISIÓN EVALUADORA – EXAMEN DE COMPETENCIAS",
      pageWidth / 2,
      yPos + espacioPostTabla + espacioEntreFechaYFirma,
      { align: "center" },
    )

    // Número de página
    const espacioPagina = 15
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Página 1 de 1", pageWidth / 2, yPos + espacioPostTabla + espacioEntreFechaYFirma + espacioPagina, {
      align: "center",
    })
  }

  return (
    <div className="p-2 sm:p-4 bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Encabezado con título y botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Registro de Competencias</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={handleDownloadExcel}
              className="px-3 py-2 bg-green-600 text-white font-medium rounded-md shadow hover:bg-green-700 transition flex items-center gap-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-2 bg-red-600 text-white font-medium rounded-md shadow hover:bg-red-700 transition flex items-center gap-1"
            >
              <FilePdf className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => {
                setCompetenciaEdit(null)
                setMostrarFormulario(true)
              }}
              className="px-3 py-2 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, carnet, evaluador, materia o carrera..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {filteredRegistros.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
                {Math.min(indexOfLastItem, filteredRegistros.length)} de {filteredRegistros.length} resultados
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center gap-1 whitespace-nowrap"
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {(filters.carrera || filters.tipoEvaluador || filters.gestion || filters.materia) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Panel de filtros desplegable */}
          {showFilters && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="carrera-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Carrera
                  </label>
                  <select
                    id="carrera-filter"
                    value={filters.carrera}
                    onChange={(e) => setFilters({ ...filters, carrera: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las carreras</option>
                    {uniqueCarreras.map((carrera) => (
                      <option key={carrera} value={carrera}>
                        {carrera}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tipo-evaluador-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Evaluador
                  </label>
                  <select
                    id="tipo-evaluador-filter"
                    value={filters.tipoEvaluador}
                    onChange={(e) => setFilters({ ...filters, tipoEvaluador: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los tipos</option>
                    {uniqueTiposEvaluador.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="gestion-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Gestión (Año)
                  </label>
                  <select
                    id="gestion-filter"
                    value={filters.gestion}
                    onChange={(e) => setFilters({ ...filters, gestion: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las gestiones</option>
                    {uniqueGestiones.map((gestion) => (
                      <option key={gestion} value={gestion}>
                        {gestion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="materia-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Materia
                  </label>
                  <select
                    id="materia-filter"
                    value={filters.materia}
                    onChange={(e) => setFilters({ ...filters, materia: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las materias</option>
                    {uniqueMaterias.map((materia) => (
                      <option key={materia} value={materia}>
                        {materia}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Información de resultados y paginación */}
          <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 flex justify-between items-center">
            <div>
              Mostrando {filteredRegistros.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
              {Math.min(indexOfLastItem, filteredRegistros.length)} de {filteredRegistros.length} resultados
            </div>
            <div className="flex items-center">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="mr-2 border border-gray-300 rounded p-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="mr-2">por página</span>
            </div>
          </div>
        </div>

        {/* Formulario o Lista */}
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
          <>
            {/* Estado de carga */}
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando registros...</p>
              </div>
            ) : filteredRegistros.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-gray-600">No se encontraron registros con los filtros aplicados.</p>
                {(searchTerm || filters.carrera || filters.tipoEvaluador || filters.gestion || filters.materia) && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Contenedor responsivo para la tabla */}
                <div className="bg-white rounded-xl shadow-lg w-full overflow-x-auto hidden sm:block">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-blue-800 text-white uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Nro</th>
                        <th className="py-3 px-6 text-left">Evaluador</th>
                        <th className="py-3 px-6 text-left">Tipo Evaluador</th>
                        <th className="py-3 px-6 text-left">Nombre</th>
                        <th className="py-3 px-6 text-left">Carnet</th>
                        <th className="py-3 px-6 text-left">Materia</th>
                        <th className="py-3 px-6 text-left">Carrera</th>
                        <th className="py-3 px-6 text-left">Fecha</th>
                        <th className="py-3 px-6 text-left">Nota Plan Trabajo</th>
                        <th className="py-3 px-6 text-left">Nota Procesos Pedagógicos</th>
                        <th className="py-3 px-6 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm font-light">
                      {currentItems.map((registro, index) => (
                        <tr
                          key={registro._id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"} border-b border-gray-200 hover:bg-gray-100`}
                        >
                          <td className="py-3 px-6 text-left whitespace-nowrap">{indexOfFirstItem + index + 1}</td>
                          <td className="py-3 px-6 text-left">{registro.nombreEvaluador || ""}</td>
                          <td className="py-3 px-6 text-left">{registro.tipoEvaluador}</td>
                          <td className="py-3 px-6 text-left font-medium text-gray-800">{registro.nombre}</td>
                          <td className="py-3 px-6 text-left">{registro.carnet}</td>
                          <td className="py-3 px-6 text-left">{registro.materia}</td>
                          <td className="py-3 px-6 text-left">{registro.carrera}</td>
                          <td className="py-3 px-6 text-left">{new Date(registro.fecha).toLocaleDateString()}</td>
                          <td className="py-3 px-6 text-left font-semibold">{registro.notaPlanTrabajo}</td>
                          <td className="py-3 px-6 text-left font-semibold">{registro.notaProcesosPedagogicos}</td>
                          <td className="py-3 px-6 text-center flex justify-center space-x-2">
                            <button
                              onClick={() => {
                                setCompetenciaEdit(registro)
                                setMostrarFormulario(true)
                              }}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                              title="Editar registro"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDelete(registro._id)}
                              className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                              title="Eliminar registro"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span>Eliminar</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista en tarjetas para pantallas pequeñas */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden block sm:hidden">
                  {currentItems.map((registro, index) => (
                    <div
                      key={registro._id}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"} border-b border-gray-200 hover:bg-gray-100 p-4`}
                    >
                      <div>
                        <span className="font-bold text-gray-800">
                          {indexOfFirstItem + index + 1}. {registro.nombre}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2">
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
                          <strong>Nota Plan Trabajo:</strong>{" "}
                          <span className="font-semibold">{registro.notaPlanTrabajo}</span>
                        </p>
                        <p className="text-gray-600">
                          <strong>Nota Procesos Pedagógicos:</strong>{" "}
                          <span className="font-semibold">{registro.notaProcesosPedagogicos}</span>
                        </p>
                      </div>
                      <div className="mt-4 flex justify-center space-x-4">
                        <button
                          onClick={() => {
                            setCompetenciaEdit(registro)
                            setMostrarFormulario(true)
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(registro._id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        &laquo;
                      </button>
                      {/* Mostrar números de página */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => {
                        if (
                          number === 1 ||
                          number === totalPages ||
                          (number >= currentPage - 1 && number <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={number}
                              onClick={() => paginate(number)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === number
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {number}
                            </button>
                          )
                        }
                        if (
                          (number === 2 && currentPage > 3) ||
                          (number === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return (
                            <span
                              key={number}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Siguiente</span>
                        &raquo;
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Examendecompetencias
