"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import logoEMI from "../images/emiemi.png" // Importamos el logo desde la misma ruta

function Usuarios({ onAddUser, onEditUser }) {
  const [usuarios, setUsuarios] = useState([])
  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(`${baseURL}/usuarios`)
        setUsuarios(response.data)
      } catch (error) {
        console.error("Error al obtener los usuarios:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron obtener los usuarios. Por favor, inténtalo más tarde.",
        })
      }
    }

    fetchUsuarios()
  }, [baseURL])

  const handleDeleteUser = async (userId) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto eliminará al usuario permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/usuarios/${userId}`)
        setUsuarios((prev) => prev.filter((usuario) => usuario._id !== userId))
        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "Usuario eliminado exitosamente.",
        })
      } catch (error) {
        console.error("Error al eliminar usuario:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un problema al eliminar el usuario.",
        })
      }
    }
  }

  const handleDownloadExcel = () => {
    if (usuarios.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay usuarios para descargar.",
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      usuarios.map((usuario) => ({
        Nombre: usuario.nombre,
        "Nombre de Usuario": usuario.nombreUsuario,
        Email: usuario.email,
        Carrera: usuario.carrera,
        Administrador: usuario.administrador ? "Sí" : "No",
        Activo: usuario.activo ? "Sí" : "No",
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios")

    XLSX.writeFile(workbook, "Usuarios.xlsx")
  }

  const handleDownloadPDF = () => {
    if (usuarios.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay usuarios para descargar.",
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
    const totalItems = usuarios.length
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
          "LISTA DE USUARIOS:",
          margenIzquierdo + anchoLogo + anchoTitulo / 2,
          margenSuperior + altoEncabezado / 2 - 3,
          { align: "center" },
        )
        doc.text(
          "SISTEMA DE GESTIÓN ACADÉMICA",
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
        // Se eliminó el valor del código

        doc.text("Versión:", seccionDerecha + 5, margenSuperior + altoFila + altoFila / 2 + 2)
        // Se eliminó el valor de la versión

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
        const colWidths = [
          anchoUtil * 0.05, // Nro (5%)
          anchoUtil * 0.15, // Nombre (15%)
          anchoUtil * 0.15, // Nombre de Usuario (15%)
          anchoUtil * 0.25, // Email (25%)
          anchoUtil * 0.2, // Carrera (20%)
          anchoUtil * 0.1, // Administrador (10%)
          anchoUtil * 0.1, // Activo (10%)
        ]

        // Calcular el ancho total de la tabla (debe ser igual a anchoUtil)
        const tableWidth = colWidths.reduce((sum, width) => sum + width, 0)

        // Dibujar el encabezado de la tabla con fondo blanco
        doc.setFillColor(255, 255, 255) // Fondo blanco para el encabezado
        doc.rect(margenIzquierdo, yPos, tableWidth, headerHeight, "F")

        // Asegurar que el borde completo del encabezado esté cerrado
        doc.setDrawColor(0)
        doc.rect(margenIzquierdo, yPos, tableWidth, headerHeight)

        // Dibujar líneas verticales para separar columnas en encabezados
        let currentX = margenIzquierdo
        for (let i = 0; i < colWidths.length - 1; i++) {
          currentX += colWidths[i]
          doc.setDrawColor(0) // Líneas negras para el encabezado
          doc.line(currentX, yPos, currentX, yPos + headerHeight)
        }

        // Agregar textos de encabezados
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0) // Texto negro para el encabezado

        currentX = margenIzquierdo
        doc.text("Nro", currentX + colWidths[0] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[0]
        doc.text("Nombre", currentX + colWidths[1] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[1]
        doc.text("Nombre de Usuario", currentX + colWidths[2] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[2]
        doc.text("Email", currentX + colWidths[3] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[3]
        doc.text("Carrera", currentX + colWidths[4] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[4]
        doc.text("Administrador", currentX + colWidths[5] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

        currentX += colWidths[5]
        doc.text("Activo", currentX + colWidths[6] / 2, yPos + headerHeight / 2 + 2, { align: "center" })

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
      usuarios.forEach((usuario, index) => {
        // Calcular la altura necesaria para esta fila basada en el contenido
        const nombreHeight = calculateRowHeight(usuario.nombre, colWidths[1] - 6, 8)
        const nombreUsuarioHeight = calculateRowHeight(usuario.nombreUsuario, colWidths[2] - 6, 8)
        const emailHeight = calculateRowHeight(usuario.email, colWidths[3] - 6, 8)
        const carreraHeight = calculateRowHeight(usuario.carrera, colWidths[4] - 6, 8)

        // Usar la altura máxima necesaria entre todas las columnas
        const rowHeight = Math.max(nombreHeight, nombreUsuarioHeight, emailHeight, carreraHeight)

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

        // Nombre - con ajuste de texto
        colX += colWidths[0]
        const nombreText = usuario.nombre || ""
        const nombreMaxWidth = colWidths[1] - 6 // Margen interno
        addWrappedText(nombreText, colX + 3, currentY + 6, nombreMaxWidth, 4)

        // Nombre de Usuario - con ajuste de texto
        colX += colWidths[1]
        const nombreUsuarioText = usuario.nombreUsuario || ""
        const nombreUsuarioMaxWidth = colWidths[2] - 6 // Margen interno
        addWrappedText(nombreUsuarioText, colX + 3, currentY + 6, nombreUsuarioMaxWidth, 4)

        // Email - con ajuste de texto
        colX += colWidths[2]
        const emailText = usuario.email || ""
        const emailMaxWidth = colWidths[3] - 6 // Margen interno
        addWrappedText(emailText, colX + 3, currentY + 6, emailMaxWidth, 4)

        // Carrera - con ajuste de texto
        colX += colWidths[3]
        const carreraText = usuario.carrera || ""
        const carreraMaxWidth = colWidths[4] - 6 // Margen interno
        addWrappedText(carreraText, colX + 3, currentY + 6, carreraMaxWidth, 4)

        // Administrador - centrado
        colX += colWidths[4]
        const adminText = usuario.administrador ? "Sí" : "No"
        doc.text(adminText, colX + colWidths[5] / 2, currentY + rowHeight / 2 + 2, { align: "center" })

        // Activo - centrado
        colX += colWidths[5]
        const activoText = usuario.activo ? "Sí" : "No"
        doc.text(activoText, colX + colWidths[6] / 2, currentY + rowHeight / 2 + 2, { align: "center" })

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
    doc.save("Usuarios.pdf")
  }

  return (
    <div className="w-full p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Lista de Usuarios</h2>
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
            onClick={onAddUser}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
          >
            + Añadir Usuario
          </button>
        </div>
      </div>

      {/* Vista en tabla para pantallas medianas y superiores */}
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden hidden sm:block">
        <table className="w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-blue-800 text-white uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Nro</th>
              <th className="py-3 px-6 text-left">Nombre</th>
              <th className="py-3 px-6 text-left">Nombre de Usuario</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Carrera</th>
              <th className="py-3 px-6 text-center">Administrador</th>
              <th className="py-3 px-6 text-center">Activo</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {usuarios.map((usuario, index) => (
              <tr key={usuario._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{index + 1}</td>
                <td className="py-3 px-6 text-left">{usuario.nombre}</td>
                <td className="py-3 px-6 text-left">{usuario.nombreUsuario}</td>
                <td className="py-3 px-6 text-left">{usuario.email}</td>
                <td className="py-3 px-6 text-left">{usuario.carrera}</td>
                <td className="py-3 px-6 text-center">
                  <span
                    className={`py-1 px-3 rounded-full text-xs ${
                      usuario.administrador ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
                    }`}
                  >
                    {usuario.administrador ? "Sí" : "No"}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  <span
                    className={`py-1 px-3 rounded-full text-xs ${
                      usuario.activo ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
                    }`}
                  >
                    {usuario.activo ? "Sí" : "No"}
                  </span>
                </td>
                <td className="py-3 px-6 text-center flex justify-center space-x-2">
                  <button
                    onClick={() => onEditUser(usuario)}
                    className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteUser(usuario._id)}
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
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden block sm:hidden">
        {usuarios.map((usuario, index) => (
          <div key={usuario._id} className="border-b border-gray-200 hover:bg-gray-100 p-4">
            <div>
              <span className="font-bold text-gray-800">
                {index + 1}. {usuario.nombre}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-gray-600">
                <strong>Nombre de Usuario:</strong> {usuario.nombreUsuario}
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> {usuario.email}
              </p>
              <p className="text-gray-600">
                <strong>Carrera:</strong> {usuario.carrera}
              </p>
              <p className="text-gray-600">
                <strong>Administrador:</strong>{" "}
                <span
                  className={`py-1 px-2 rounded-full text-xs ${
                    usuario.administrador ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
                  }`}
                >
                  {usuario.administrador ? "Sí" : "No"}
                </span>
              </p>
              <p className="text-gray-600">
                <strong>Activo:</strong>{" "}
                <span
                  className={`py-1 px-2 rounded-full text-xs ${
                    usuario.activo ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
                  }`}
                >
                  {usuario.activo ? "Sí" : "No"}
                </span>
              </p>
            </div>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => onEditUser(usuario)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDeleteUser(usuario._id)}
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

export default Usuarios
