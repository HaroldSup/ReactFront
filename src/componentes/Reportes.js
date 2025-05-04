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
  const [registrosFiltrados, setRegistrosFiltrados] = useState([])
  const [filtros, setFiltros] = useState({
    busqueda: "",
    campo: "todos", // Opciones: todos, nombre, carnet, profesion, materia, carrera
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

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
        setRegistrosFiltrados(reportArray) // Inicialmente, mostrar todos los registros
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

  // Aplicar filtros cuando cambian los criterios de búsqueda
  useEffect(() => {
    aplicarFiltros()
  }, [filtros, reportData])

  // Función para aplicar los filtros a los registros
  const aplicarFiltros = () => {
    const { busqueda, campo } = filtros

    if (!busqueda.trim()) {
      setRegistrosFiltrados(reportData)
      return
    }

    const busquedaLower = busqueda.toLowerCase().trim()

    const resultadosFiltrados = reportData.filter((registro) => {
      // Si el campo es "todos", buscar en todos los campos
      if (campo === "todos") {
        return (
          (registro.nombre?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.carnet?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.profesion?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.materia?.toLowerCase() || "").includes(busquedaLower) ||
          (registro.carrera?.toLowerCase() || "").includes(busquedaLower)
        )
      }

      // Buscar en el campo específico
      switch (campo) {
        case "nombre":
          return (registro.nombre?.toLowerCase() || "").includes(busquedaLower)
        case "carnet":
          return (registro.carnet?.toLowerCase() || "").includes(busquedaLower)
        case "profesion":
          return (registro.profesion?.toLowerCase() || "").includes(busquedaLower)
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

  // Exportar a Excel usando los datos filtrados
  const handleDownloadExcel = () => {
    if (registrosFiltrados.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay datos para descargar.",
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      registrosFiltrados.map((record) => ({
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
    if (registrosFiltrados.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay datos para descargar.",
      })
      return
    }

    // Agrupar registros por carrera y materia
    const registrosPorCarrera = {}

    registrosFiltrados.forEach((registro) => {
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
            // Calcular la altura necesaria para esta fila basada en su contenido
            const nombreText = postulante.nombre || ""
            const profesionText = postulante.profesion || ""
            const materiaText = materia || ""

            // Dividir textos para calcular cuántas líneas ocuparán
            const nombreLines = doc.splitTextToSize(nombreText, colWidths[1] - 4)
            const profesionLines = doc.splitTextToSize(profesionText, colWidths[2] - 4)
            const materiaLines = doc.splitTextToSize(materiaText, colWidths[3] - 4)

            // Determinar el número máximo de líneas para calcular la altura de la fila
            const maxLines = Math.max(nombreLines.length, profesionLines.length, materiaLines.length)

            // Calcular la altura de la fila basada en el contenido
            const calculatedRowHeight = Math.max(rowHeight, maxLines * 3 + 4) // 3 puntos por línea + 4 de margen

            // Dibujar rectángulo para toda la fila con la altura calculada
            doc.rect(margenIzquierdo, currentY, anchoUtil, calculatedRowHeight)

            // Dibujar líneas verticales para separar columnas
            let colX = margenIzquierdo
            for (let i = 0; i < colWidths.length - 1; i++) {
              colX += colWidths[i]
              doc.line(colX, currentY, colX, currentY + calculatedRowHeight)
            }

            // Agregar textos de datos
            colX = margenIzquierdo
            doc.text((index + 1).toString(), colX + colWidths[0] / 2, currentY + calculatedRowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[0]
            // Centrar verticalmente el texto en la celda
            const nombreY = currentY + (calculatedRowHeight - nombreLines.length * 3) / 2 + 3
            doc.text(nombreLines, colX + 2, nombreY)

            colX += colWidths[1]
            // Centrar verticalmente el texto en la celda
            const profesionY = currentY + (calculatedRowHeight - profesionLines.length * 3) / 2 + 3
            doc.text(profesionLines, colX + 2, profesionY)

            colX += colWidths[2]
            // Centrar verticalmente el texto en la celda
            const materiaY = currentY + (calculatedRowHeight - materiaLines.length * 3) / 2 + 3
            doc.text(materiaLines, colX + 2, materiaY)

            colX += colWidths[3]
            // Puntaje Concurso de Méritos
            doc.text(postulante.meritos.toString(), colX + colWidths[4] / 2, currentY + calculatedRowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[4]
            // Habilitado/No Habilitado para Concurso de Méritos
            doc.text(postulante.meritosHabilitado, colX + colWidths[5] / 2, currentY + calculatedRowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[5]
            // Puntaje Examen de Conocimiento
            doc.text(
              postulante.conocimientos.toString(),
              colX + colWidths[6] / 2,
              currentY + calculatedRowHeight / 2 + 2,
              {
                align: "center",
              },
            )

            colX += colWidths[6]
            // Habilitado/No Habilitado para Examen de Conocimiento
            doc.text(
              postulante.conocimientosHabilitado,
              colX + colWidths[7] / 2,
              currentY + calculatedRowHeight / 2 + 2,
              {
                align: "center",
              },
            )

            colX += colWidths[7]
            // Resultado Fases 2 y 3
            doc.text(
              postulante.resultadoFases2y3.toFixed(2),
              colX + colWidths[8] / 2,
              currentY + calculatedRowHeight / 2 + 2,
              {
                align: "center",
              },
            )

            colX += colWidths[8]
            // Total Examen de Competencia
            doc.text(
              postulante.totalExamenCompetencia.toFixed(2),
              colX + colWidths[9] / 2,
              currentY + calculatedRowHeight / 2 + 2,
              {
                align: "center",
              },
            )

            colX += colWidths[9]
            // Resultado Final
            doc.text(
              postulante.resultadoFinal.toFixed(2),
              colX + colWidths[10] / 2,
              currentY + calculatedRowHeight / 2 + 2,
              {
                align: "center",
              },
            )

            colX += colWidths[10]
            // Ganador
            doc.text(postulante.ganador, colX + colWidths[11] / 2, currentY + calculatedRowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[11]
            // Observaciones
            const obsText = postulante.observaciones || ""
            doc.text(obsText, colX + colWidths[12] / 2, currentY + calculatedRowHeight / 2 + 2, { align: "center" })

            // Actualizar la posición Y para la siguiente fila
            currentY += calculatedRowHeight
          })

          // Actualizar posición Y para la siguiente tabla - agregar espacio entre tablas
          yPos = currentY + 10 // Espacio fijo de 10px entre tablas
        })

        // Verificar si hay espacio suficiente para la firma
        // Necesitamos aproximadamente 50 puntos de altura para la firma y fecha
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

        // Una sola firma centrada - Jefe de Unidad (sin cargo profesional)
        const firmaY = yPos + 25
        doc.line(margenIzquierdo + anchoUtil / 2 - 30, firmaY, margenIzquierdo + anchoUtil / 2 + 30, firmaY)
        doc.text("JEFE DE UNIDAD DE EVALUACIÓN Y ACREDITACIÓN", margenIzquierdo + anchoUtil / 2, firmaY + 5, {
          align: "center",
        })
        doc.text("ESCUELA MILITAR DE INGENIERÍA", margenIzquierdo + anchoUtil / 2, firmaY + 10, { align: "center" })
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
        </div>
      </div>

      {/* Sección de filtros mejorada */}
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
                  <option value="profesion">Profesión</option>
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
          Mostrando {registrosFiltrados.length} de {reportData.length} registros
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
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((record) => (
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
              ))
            ) : (
              <tr>
                <td colSpan="13" className="py-6 text-center text-gray-500">
                  No se encontraron registros que coincidan con los criterios de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vista en tarjetas para pantallas pequeñas */}
      <div className="bg-white rounded-xl shadow-lg block sm:hidden mt-4">
        {registrosFiltrados.length > 0 ? (
          registrosFiltrados.map((record) => (
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
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No se encontraron registros que coincidan con los criterios de búsqueda
          </div>
        )}
      </div>
    </div>
  )
}

export default Reportes
