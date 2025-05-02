"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import RegistroDeMeritos from "./Registrodemeritos"
import logoEMI from "../images/emiemi.png" // Importamos el logo desde la misma ruta

function ConcursoDeMeritos() {
  const [registros, setRegistros] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [meritoEdit, setMeritoEdit] = useState(null)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Obtener los registros desde el backend, filtrándolos según el usuario y ordenándolos por puntos (descendente)
  const fetchRegistros = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/concurso-meritos`)
      console.log("Registros obtenidos:", response.data)

      // Recuperar datos del usuario desde localStorage
      const user = JSON.parse(localStorage.getItem("user"))
      console.log("Usuario logueado:", user)

      let registrosData = response.data
      // Si el usuario NO es administrador, filtrar solo registros que tengan evaluadorId y coincidan con user._id
      if (user && !user.administrador) {
        registrosData = registrosData.filter((registro) => registro.evaluadorId && registro.evaluadorId === user._id)
      }
      // Ordenar la lista de registros de forma descendente según puntosEvaluacion
      registrosData.sort((a, b) => Number(b.puntosEvaluacion) - Number(a.puntosEvaluacion))
      setRegistros(registrosData)
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

  // Manejo de eliminación de un registro
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
        await axios.delete(`${baseURL}/api/concurso-meritos/${id}`)
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

  // Descargar registros en formato PDF con el formato específico solicitado
  const handleDownloadPDF = () => {
    if (registros.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay registros para descargar.",
      })
      return
    }

    // Agrupar registros por carrera manteniendo el orden original de las materias
    const registrosPorCarrera = {}
    const materiasOrdenadas = {} // Para mantener el orden de las materias

    // Primero, identificar todas las carreras y materias únicas manteniendo su orden
    registros.forEach((registro) => {
      const carrera = registro.carrera || "Sin Carrera"
      const materia = registro.materia || "Sin Materia"

      if (!registrosPorCarrera[carrera]) {
        registrosPorCarrera[carrera] = {}
        materiasOrdenadas[carrera] = []
      }

      // Solo agregar la materia a la lista ordenada si no existe ya
      if (!registrosPorCarrera[carrera][materia] && !materiasOrdenadas[carrera].includes(materia)) {
        materiasOrdenadas[carrera].push(materia)
      }
    })

    // Luego, agrupar los postulantes por carrera y materia
    registros.forEach((registro) => {
      const carrera = registro.carrera || "Sin Carrera"
      const materia = registro.materia || "Sin Materia"

      if (!registrosPorCarrera[carrera][materia]) {
        registrosPorCarrera[carrera][materia] = []
      }

      registrosPorCarrera[carrera][materia].push(registro)
    })

    // Crear documento PDF en orientación horizontal (landscape)
    const doc = new jsPDF({
      orientation: "landscape",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Procesar cada carrera
    Object.entries(registrosPorCarrera).forEach(([carrera, materias], carreraIndex) => {
      if (carreraIndex > 0) {
        doc.addPage()
      }

      try {
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
          "RESULTADOS DEL CONCURSO DE MÉRITOS:",
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
        doc.text("CR-UCA-FA-R-18", seccionDerecha + anchoDerecha - 3, margenSuperior + altoFila / 2 + 2, {
          align: "right",
        })

        doc.text("Versión:", seccionDerecha + 5, margenSuperior + altoFila + altoFila / 2 + 2)
        doc.text("1.0", seccionDerecha + anchoDerecha - 3, margenSuperior + altoFila + altoFila / 2 + 2, {
          align: "right",
        })

        doc.text("Página 1 de 1", seccionDerecha + anchoDerecha / 2, margenSuperior + altoFila * 2 + altoFila / 2 + 2, {
          align: "center",
        })

        // NUEVO FORMATO: Crear un solo bloque para Periodo Académico, Carrera y Artículo 32
        const yInfoBloque = margenSuperior + altoEncabezado
        const altoInfoBloque = 40 // Altura total del bloque de información

        // Dibujar el rectángulo exterior para todo el bloque
        doc.rect(margenIzquierdo, yInfoBloque, anchoUtil, altoInfoBloque)

        // Sección de Periodo Académico - solo texto, sin rectángulo separado
        doc.setFontSize(8)
        doc.text("PERIODO ACADÉMICO:", margenIzquierdo + 5, yInfoBloque + 6)

        // Línea horizontal después de Periodo Académico
        doc.line(margenIzquierdo, yInfoBloque + 10, margenIzquierdo + anchoUtil, yInfoBloque + 10)

        // Sección de Carrera - solo texto, sin rectángulo separado
        doc.text("CARRERA:", margenIzquierdo + 5, yInfoBloque + 16)
        doc.setFont("helvetica", "bold")
        doc.text(carrera, margenIzquierdo + 40, yInfoBloque + 16)
        doc.setFont("helvetica", "normal")

        // Línea horizontal después de Carrera
        doc.line(margenIzquierdo, yInfoBloque + 20, margenIzquierdo + anchoUtil, yInfoBloque + 20)

        // Sección de Artículo 32 - solo texto, sin rectángulo separado
        doc.text("Artículo 32:", margenIzquierdo + 5, yInfoBloque + 26)

        const textoArticulo =
          "El puntaje mínimo a obtener en el Concurso de Méritos que permite a la Institución contar con Docentes de relativa experiencia, tanto en la enseñanza como en su actividad profesional es de 220 puntos para nivel Licenciatura y 200 para Nivel Técnico Universitario Superior. El Postulante que no alcance esta puntuación, será descalificado del proceso de selección y, en consecuencia, no podrá optar al Examen de Competencia."

        // Dividir el texto en múltiples líneas con más margen para evitar que se salga
        const textLines = doc.splitTextToSize(textoArticulo, anchoUtil - 60)
        doc.text(textLines, margenIzquierdo + 50, yInfoBloque + 26)

        // Posición inicial para las tablas de asignaturas - ajustada para comenzar después del bloque de información
        let yPos = yInfoBloque + altoInfoBloque + 5

        // Procesar cada materia de la carrera en el orden original
        materiasOrdenadas[carrera].forEach((materia, materiaIndex) => {
          const postulantes = registrosPorCarrera[carrera][materia]

          // Verificar si hay espacio suficiente para la tabla
          const estimatedHeight = 15 + postulantes.length * 10 // Altura estimada de la tabla

          if (yPos + estimatedHeight > pageHeight - 40) {
            doc.addPage()
            yPos = margenSuperior
          }

          // Encabezado de la asignatura
          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")

          // Crear un rectángulo para el encabezado de la asignatura
          doc.rect(margenIzquierdo, yPos, anchoUtil, 10)
          doc.text(`ASIGNATURA ${materiaIndex + 1}:`, margenIzquierdo + 5, yPos + 6)
          doc.setFont("helvetica", "normal")
          doc.text(materia, margenIzquierdo + 50, yPos + 6)

          // Crear la tabla de encabezados manualmente para mayor control
          const headerHeight = 12
          const rowHeight = 10

          // Ajustar los anchos de columna para aprovechar mejor el espacio horizontal
          const colWidths = [
            15, // N° - ligeramente más ancho
            60, // NOMBRE(S) Y APELLIDOS - más ancho para aprovechar el espacio horizontal
            45, // PROFESIÓN - más ancho
            60, // ASIGNATURA A LA QUE POSTULA - más ancho
            30, // PUNTAJE CONCURSO DE MÉRITOS
            30, // HABILITADO/NO HABILITADO
            30, // OBSERVACIONES
          ]

          // Calcular posición inicial de la tabla
          const tableY = yPos + 10

          // Dibujar encabezados de la tabla
          let currentX = margenIzquierdo

          // Dibujar rectángulo para toda la fila de encabezados
          doc.rect(margenIzquierdo, tableY, anchoUtil, headerHeight)

          // Dibujar líneas verticales para separar columnas en encabezados
          for (let i = 0; i < colWidths.length - 1; i++) {
            currentX += colWidths[i]
            doc.line(currentX, tableY, currentX, tableY + headerHeight)
          }

          // Agregar textos de encabezados
          doc.setFontSize(7)
          doc.setFont("helvetica", "bold")

          currentX = margenIzquierdo
          doc.text("N°", currentX + colWidths[0] / 2, tableY + headerHeight / 2 + 2, { align: "center" })

          currentX += colWidths[0]
          doc.text("NOMBRE(S) Y APELLIDOS", currentX + colWidths[1] / 2, tableY + headerHeight / 2 + 2, {
            align: "center",
          })

          currentX += colWidths[1]
          doc.text("PROFESIÓN", currentX + colWidths[2] / 2, tableY + headerHeight / 2 + 2, { align: "center" })

          currentX += colWidths[2]
          doc.text("ASIGNATURA A LA QUE\nPOSTULA", currentX + colWidths[3] / 2, tableY + headerHeight / 2, {
            align: "center",
          })

          currentX += colWidths[3]
          // Ajuste para centrar mejor "PUNTAJE CONCURSO DE MÉRITOS"
          doc.text("PUNTAJE\nCONCURSO DE\nMÉRITOS", currentX + colWidths[4] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[4]
          // Ajuste para centrar mejor "HABILITADO/NO HABILITADO"
          doc.text("HABILITADO/\nNO\nHABILITADO", currentX + colWidths[5] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[5]
          // Mantener el mismo tamaño de letra para "OBSERVACIONES" que los demás encabezados
          doc.text("OBSERVACIONES", currentX + colWidths[6] / 2, tableY + headerHeight / 2 + 2, { align: "center" })

          // Dibujar filas de datos
          doc.setFont("helvetica", "normal")

          let currentY = tableY + headerHeight

          // Dibujar cada fila de datos
          postulantes.forEach((postulante, index) => {
            // Dibujar rectángulo para toda la fila
            doc.rect(margenIzquierdo, currentY, anchoUtil, rowHeight)

            // Dibujar líneas verticales para separar columnas
            let colX = margenIzquierdo
            for (let i = 0; i < colWidths.length - 1; i++) {
              colX += colWidths[i]
              doc.line(colX, currentY, colX, currentY + rowHeight)
            }

            // Agregar textos de datos
            colX = margenIzquierdo
            doc.text((index + 1).toString(), colX + colWidths[0] / 2, currentY + rowHeight / 2 + 2, { align: "center" })

            colX += colWidths[0]
            // Asegurar que el nombre no se salga de la celda
            const nombreText = postulante.nombrePostulante || ""
            const nombreLines = doc.splitTextToSize(nombreText, colWidths[1] - 4)
            doc.text(nombreLines, colX + 2, currentY + rowHeight / 2, { align: "left" })

            colX += colWidths[1]
            // Asegurar que la profesión no se salga de la celda
            const profesionText = postulante.profesion || ""
            const profesionLines = doc.splitTextToSize(profesionText, colWidths[2] - 4)
            doc.text(profesionLines, colX + 2, currentY + rowHeight / 2, { align: "left" })

            colX += colWidths[2]
            // Asegurar que la materia no se salga de la celda
            const materiaLines = doc.splitTextToSize(materia, colWidths[3] - 4)
            doc.text(materiaLines, colX + 2, currentY + rowHeight / 2, { align: "left" })

            colX += colWidths[3]
            doc.text(postulante.puntosEvaluacion.toString(), colX + colWidths[4] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[4]
            doc.text(postulante.habilitado || "", colX + colWidths[5] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[5]
            // Ajuste para que el texto de observaciones no se salga de la celda
            const obsText = postulante.observaciones || "Ninguna"
            doc.text(obsText, colX + colWidths[6] / 2, currentY + rowHeight / 2 + 2, { align: "center" })

            // Ajustar la altura de la fila si algún texto ocupa más de una línea
            const maxLines = Math.max(nombreLines.length, profesionLines.length, materiaLines.length)

            if (maxLines > 1) {
              const extraHeight = (maxLines - 1) * 3
              doc.rect(margenIzquierdo, currentY, anchoUtil, rowHeight + extraHeight)

              // Redibujar las líneas verticales para la fila más alta
              let colX2 = margenIzquierdo
              for (let j = 0; j < colWidths.length - 1; j++) {
                colX2 += colWidths[j]
                doc.line(colX2, currentY, colX2, currentY + rowHeight + extraHeight)
              }

              currentY += extraHeight
            }

            currentY += rowHeight
          })

          // Si no hay postulantes, agregar 3 filas vacías
          if (postulantes.length === 0) {
            for (let i = 0; i < 3; i++) {
              // Dibujar rectángulo para toda la fila
              doc.rect(margenIzquierdo, currentY, anchoUtil, rowHeight)

              // Dibujar líneas verticales para separar columnas
              let colX = margenIzquierdo
              for (let j = 0; j < colWidths.length - 1; j++) {
                colX += colWidths[j]
                doc.line(colX, currentY, colX, currentY + rowHeight)
              }

              // Agregar número de fila
              doc.text((i + 1).toString(), margenIzquierdo + colWidths[0] / 2, currentY + rowHeight / 2 + 2, {
                align: "center",
              })

              currentY += rowHeight
            }
          }

          // Actualizar posición Y para la siguiente tabla
          yPos = currentY + 5
        })

        // Verificar si hay espacio suficiente para las firmas
        // Necesitamos aproximadamente 50 puntos de altura para las firmas
        if (yPos + 50 > pageHeight - 20) {
          // No hay suficiente espacio, añadir nueva página
          doc.addPage()
          yPos = margenSuperior
        }

        // Fecha en la esquina inferior derecha
        doc.setFontSize(8)

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
        doc.text(fechaFormateada, pageWidth - margenIzquierdo, yPos + 10, { align: "right" })

        // Espacio para firmas - ajustado para formato horizontal
        const firmaY = yPos + 30
        const tercioAnchoCalculadoFirma = (pageWidth - 2 * margenIzquierdo) / 3

        // Firma 1 - Comisión Evaluador 1 (sin título profesional)
        doc.line(
          margenIzquierdo + tercioAnchoCalculadoFirma / 2 - 30,
          firmaY,
          margenIzquierdo + tercioAnchoCalculadoFirma / 2 + 30,
          firmaY,
        )
        doc.text("COMISIÓN EVALUADOR 1", margenIzquierdo + tercioAnchoCalculadoFirma / 2, firmaY + 5, {
          align: "center",
        })

        // Firma 2 - Comisión Evaluador 2 (sin título profesional)
        doc.line(
          margenIzquierdo + tercioAnchoCalculadoFirma * 2.5 - 30,
          firmaY,
          margenIzquierdo + tercioAnchoCalculadoFirma * 2.5 + 30,
          firmaY,
        )
        doc.text("COMISIÓN EVALUADOR 2", margenIzquierdo + tercioAnchoCalculadoFirma * 2.5, firmaY + 5, {
          align: "center",
        })

        // Firma 3 - Jefe de Unidad (sin grado militar)
        doc.line(margenIzquierdo + anchoUtil / 2 - 30, firmaY + 25, margenIzquierdo + anchoUtil / 2 + 30, firmaY + 25)
        doc.text("JEFE DE UNIDAD DE EVALUACIÓN Y ACREDITACIÓN", margenIzquierdo + anchoUtil / 2, firmaY + 30, {
          align: "center",
        })
        doc.text("ESCUELA MILITAR DE INGENIERÍA", margenIzquierdo + anchoUtil / 2, firmaY + 35, { align: "center" })
      } catch (error) {
        console.error("Error al generar el PDF:", error)
        // Si hay error al cargar la imagen, continuamos sin ella
        Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "El reporte se generó sin el logo institucional.",
        })
      }
    })

    // Guardar el PDF
    doc.save("ResultadosConcursoMeritos.pdf")
  }

  // Actualiza la lista luego de registrar o editar
  const onMeritoRegistered = (nuevoRegistro) => {
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
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen w-full">
      {/* Encabezado y botones */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Concurso de Méritos</h2>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 transition"
          >
            Descargar PDF
          </button>
          <button
            onClick={() => {
              setMeritoEdit(null)
              setMostrarFormulario(true)
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
                <th className="py-3 px-2 text-left">Nro</th>
                <th className="py-3 px-2 text-left">Evaluador</th>
                <th className="py-3 px-2 text-left">Nombre</th>
                <th className="py-3 px-2 text-left">CI</th>
                <th className="py-3 px-2 text-left">Fecha</th>
                <th className="py-3 px-2 text-left">Profesión</th>
                <th className="py-3 px-2 text-left">Carrera</th>
                <th className="py-3 px-2 text-left">Materia</th>
                <th className="py-3 px-2 text-left">Observaciones</th>
                <th className="py-3 px-2 text-left">Estado</th>
                <th className="py-3 px-2 text-left">Puntos</th>
                <th className="py-3 px-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-light">
              {registros.map((registro, index) => (
                <tr key={registro._id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-2 text-left whitespace-nowrap">{index + 1}</td>
                  <td className="py-3 px-2 text-left">{registro.nombreEvaluador || ""}</td>
                  <td className="py-3 px-2 text-left">{registro.nombrePostulante}</td>
                  <td className="py-3 px-2 text-left">{registro.ci}</td>
                  <td className="py-3 px-2 text-left">{new Date(registro.fechaEvaluacion).toLocaleDateString()}</td>
                  <td className="py-3 px-2 text-left">{registro.profesion || ""}</td>
                  <td className="py-3 px-2 text-left">{registro.carrera || ""}</td>
                  <td className="py-3 px-2 text-left">{registro.materia || ""}</td>
                  <td className="py-3 px-2 text-left">{registro.observaciones || ""}</td>
                  <td className="py-3 px-2 text-left">{registro.habilitado || ""}</td>
                  <td className="py-3 px-2 text-left">{registro.puntosEvaluacion}</td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => {
                        setMeritoEdit(registro)
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Vista en tarjetas para pantallas pequeñas */}
          <div className="block sm:hidden w-full">
            {registros.map((registro, index) => (
              <div key={registro._id} className="border-b border-gray-200 hover:bg-gray-100 p-4">
                <div>
                  <span className="font-bold text-gray-800">
                    {index + 1}. {registro.nombrePostulante}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600">
                    <strong>Evaluador:</strong> {registro.nombreEvaluador || ""}
                  </p>
                  <p className="text-gray-600">
                    <strong>CI:</strong> {registro.ci}
                  </p>
                  <p className="text-gray-600">
                    <strong>Fecha:</strong> {new Date(registro.fechaEvaluacion).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    <strong>Profesión:</strong> {registro.profesion || ""}
                  </p>
                  <p className="text-gray-600">
                    <strong>Carrera:</strong> {registro.carrera || ""}
                  </p>
                  <p className="text-gray-600">
                    <strong>Materia:</strong> {registro.materia || ""}
                  </p>
                  <p className="text-gray-600">
                    <strong>Observaciones:</strong> {registro.observaciones || ""}
                  </p>
                  <p className="text-gray-600">
                    <strong>Estado:</strong> {registro.habilitado || ""}
                  </p>
                  <p className="text-gray-600">
                    <strong>Puntos:</strong> {registro.puntosEvaluacion}
                  </p>
                </div>
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setMeritoEdit(registro)
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

export default ConcursoDeMeritos
