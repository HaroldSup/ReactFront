"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { Search, FileSpreadsheet, FileIcon as FilePdf, Plus, ChevronDown, ChevronUp, Filter } from "lucide-react"
import logoEMI from "../images/emiemi.png"

function ListaAcefalia({ onAddAcefalia, onEditAcefalia }) {
  const [acefalias, setAcefalias] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRows, setExpandedRows] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [filters, setFilters] = useState({
    carrera: "",
    semestre: "",
    nivelAcademico: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  useEffect(() => {
    const fetchAcefalias = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get(`${baseURL}/materias`)
        setAcefalias(response.data)
      } catch (error) {
        console.error("Error al obtener las acefalías:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron obtener las acefalías. Por favor, inténtalo más tarde.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchAcefalias()
  }, [baseURL])

  // Extraer valores únicos para los filtros
  const uniqueCarreras = [...new Set(acefalias.map((a) => a.carrera))].sort()
  const uniqueSemestres = [...new Set(acefalias.map((a) => a.semestre))].sort((a, b) => a - b)
  const uniqueNiveles = [...new Set(acefalias.map((a) => a.nivelAcademico))].sort()

  // Filtrar acefalias
  const filteredAcefalias = acefalias.filter((acefalia) => {
    const matchesSearch =
      acefalia.asignatura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acefalia.carrera.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCarrera = filters.carrera ? acefalia.carrera === filters.carrera : true
    const matchesSemestre = filters.semestre ? acefalia.semestre === filters.semestre : true
    const matchesNivel = filters.nivelAcademico ? acefalia.nivelAcademico === filters.nivelAcademico : true

    return matchesSearch && matchesCarrera && matchesSemestre && matchesNivel
  })

  // Calcular elementos para la página actual
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredAcefalias.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredAcefalias.length / itemsPerPage)

  // Función para cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Añadir justo antes del return para asegurar que la página actual es válida
  useEffect(() => {
    if (currentPage > Math.ceil(filteredAcefalias.length / itemsPerPage) && currentPage > 1) {
      setCurrentPage(1)
    }
  }, [filteredAcefalias.length, currentPage, itemsPerPage])

  const handleDeleteAcefalia = async (acefaliaId) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto eliminará la acefalia permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/materias/${acefaliaId}`)
        setAcefalias((prev) => prev.filter((acefalia) => acefalia._id !== acefaliaId))
        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "Acefalia eliminada exitosamente.",
        })
      } catch (error) {
        console.error("Error al eliminar la acefalia:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un problema al eliminar la acefalia.",
        })
      }
    }
  }

  const handleDownloadExcel = () => {
    if (filteredAcefalias.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay acefalías para descargar con el filtro aplicado.",
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredAcefalias.map((acefalia) => ({
        Asignatura: acefalia.asignatura,
        Requisitos: acefalia.requisitos,
        Semestre: acefalia.semestre,
        "Nivel Académico": acefalia.nivelAcademico,
        Carrera: acefalia.carrera,
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Acefalias")

    XLSX.writeFile(workbook, "Lista_Acefalias.xlsx")
  }

  const handleDownloadPDF = () => {
    if (filteredAcefalias.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay acefalías para descargar con el filtro aplicado.",
      })
      return
    }

    // Crear documento PDF en orientación horizontal (landscape)
    const doc = new jsPDF({
      orientation: "landscape",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Calcular el número total de páginas para la numeración
    const totalItems = filteredAcefalias.length
    const itemsPerPage = 15 // Estimación aproximada de cuántas filas caben en una página
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    try {
      // Función para dibujar el encabezado del documento (logo, título, códigos)
      const drawHeader = (pageNum) => {
        // Configuración de márgenes y dimensiones
        const margenIzquierdo = 10
        const margenSuperior = 10
        const anchoUtil = pageWidth - margenIzquierdo * 2
        const altoEncabezado = 25

        // Dibujar recuadro del encabezado
        doc.setDrawColor(0)
        doc.setLineWidth(0.5)
        doc.rect(margenIzquierdo, margenSuperior, anchoUtil, altoEncabezado)

        // Dividir el encabezado en proporciones ajustadas (25% - 50% - 25%)
        const anchoLogo = anchoUtil * 0.25 // 25% para el logo
        const anchoTitulo = anchoUtil * 0.5 // 50% para el título (más ancho)
        const anchoCodigo = anchoUtil * 0.25 // 25% para los códigos

        // Sección 1: Logo (izquierda)
        doc.line(
          margenIzquierdo + anchoLogo,
          margenSuperior,
          margenIzquierdo + anchoLogo,
          margenSuperior + altoEncabezado,
        )

        // Sección 2: Título (centro)
        doc.line(
          margenIzquierdo + anchoLogo + anchoTitulo,
          margenSuperior,
          margenIzquierdo + anchoLogo + anchoTitulo,
          margenSuperior + altoEncabezado,
        )

        // Intentar cargar el logo - manteniendo la proporción correcta
        const img = new Image()
        img.src = logoEMI
        img.crossOrigin = "anonymous"
        // Calcular dimensiones para mantener la proporción original del logo
        const logoMaxHeight = altoEncabezado - 4
        const logoMaxWidth = anchoLogo - 10
        // Usar un tamaño que mantenga la proporción pero sin estirar
        const logoHeight = logoMaxHeight
        const logoWidth = logoMaxHeight * 1.5 // Proporción aproximada del logo (ancho:alto = 1.5:1)
        // Centrar el logo en su celda
        const logoX = margenIzquierdo + (anchoLogo - logoWidth) / 2
        doc.addImage(img, "PNG", logoX, margenSuperior + 2, logoWidth, logoHeight)

        // Título en el centro - ahora con más espacio
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(
          "LISTA DE ACEFALIAS:",
          margenIzquierdo + anchoLogo + anchoTitulo / 2,
          margenSuperior + altoEncabezado / 2 - 3,
          { align: "center" },
        )
        doc.text(
          "PROCESO DE SELECCIÓN Y ADMISIÓN DOCENTE",
          margenIzquierdo + anchoLogo + anchoTitulo / 2,
          margenSuperior + altoEncabezado / 2 + 3,
          { align: "center" },
        )

        // Información derecha (Código, Versión, Página)
        const seccionDerecha = margenIzquierdo + anchoLogo + anchoTitulo
        const anchoDerecha = anchoCodigo
        const altoFila = altoEncabezado / 3

        doc.line(seccionDerecha, margenSuperior + altoFila, seccionDerecha + anchoDerecha, margenSuperior + altoFila)
        doc.line(
          seccionDerecha,
          margenSuperior + altoFila * 2,
          seccionDerecha + anchoDerecha,
          margenSuperior + altoFila * 2,
        )

        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")

        doc.text("Código:", seccionDerecha + 5, margenSuperior + altoFila / 2 + 2)
        // Se eliminó el valor del código "CR-UCA-FA-R-18"

        doc.text("Versión:", seccionDerecha + 5, margenSuperior + altoFila + altoFila / 2 + 2)
        // Se eliminó el valor de la versión "1.0"

        doc.text(
          `Página ${pageNum} de ${totalPages}`,
          seccionDerecha + anchoDerecha / 2,
          margenSuperior + altoFila * 2 + altoFila / 2 + 2,
          {
            align: "center",
          },
        )

        // NUEVO FORMATO: Crear un solo bloque para Periodo Académico
        const yInfoBloque = margenSuperior + altoEncabezado
        const altoInfoBloque = 15 // Altura total del bloque de información

        // Dibujar el rectángulo exterior para todo el bloque
        doc.rect(margenIzquierdo, yInfoBloque, anchoUtil, altoInfoBloque)

        // Sección de Periodo Académico - solo texto, sin rectángulo separado
        doc.setFontSize(8)
        doc.text("PERIODO ACADÉMICO:", margenIzquierdo + 5, yInfoBloque + 10)

        return {
          yPos: yInfoBloque + altoInfoBloque + 5, // Retorna la posición Y donde debe comenzar la tabla
          anchoUtil: anchoUtil, // Retorna el ancho útil para que la tabla tenga el mismo ancho
          margenIzquierdo: margenIzquierdo, // Retorna el margen izquierdo para alinear la tabla
        }
      }

      // Función para dibujar el encabezado de la tabla
      const drawTableHeader = (yPos, anchoUtil, margenIzquierdo) => {
        const headerHeight = 12

        // Definir los anchos de columna para que se ajusten al ancho total disponible
        const totalCols = 6
        const colWidths = [
          anchoUtil * 0.05, // Nro (5%)
          anchoUtil * 0.2, // Asignatura (20%)
          anchoUtil * 0.3, // Requisitos (30%)
          anchoUtil * 0.15, // Semestre (15%)
          anchoUtil * 0.15, // Nivel Académico (15%)
          anchoUtil * 0.15, // Carrera (15%)
        ]

        // Calcular el ancho total de la tabla (debe ser igual a anchoUtil)
        const tableWidth = colWidths.reduce((sum, width) => sum + width, 0)

        // Dibujar el encabezado de la tabla con fondo blanco (ya no azul)
        doc.setFillColor(255, 255, 255) // Fondo blanco para el encabezado
        doc.rect(margenIzquierdo, yPos, tableWidth, headerHeight, "F")

        // Dibujar líneas verticales para separar columnas en encabezados
        let currentX = margenIzquierdo
        for (let i = 0; i < colWidths.length - 1; i++) {
          currentX += colWidths[i]
          doc.setDrawColor(0) // Líneas negras para el encabezado
          doc.line(currentX, yPos, currentX, yPos + headerHeight)
        }

        // Dibujar líneas horizontales para el encabezado
        doc.line(margenIzquierdo, yPos, margenIzquierdo + tableWidth, yPos)
        doc.line(margenIzquierdo, yPos + headerHeight, margenIzquierdo + tableWidth, yPos + headerHeight)

        // Asegurar que el borde completo del encabezado esté cerrado
        doc.setDrawColor(0)
        doc.rect(margenIzquierdo, yPos, tableWidth, headerHeight)

        // Agregar textos de encabezados
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0) // Texto negro para el encabezado (ya no blanco)

        currentX = margenIzquierdo
        doc.text("Nro", currentX + colWidths[0] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[0]
        doc.text("Asignatura", currentX + colWidths[1] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[1]
        doc.text("Requisitos", currentX + colWidths[2] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[2]
        doc.text("Semestre", currentX + colWidths[3] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[3]
        doc.text("Nivel Académico", currentX + colWidths[4] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[4]
        doc.text("Carrera", currentX + colWidths[5] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        return {
          headerHeight,
          colWidths,
          tableWidth,
        }
      }

      // Iniciar la primera página
      let currentPage = 1
      const headerInfo = drawHeader(currentPage)
      const { headerHeight, colWidths, tableWidth } = drawTableHeader(
        headerInfo.yPos,
        headerInfo.anchoUtil,
        headerInfo.margenIzquierdo,
      )

      const margenIzquierdo = headerInfo.margenIzquierdo
      // Función para calcular la altura necesaria para una celda basada en su contenido
      const calculateRowHeight = (text, maxWidth, fontSize, baseHeight = 10) => {
        if (!text) return baseHeight
        doc.setFontSize(fontSize)
        const words = text.toString().split(" ")
        let line = ""
        let lineCount = 1

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " "
          const testWidth = (doc.getStringUnitWidth(testLine) * doc.internal.getFontSize()) / doc.internal.scaleFactor

          if (testWidth > maxWidth && i > 0) {
            line = words[i] + " "
            lineCount++
          } else {
            line = testLine
          }
        }

        return Math.max(baseHeight, lineCount * 4 + 6) // 4 puntos por línea + 6 de margen
      }

      let currentY = headerInfo.yPos + headerHeight

      // Dibujar cada fila de datos con paginación automática y altura dinámica
      filteredAcefalias.forEach((acefalia, index) => {
        // Calcular la altura necesaria para esta fila basada en el contenido
        const asignaturaHeight = calculateRowHeight(acefalia.asignatura, colWidths[1] - 6, 8)
        const requisitosHeight = calculateRowHeight(acefalia.requisitos, colWidths[2] - 6, 8)
        const carreraHeight = calculateRowHeight(acefalia.carrera, colWidths[5] - 6, 8)

        // Usar la altura máxima necesaria entre todas las columnas
        const rowHeight = Math.max(asignaturaHeight, requisitosHeight, carreraHeight)

        // Verificar si necesitamos una nueva página
        if (currentY + rowHeight > pageHeight - 20) {
          // Agregar nueva página
          doc.addPage()
          currentPage++
          const newHeaderInfo = drawHeader(currentPage)
          const newTableHeader = drawTableHeader(
            newHeaderInfo.yPos,
            newHeaderInfo.anchoUtil,
            newHeaderInfo.margenIzquierdo,
          )
          currentY = newHeaderInfo.yPos + newTableHeader.headerHeight
        }

        // Alternar colores de fondo para las filas
        if (index % 2 === 0) {
          doc.setFillColor(255, 255, 255) // Filas pares: blanco
        } else {
          doc.setFillColor(240, 240, 240) // Filas impares: gris claro
        }

        // Dibujar rectángulo para toda la fila con el color de fondo
        doc.rect(margenIzquierdo, currentY, tableWidth, rowHeight, "F")

        // Dibujar líneas verticales para separar columnas
        let colX = margenIzquierdo
        for (let i = 0; i < colWidths.length; i++) {
          // Dibujar línea vertical izquierda de cada celda
          doc.setDrawColor(0) // Líneas negras para las celdas
          doc.line(colX, currentY, colX, currentY + rowHeight)
          colX += colWidths[i]
        }

        // Dibujar línea vertical derecha de la última columna
        doc.line(margenIzquierdo + tableWidth, currentY, margenIzquierdo + tableWidth, currentY + rowHeight)

        // Dibujar líneas horizontales para la fila
        doc.line(margenIzquierdo, currentY, margenIzquierdo + tableWidth, currentY)
        doc.line(margenIzquierdo, currentY + rowHeight, margenIzquierdo + tableWidth, currentY + rowHeight)

        // Función para agregar texto con ajuste automático dentro de las celdas
        const addWrappedText = (text, x, y, maxWidth, lineHeight) => {
          if (!text) return y

          // Dividir el texto en palabras
          const words = text.toString().split(" ")
          let line = ""
          let currentY = y

          // Recorrer cada palabra
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " "
            const testWidth = (doc.getStringUnitWidth(testLine) * doc.internal.getFontSize()) / doc.internal.scaleFactor

            // Si la línea con la nueva palabra excede el ancho máximo
            if (testWidth > maxWidth && i > 0) {
              doc.text(line.trim(), x, currentY)
              line = words[i] + " "
              currentY += lineHeight
            } else {
              line = testLine
            }
          }

          // Agregar la última línea
          if (line.trim() !== "") {
            doc.text(line.trim(), x, currentY)
            currentY += lineHeight
          }

          return currentY
        }

        // Agregar textos de datos
        doc.setFont("helvetica", "normal")
        doc.setTextColor(0, 0, 0) // Texto negro para los datos
        doc.setFontSize(8) // Tamaño de letra más pequeño para que quepa mejor el texto

        colX = margenIzquierdo
        doc.text((index + 1).toString(), colX + colWidths[0] / 2, currentY + rowHeight / 2 + 2, {
          align: "center",
        })

        // Asignatura - con ajuste de texto
        colX += colWidths[0]
        const asignaturaText = acefalia.asignatura || ""
        const asignaturaMaxWidth = colWidths[1] - 6 // Margen interno
        addWrappedText(asignaturaText, colX + 3, currentY + 6, asignaturaMaxWidth, 4)

        // Requisitos - con ajuste de texto
        colX += colWidths[1]
        const requisitosText = acefalia.requisitos || ""
        const requisitosMaxWidth = colWidths[2] - 6 // Margen interno
        addWrappedText(requisitosText, colX + 3, currentY + 6, requisitosMaxWidth, 4)

        // Semestre - centrado
        colX += colWidths[2]
        const semestreText = acefalia.semestre || ""
        doc.text(semestreText, colX + colWidths[3] / 2, currentY + rowHeight / 2 + 2, { align: "center" })

        // Nivel Académico - centrado
        colX += colWidths[3]
        const nivelText = acefalia.nivelAcademico || ""
        doc.text(nivelText, colX + colWidths[4] / 2, currentY + rowHeight / 2 + 2, { align: "center" })

        // Carrera - con ajuste de texto
        colX += colWidths[4]
        const carreraText = acefalia.carrera || ""
        const carreraMaxWidth = colWidths[5] - 6 // Margen interno
        addWrappedText(carreraText, colX + 3, currentY + 6, carreraMaxWidth, 4)

        currentY += rowHeight
      })

      // Ya no se agregan firmas ni fecha al final del documento
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      // Si hay error al cargar la imagen, continuamos sin ella
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "El reporte se generó con errores. Por favor, inténtelo nuevamente.",
      })
    }

    // Guardar el PDF
    doc.save("ListaAcefalias.pdf")
  }

  const toggleRowExpansion = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const resetFilters = () => {
    setFilters({
      carrera: "",
      semestre: "",
      nivelAcademico: "",
    })
    setSearchTerm("")
  }

  // Función para formatear requisitos como lista
  const formatRequisitos = (requisitos) => {
    if (!requisitos) return []
    return requisitos
      .split(".")
      .filter((req) => req.trim())
      .map((req) => req.trim())
  }

  return (
    <div className="p-2 sm:p-4 bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Encabezado con título y botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Lista de Acefalias</h2>
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
              onClick={onAddAcefalia}
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
                  placeholder="Buscar por asignatura o carrera..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              {/* Información de resultados */}
              <div className="mt-2 text-sm text-gray-600">
                Mostrando {filteredAcefalias.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
                {Math.min(indexOfLastItem, filteredAcefalias.length)} de {filteredAcefalias.length} resultados
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center gap-1 whitespace-nowrap"
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {(filters.carrera || filters.semestre || filters.nivelAcademico) && (
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label htmlFor="semestre-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Semestre
                  </label>
                  <select
                    id="semestre-filter"
                    value={filters.semestre}
                    onChange={(e) => setFilters({ ...filters, semestre: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los semestres</option>
                    {uniqueSemestres.map((semestre) => (
                      <option key={semestre} value={semestre}>
                        {semestre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="nivel-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel Académico
                  </label>
                  <select
                    id="nivel-filter"
                    value={filters.nivelAcademico}
                    onChange={(e) => setFilters({ ...filters, nivelAcademico: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los niveles</option>
                    {uniqueNiveles.map((nivel) => (
                      <option key={nivel} value={nivel}>
                        {nivel}
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
              Mostrando {filteredAcefalias.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
              {Math.min(indexOfLastItem, filteredAcefalias.length)} de {filteredAcefalias.length} resultados
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

        {/* Estado de carga */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando acefalias...</p>
          </div>
        ) : filteredAcefalias.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600">No se encontraron acefalias con los filtros aplicados.</p>
            {(searchTerm || filters.carrera || filters.semestre || filters.nivelAcademico) && (
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
                    <th className="py-3 px-6 text-left">Asignatura</th>
                    <th className="py-3 px-6 text-left">Requisitos</th>
                    <th className="py-3 px-6 text-left">Semestre</th>
                    <th className="py-3 px-6 text-left">Nivel Académico</th>
                    <th className="py-3 px-6 text-left">Carrera</th>
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {currentItems.map((acefalia, index) => (
                    <tr
                      key={acefalia._id}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"} border-b border-gray-200 hover:bg-gray-100`}
                    >
                      <td className="py-3 px-6 text-left whitespace-nowrap">{indexOfFirstItem + index + 1}</td>
                      <td className="py-3 px-6 text-left font-medium text-gray-800">{acefalia.asignatura}</td>
                      <td className="py-3 px-6 text-left text-gray-600">
                        {acefalia.requisitos &&
                          acefalia.requisitos
                            .split(".")
                            .map((req, idx) => req.trim() && <p key={idx}>• {req.trim()}</p>)}
                      </td>
                      <td className="py-3 px-6 text-left">{acefalia.semestre}</td>
                      <td className="py-3 px-6 text-left">{acefalia.nivelAcademico}</td>
                      <td className="py-3 px-6 text-left">{acefalia.carrera}</td>
                      <td className="py-3 px-6 text-center flex justify-center space-x-2">
                        <button
                          onClick={() => onEditAcefalia(acefalia)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                          title="Editar acefalia"
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
                          onClick={() => handleDeleteAcefalia(acefalia._id)}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                          title="Eliminar acefalia"
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
              {currentItems.map((acefalia, index) => (
                <div
                  key={acefalia._id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"} border-b border-gray-200 hover:bg-gray-100 p-4`}
                >
                  <div>
                    <span className="font-bold text-gray-800">
                      {indexOfFirstItem + index + 1}. {acefalia.asignatura}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-600 font-semibold">Requisitos:</p>
                    {acefalia.requisitos &&
                      acefalia.requisitos.split(".").map(
                        (req, idx) =>
                          req.trim() && (
                            <p key={idx} className="text-gray-600">
                              • {req.trim()}
                            </p>
                          ),
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
                      onClick={() => handleDeleteAcefalia(acefalia._id)}
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
                    // Mostrar siempre la primera página, la última, la actual y las adyacentes
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

                    // Mostrar puntos suspensivos para páginas omitidas
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
                      currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
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
      </div>
    </div>
  )
}

export default ListaAcefalia
