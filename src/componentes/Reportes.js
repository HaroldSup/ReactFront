"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import logoEMI from "../images/emiemi.png" // Importamos el logo desde la misma ruta

function Reportes() {
  const [reportData, setReportData] = useState([])
  const [filterCareer, setFilterCareer] = useState("")
  const [filterCI, setFilterCI] = useState("")
  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Realizar las tres peticiones simultáneas
        const [meritosRes, conocimientosRes, competenciasRes] = await Promise.all([
          axios.get(`${baseURL}/api/concurso-meritos`),
          axios.get(`${baseURL}/api/examen-conocimientos`),
          axios.get(`${baseURL}/api/examen-competencias`),
        ])

        const meritos = meritosRes.data
        const conocimientos = conocimientosRes.data
        const competencias = competenciasRes.data

        // Map para méritos (usa "carnet" o "ci")
        const meritosMap = new Map()
        meritos.forEach((record) => {
          const id = record.carnet || record.ci
          if (id) {
            if (!meritosMap.has(id)) {
              meritosMap.set(id, {
                puntosEvaluacion: Number(record.puntosEvaluacion) || 0,
                nombre: record.nombrePostulante || record.nombre || "",
                profesion: record.profesion || "",
                materia: record.materia || "",
                carrera: record.carrera || "",
                habilitado: record.habilitado || "No Habilitado",
              })
            }
          }
        })

        // Map para conocimientos (usa "carnet" o "ci")
        const conocimientosMap = new Map()
        conocimientos.forEach((record) => {
          const id = record.carnet || record.ci
          if (id) {
            if (!conocimientosMap.has(id)) {
              conocimientosMap.set(id, {
                notaFinal: Number(record.notaFinal) || 0,
                nombre: record.nombrePostulante || record.nombre || "",
                profesion: record.profesion || "",
                materia: record.materia || "",
                carrera: record.carrera || "",
                habilitado: record.habilitado || "No Habilitado",
              })
            }
          }
        })

        // Procesar competencias: agrupar por postulante, materia y carrera, y calcular promedios por tipo de evaluador
        const competenciasAgrupadas = {}

        competencias.forEach((record) => {
          const id = record.carnet || record.ci
          if (id && record.materia && record.carrera) {
            const key = `${id}-${record.materia}-${record.carrera}`

            if (!competenciasAgrupadas[key]) {
              competenciasAgrupadas[key] = {
                carnet: id,
                nombre: record.nombre || "",
                materia: record.materia,
                carrera: record.carrera,
                profesion: record.profesion || "",
                evaluadores: {},
              }
            }

            // Agrupar por tipo de evaluador
            const tipoEvaluador = record.tipoEvaluador
            if (!competenciasAgrupadas[key].evaluadores[tipoEvaluador]) {
              competenciasAgrupadas[key].evaluadores[tipoEvaluador] = {
                notaPlanTrabajo: Number(record.notaPlanTrabajo) || 0,
                notaProcesosPedagogicos: Number(record.notaProcesosPedagogicos) || 0,
                count: 1,
              }
            } else {
              // Si ya existe un registro para este tipo de evaluador, promediar las notas
              const evaluador = competenciasAgrupadas[key].evaluadores[tipoEvaluador]
              evaluador.notaPlanTrabajo =
                (evaluador.notaPlanTrabajo * evaluador.count + Number(record.notaPlanTrabajo)) / (evaluador.count + 1)
              evaluador.notaProcesosPedagogicos =
                (evaluador.notaProcesosPedagogicos * evaluador.count + Number(record.notaProcesosPedagogicos)) /
                (evaluador.count + 1)
              evaluador.count++
            }
          }
        })

        // Calcular resultados finales
        const reportArray = []
        let index = 1

        // Procesar por materia para agrupar en el reporte
        const materiasPorCarrera = {}

        // Primero, identificar todas las materias por carrera
        Object.values(competenciasAgrupadas).forEach((data) => {
          const { carrera, materia } = data
          if (!materiasPorCarrera[carrera]) {
            materiasPorCarrera[carrera] = new Set()
          }
          materiasPorCarrera[carrera].add(materia)
        })

        // Luego, para cada carrera y materia, procesar los postulantes
        Object.entries(materiasPorCarrera).forEach(([carrera, materias]) => {
          materias.forEach((materia) => {
            // Filtrar registros para esta carrera y materia
            const registrosMateria = Object.values(competenciasAgrupadas).filter(
              (data) => data.carrera === carrera && data.materia === materia,
            )

            registrosMateria.forEach((data) => {
              const { carnet, nombre, profesion } = data
              const meritoData = meritosMap.get(carnet) || {
                puntosEvaluacion: 0,
                nombre: "",
                habilitado: "No Habilitado",
                profesion: "",
              }
              const conocimientoData = conocimientosMap.get(carnet) || {
                notaFinal: 0,
                nombre: "",
                habilitado: "No Habilitado",
                profesion: "",
              }

              // Usar datos de cualquier fuente disponible
              const nombreFinal = nombre || meritoData.nombre || conocimientoData.nombre
              const profesionFinal = profesion || meritoData.profesion || conocimientoData.profesion

              // Calcular el promedio de las notas de los 3 tipos de evaluadores
              let sumaNotas = 0
              let contadorEvaluadores = 0

              // Tipos de evaluadores esperados
              const tiposEvaluador = ["Evaluador 1", "Evaluador 2", "Presidente Tribunal"]

              tiposEvaluador.forEach((tipo) => {
                if (data.evaluadores[tipo]) {
                  // Sumar las notas de plan de trabajo y procesos pedagógicos
                  const notaTotal =
                    data.evaluadores[tipo].notaPlanTrabajo + data.evaluadores[tipo].notaProcesosPedagogicos
                  sumaNotas += notaTotal
                  contadorEvaluadores++
                }
              })

              // Calcular el promedio (Resultado Fases 2 y 3)
              const resultadoFases2y3 = contadorEvaluadores > 0 ? sumaNotas / contadorEvaluadores : 0

              // Total Examen de Competencia = Puntaje Examen de Conocimiento + Resultado Fases 2 y 3
              const totalExamenCompetencia = conocimientoData.notaFinal + resultadoFases2y3

              // Resultado Final = Puntaje Concurso de Méritos + Total Examen de Competencia
              const resultadoFinal = meritoData.puntosEvaluacion + totalExamenCompetencia

              reportArray.push({
                nro: index++,
                carnet,
                nombre: nombreFinal,
                profesion: profesionFinal,
                materia,
                carrera,
                meritos: meritoData.puntosEvaluacion,
                meritosHabilitado: meritoData.habilitado,
                conocimientos: conocimientoData.notaFinal,
                conocimientosHabilitado: conocimientoData.habilitado,
                resultadoFases2y3,
                totalExamenCompetencia,
                resultadoFinal,
                ganador: nombreFinal, // Mismo nombre del postulante
                observaciones: "",
              })
            })
          })
        })

        // Ordenar por carrera, materia y resultado final (de mayor a menor)
        reportArray.sort((a, b) => {
          if (a.carrera !== b.carrera) return a.carrera.localeCompare(b.carrera)
          if (a.materia !== b.materia) return a.materia.localeCompare(b.materia)
          return b.resultadoFinal - a.resultadoFinal
        })

        setReportData(reportArray)
      } catch (error) {
        console.error("Error al obtener datos para el reporte:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un problema al cargar los datos del reporte.",
        })
      }
    }

    fetchData()
  }, [baseURL])

  // Filtrar los datos según "carrera" y "carnet"
  const filteredData = reportData.filter(
    (record) =>
      record.carrera.toLowerCase().includes(filterCareer.toLowerCase()) &&
      (record.carnet?.toLowerCase() || "").includes(filterCI.toLowerCase()),
  )

  // Exportar a Excel usando los datos filtrados
  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay datos para descargar.",
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((record) => ({
        Nro: record.nro,
        Carnet: record.carnet,
        Nombre: record.nombre,
        Profesión: record.profesion,
        Materia: record.materia,
        Carrera: record.carrera,
        "Puntaje Méritos": record.meritos,
        "Habilitado Méritos": record.meritosHabilitado,
        "Puntaje Conocimientos": record.conocimientos,
        "Habilitado Conocimientos": record.conocimientosHabilitado,
        "Resultado Fases 2 y 3": record.resultadoFases2y3.toFixed(2),
        "Total Examen Competencia": record.totalExamenCompetencia.toFixed(2),
        "Resultado Final": record.resultadoFinal.toFixed(2),
        Ganador: record.ganador,
        Observaciones: record.observaciones,
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte General de Notas")
    XLSX.writeFile(workbook, "ReporteGeneralDeNotas.xlsx")
  }

  // Exportar a PDF usando los datos filtrados
  const handleDownloadPDF = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay datos para descargar.",
      })
      return
    }

    // Agrupar registros por carrera y materia
    const registrosPorCarrera = {}

    filteredData.forEach((registro) => {
      const carrera = registro.carrera || "Sin Carrera"
      const materia = registro.materia || "Sin Materia"

      if (!registrosPorCarrera[carrera]) {
        registrosPorCarrera[carrera] = {}
      }

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
    let carreraIndex = 0
    Object.entries(registrosPorCarrera).forEach(([carrera, materias]) => {
      if (carreraIndex > 0) {
        doc.addPage()
      }
      carreraIndex++

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
          "RESULTADOS FINALES DEL PROCESO DE SELECCIÓN",
          margenIzquierdo + anchoLogo + anchoTitulo / 2,
          margenSuperior + altoEncabezado / 2 - 3,
          { align: "center" },
        )
        doc.text(
          "Y ADMISIÓN DOCENTE",
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
        doc.text("CR-UCA-FA-R-20", seccionDerecha + anchoDerecha - 3, margenSuperior + altoFila / 2 + 2, {
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

        // Procesar cada materia de la carrera
        let materiaIndex = 0
        Object.entries(materias).forEach(([materia, postulantes]) => {
          // Solo procesar materias que tengan postulantes
          if (postulantes.length === 0) return

          materiaIndex++

          // Calcular altura estimada: encabezado de asignatura + encabezado de tabla + filas de datos
          const estimatedHeight = 10 + 12 + postulantes.length * 10

          // Si no hay espacio suficiente, añadir nueva página
          if (yPos + estimatedHeight > pageHeight - 40) {
            doc.addPage()
            yPos = margenSuperior
          }

          // Encabezado de la asignatura
          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")

          // Crear un rectángulo para el encabezado de la asignatura
          doc.rect(margenIzquierdo, yPos, anchoUtil, 10)
          doc.text(`ASIGNATURA ${materiaIndex}:`, margenIzquierdo + 5, yPos + 6)
          doc.setFont("helvetica", "normal")
          doc.text(materia, margenIzquierdo + 50, yPos + 6)

          // Crear la tabla de encabezados manualmente para mayor control
          const headerHeight = 12
          const rowHeight = 10

          // Ajustar los anchos de columna para aprovechar mejor el espacio horizontal
          const colWidths = [
            10, // N° - ligeramente más ancho
            30, // NOMBRE(S) Y APELLIDOS - más ancho para aprovechar el espacio horizontal
            20, // PROFESIÓN - más ancho
            30, // ASIGNATURA A LA QUE POSTULA - más ancho
            20, // PUNTAJE CONCURSO DE MÉRITOS
            20, // HABILITADO/NO HABILITADO (méritos)
            20, // PUNTAJE EXAMEN DE CONOCIMIENTO
            20, // HABILITADO/NO HABILITADO (conocimiento)
            20, // RESULTADO FASES 2 Y 3
            20, // TOTAL EXAMEN DE COMPETENCIA
            20, // RESULTADO FINAL
            20, // GANADOR
            20, // OBSERVACIONES
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
          doc.setFontSize(5) // Reducir tamaño de fuente para encabezados más largos
          doc.setFont("helvetica", "bold")

          currentX = margenIzquierdo
          doc.text("N°", currentX + colWidths[0] / 2, tableY + headerHeight / 2 + 2, { align: "center" })

          currentX += colWidths[0]
          doc.text("NOMBRE(S) Y\nAPELLIDOS", currentX + colWidths[1] / 2, tableY + headerHeight / 2, {
            align: "center",
          })

          currentX += colWidths[1]
          doc.text("PROFESIÓN", currentX + colWidths[2] / 2, tableY + headerHeight / 2 + 2, { align: "center" })

          currentX += colWidths[2]
          doc.text("ASIGNATURA A LA\nQUE POSTULA", currentX + colWidths[3] / 2, tableY + headerHeight / 2, {
            align: "center",
          })

          currentX += colWidths[3]
          doc.text("PUNTAJE\nCONCURSO DE\nMÉRITOS", currentX + colWidths[4] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[4]
          doc.text("HABILITADO/\nNO\nHABILITADO", currentX + colWidths[5] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[5]
          doc.text("PUNTAJE\nEXAMEN DE\nCONOCIMIENTO", currentX + colWidths[6] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[6]
          doc.text("HABILITADO/\nNO\nHABILITADO", currentX + colWidths[7] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[7]
          doc.text("RESULTADO\nFASES 2 Y 3", currentX + colWidths[8] / 2, tableY + headerHeight / 2, {
            align: "center",
          })

          currentX += colWidths[8]
          doc.text("TOTAL\nEXAMEN DE\nCOMPETENCIA", currentX + colWidths[9] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[9]
          doc.text("RESULTADO\nFINAL", currentX + colWidths[10] / 2, tableY + headerHeight / 2, {
            align: "center",
          })

          currentX += colWidths[10]
          doc.text("GANADOR", currentX + colWidths[11] / 2, tableY + headerHeight / 2 + 2, {
            align: "center",
          })

          currentX += colWidths[11]
          doc.text("OBSERVACIONES", currentX + colWidths[12] / 2, tableY + headerHeight / 2 + 2, {
            align: "center",
          })

          // Dibujar filas de datos
          doc.setFont("helvetica", "normal")

          let currentY = tableY + headerHeight

          // Dibujar cada fila de datos
          // Si no hay postulantes, no dibujar filas vacías
          if (postulantes.length === 0) return
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
            const nombreText = postulante.nombre || ""
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
            // Puntaje Concurso de Méritos
            doc.text(postulante.meritos.toString(), colX + colWidths[4] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[4]
            // Habilitado/No Habilitado para Concurso de Méritos
            doc.text(postulante.meritosHabilitado, colX + colWidths[5] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[5]
            // Puntaje Examen de Conocimiento
            doc.text(postulante.conocimientos.toString(), colX + colWidths[6] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[6]
            // Habilitado/No Habilitado para Examen de Conocimiento
            doc.text(postulante.conocimientosHabilitado, colX + colWidths[7] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[7]
            // Resultado Fases 2 y 3
            doc.text(postulante.resultadoFases2y3.toFixed(2), colX + colWidths[8] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[8]
            // Total Examen de Competencia
            doc.text(
              postulante.totalExamenCompetencia.toFixed(2),
              colX + colWidths[9] / 2,
              currentY + rowHeight / 2 + 2,
              {
                align: "center",
              },
            )

            colX += colWidths[9]
            // Resultado Final
            doc.text(postulante.resultadoFinal.toFixed(2), colX + colWidths[10] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[10]
            // Ganador
            doc.text(postulante.ganador, colX + colWidths[11] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[11]
            // Observaciones
            const obsText = postulante.observaciones || ""
            doc.text(obsText, colX + colWidths[12] / 2, currentY + rowHeight / 2 + 2, { align: "center" })

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

          // Actualizar posición Y para la siguiente tabla - agregar espacio entre tablas
          yPos = currentY + 10 // Espacio fijo de 10px entre tablas, sin importar el contenido
        })

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
        // Asegurar que haya suficiente espacio para la fecha y firma
        doc.text(fechaFormateada, pageWidth - margenIzquierdo, yPos + 10, { align: "right" })

        // Una sola firma centrada - Jefe de Unidad
        const firmaY = yPos + 25 // Aumentar ligeramente el espacio para la firma
        doc.line(margenIzquierdo + anchoUtil / 2 - 30, firmaY, margenIzquierdo + anchoUtil / 2 + 30, firmaY)
        doc.text("Tcnl.", margenIzquierdo + anchoUtil / 2, firmaY + 5, { align: "center" })
        doc.text("JEFE DE UNIDAD DE EVALUACIÓN Y ACREDITACIÓN", margenIzquierdo + anchoUtil / 2, firmaY + 10, {
          align: "center",
        })
        doc.text("ESCUELA MILITAR DE INGENIERÍA", margenIzquierdo + anchoUtil / 2, firmaY + 15, { align: "center" })
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
    doc.save("ResultadosFinalesSeleccionDocente.pdf")
  }

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
              <th className="py-3 px-4 text-left">Profesión</th>
              <th className="py-3 px-4 text-left">Materia</th>
              <th className="py-3 px-4 text-left">Carrera</th>
              <th className="py-3 px-4 text-left">Méritos</th>
              <th className="py-3 px-4 text-left">Habilitado</th>
              <th className="py-3 px-4 text-left">Conocimientos</th>
              <th className="py-3 px-4 text-left">Habilitado</th>
              <th className="py-3 px-4 text-left">Fases 2 y 3</th>
              <th className="py-3 px-4 text-left">Total Competencia</th>
              <th className="py-3 px-4 text-left">Resultado Final</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {filteredData.map((record) => (
              <tr
                key={`${record.carnet}-${record.materia}-${record.carrera}`}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-2 px-4">{record.nro}</td>
                <td className="py-2 px-4">{record.carnet}</td>
                <td className="py-2 px-4">{record.nombre}</td>
                <td className="py-2 px-4">{record.profesion}</td>
                <td className="py-2 px-4">{record.materia}</td>
                <td className="py-2 px-4">{record.carrera}</td>
                <td className="py-2 px-4">{record.meritos}</td>
                <td className="py-2 px-4">{record.meritosHabilitado}</td>
                <td className="py-2 px-4">{record.conocimientos}</td>
                <td className="py-2 px-4">{record.conocimientosHabilitado}</td>
                <td className="py-2 px-4">{record.resultadoFases2y3.toFixed(2)}</td>
                <td className="py-2 px-4">{record.totalExamenCompetencia.toFixed(2)}</td>
                <td className="py-2 px-4">{record.resultadoFinal.toFixed(2)}</td>
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
              <strong>Profesión:</strong> {record.profesion}
            </p>
            <p className="text-gray-600">
              <strong>Materia:</strong> {record.materia}
            </p>
            <p className="text-gray-600">
              <strong>Carrera:</strong> {record.carrera}
            </p>
            <p className="text-gray-600">
              <strong>Méritos:</strong> {record.meritos} ({record.meritosHabilitado})
            </p>
            <p className="text-gray-600">
              <strong>Conocimientos:</strong> {record.conocimientos} ({record.conocimientosHabilitado})
            </p>
            <p className="text-gray-600">
              <strong>Fases 2 y 3:</strong> {record.resultadoFases2y3.toFixed(2)}
            </p>
            <p className="text-gray-600">
              <strong>Total Competencia:</strong> {record.totalExamenCompetencia.toFixed(2)}
            </p>
            <p className="text-gray-600">
              <strong>Resultado Final:</strong> {record.resultadoFinal.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reportes
