"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import logoEMI from "../images/emiemi.png" // Importamos el logo desde la misma ruta

function ListaAcefalia({ onAddAcefalia, onEditAcefalia }) {
  const [acefalias, setAcefalias] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  useEffect(() => {
    const fetchAcefalias = async () => {
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
      }
    }
    fetchAcefalias()
  }, [baseURL])

  // Filtrar por carrera
  const filteredAcefalias = acefalias.filter((acefalia) =>
    acefalia.carrera.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  // Usar la lista filtrada para la exportación
  const handleDownloadExcel = () => {
    // Se usa filteredAcefalias en lugar de acefalias
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
    // Se usa filteredAcefalias en lugar de acefalias
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

  // Función para formatear asignaturas
  const formatAsignaturas = (asignaturas) => {
    if (!asignaturas) return ""
    if (Array.isArray(asignaturas)) {
      return asignaturas.join(" | ")
    }
    return asignaturas
  }

  const DocumentosDetalle = ({ documentos }) => {
    return (
      <div className="grid grid-cols-2 gap-4 p-4">
        <p className="text-sm text-gray-600">[Visualización de documentos]</p>
      </div>
    )
  }

  const [expandedRows, setExpandedRows] = useState({})

  const toggleRowExpansion = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }))
  }

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
            {filteredAcefalias.map((acefalia, index) => (
              <tr key={acefalia._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{index + 1}</td>
                <td className="py-3 px-6 text-left font-medium text-gray-800">{acefalia.asignatura}</td>
                <td className="py-3 px-6 text-left text-gray-600">
                  {acefalia.requisitos &&
                    acefalia.requisitos.split(".").map((req, idx) => req.trim() && <p key={idx}>• {req.trim()}</p>)}
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
  )
}

export default ListaAcefalia
