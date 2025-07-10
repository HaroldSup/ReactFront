"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import logoEMI from "../images/emiemi.png"
import { Search, FileSpreadsheet, FileIcon as FilePdf, ChevronDown, ChevronUp, Filter, Calendar } from "lucide-react"

function Reportes() {
  const [reportData, setReportData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    carrera: "",
    profesion: "",
    gestion: "",
    materia: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // ✅ VOLVER A INCLUIR POSTULACIONES PARA MOSTRAR TODOS LOS POSTULANTES
        const [postulacionesRes, meritosRes, conocimientosRes, competenciasRes] = await Promise.all([
          axios.get(`${baseURL}/postulaciones`),
          axios.get(`${baseURL}/api/concurso-meritos`),
          axios.get(`${baseURL}/api/examen-conocimientos`),
          axios.get(`${baseURL}/api/examen-competencias`),
        ])

        const postulaciones = postulacionesRes.data.data || postulacionesRes.data

        const meritos = meritosRes.data
        const conocimientos = conocimientosRes.data
        const competencias = competenciasRes.data

        console.log("📋 Datos obtenidos:")
        console.log("Postulaciones:", postulaciones.length)
        console.log("Méritos:", meritos.length)
        console.log("Conocimientos:", conocimientos.length)
        console.log("Competencias:", competencias.length)

        // ✅ Map para méritos (usa "carnet" o "ci") - LÓGICA ORIGINAL QUE FUNCIONA
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
                fecha: record.fechaEvaluacion || record.fecha || null, // ✅ USAR fechaEvaluacion para méritos
              })
            }
          }
        })

        // ✅ Map para conocimientos (usa "carnet" o "ci") - LÓGICA ORIGINAL QUE FUNCIONA
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
                fecha: record.fecha || null,
              })
            }
          }
        })

        // ✅ Procesar competencias: LÓGICA ORIGINAL QUE FUNCIONA
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
                fecha: record.fecha || null,
                evaluadores: {},
              }
            }

            // ✅ ACTUALIZAR FECHA SI VIENE UNA MÁS RECIENTE
            if (
              record.fecha &&
              (!competenciasAgrupadas[key].fecha || new Date(record.fecha) > new Date(competenciasAgrupadas[key].fecha))
            ) {
              competenciasAgrupadas[key].fecha = record.fecha
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

        // Función para parsear asignaturas de postulaciones
        const parseAsignaturas = (asignaturasRaw) => {
          if (!asignaturasRaw) return []
          if (Array.isArray(asignaturasRaw)) return asignaturasRaw
          try {
            return JSON.parse(asignaturasRaw)
          } catch (err) {
            console.error("Error al parsear asignaturasSeleccionadas", err)
            return []
          }
        }

        // ✅ VOLVER A USAR POSTULACIONES COMO BASE PARA MOSTRAR TODOS
        const reportArray = []
        let index = 1

        // ✅ PROCESAR CADA POSTULACIÓN PARA MOSTRAR TODOS LOS POSTULANTES
        postulaciones.forEach((postulacion) => {
          const asignaturas = parseAsignaturas(postulacion.asignaturasSeleccionadas)
          asignaturas.forEach((asignatura) => {
            if (asignatura.asignatura && asignatura.carrera) {
              const carnet = postulacion.ci
              const materia = asignatura.asignatura
              const carrera = asignatura.carrera

              // ✅ BUSCAR POR ID SOLAMENTE - LÓGICA QUE FUNCIONA
              const meritoData = meritosMap.get(carnet) || {
                puntosEvaluacion: 0,
                nombre: "",
                habilitado: "No Habilitado",
                profesion: "",
                fecha: null,
              }

              const conocimientoData = conocimientosMap.get(carnet) || {
                notaFinal: 0,
                nombre: "",
                habilitado: "No Habilitado",
                profesion: "",
                fecha: null,
              }

              // ✅ BUSCAR EN COMPETENCIAS POR CLAVE COMPLETA
              const keyCompetencias = `${carnet}-${materia}-${carrera}`
              const competenciaData = competenciasAgrupadas[keyCompetencias]

              let resultadoFases2y3 = 0
              let fechaCompetencias = null

              if (competenciaData) {
                fechaCompetencias = competenciaData.fecha
                // Calcular promedio de competencias
                let sumaNotas = 0
                let contadorEvaluadores = 0
                const tiposEvaluador = ["Evaluador 1", "Evaluador 2", "Presidente Tribunal"]

                tiposEvaluador.forEach((tipo) => {
                  if (competenciaData.evaluadores[tipo]) {
                    const notaTotal =
                      competenciaData.evaluadores[tipo].notaPlanTrabajo +
                      competenciaData.evaluadores[tipo].notaProcesosPedagogicos
                    sumaNotas += notaTotal
                    contadorEvaluadores++
                  }
                })

                resultadoFases2y3 = contadorEvaluadores > 0 ? sumaNotas / contadorEvaluadores : 0
              }

              // Usar datos de cualquier fuente disponible
              const nombreFinal = postulacion.nombre || meritoData.nombre || conocimientoData.nombre
              const profesionFinal = postulacion.profesion || meritoData.profesion || conocimientoData.profesion

              // ✅ DETERMINAR LA FECHA MÁS RECIENTE DE LAS TRES FUENTES
              const fechas = [fechaCompetencias, meritoData.fecha, conocimientoData.fecha].filter(Boolean)
              const fechaFinal =
                fechas.length > 0
                  ? fechas.reduce((latest, current) => (new Date(current) > new Date(latest) ? current : latest))
                  : new Date().toISOString().split("T")[0]

              // Total Examen de Competencia = Puntaje Examen de Conocimiento + Resultado Fases 2 y 3
              const totalExamenCompetencia = conocimientoData.notaFinal + resultadoFases2y3

              // ✅ DETERMINAR HABILITADO PARA COMPETENCIA
              const totalCompetenciaHabilitado = totalExamenCompetencia >= 60 ? "Habilitado" : "No Habilitado"

              // Resultado Final = Puntaje Concurso de Méritos + Total Examen de Competencia
              const resultadoFinal = meritoData.puntosEvaluacion + totalExamenCompetencia

              console.log(`📊 Procesando: ${carnet} - ${materia} - ${carrera}`, {
                meritos: meritoData.puntosEvaluacion,
                conocimientos: conocimientoData.notaFinal,
                competencias: resultadoFases2y3,
                total: resultadoFinal,
              })

              reportArray.push({
                nro: index++,
                carnet: postulacion.ci,
                nombre: nombreFinal,
                profesion: profesionFinal,
                materia: asignatura.asignatura,
                carrera: asignatura.carrera,
                meritos: meritoData.puntosEvaluacion,
                meritosHabilitado: meritoData.habilitado,
                conocimientos: conocimientoData.notaFinal,
                conocimientosHabilitado: conocimientoData.habilitado,
                resultadoFases2y3,
                totalExamenCompetencia,
                totalCompetenciaHabilitado,
                resultadoFinal,
                ganador: "", // Se calculará después
                observaciones: "",
                fechaCreacion: fechaFinal,
                // ✅ CAMPOS ADICIONALES PARA DEBUG
                fechaCompetencias: fechaCompetencias,
                fechaMeritos: meritoData.fecha,
                fechaConocimientos: conocimientoData.fecha,
              })
            }
          })
        })

        // ✅ LÓGICA PARA DETERMINAR GANADORES
        const gruposPorMateriaCarrera = {}
        reportArray.forEach((registro) => {
          const key = `${registro.carrera}-${registro.materia}`
          if (!gruposPorMateriaCarrera[key]) {
            gruposPorMateriaCarrera[key] = []
          }
          gruposPorMateriaCarrera[key].push(registro)
        })

        // Ordenar cada grupo por resultado final y marcar ganador
        Object.values(gruposPorMateriaCarrera).forEach((grupo) => {
          grupo.sort((a, b) => b.resultadoFinal - a.resultadoFinal)
          if (grupo.length > 0) {
            const candidato = grupo[0]
            // ✅ NUEVA LÓGICA: Debe tener las 3 evaluaciones habilitadas
            const tieneTodasLasEvaluacionesHabilitadas =
              candidato.meritosHabilitado === "Habilitado" &&
              candidato.conocimientosHabilitado === "Habilitado" &&
              candidato.totalCompetenciaHabilitado === "Habilitado"

            if (tieneTodasLasEvaluacionesHabilitadas && candidato.resultadoFinal > 0) {
              candidato.ganador = "SI"
            }
          }
        })

        // ✅ ORDENAR COMO EN LA LÓGICA ORIGINAL
        reportArray.sort((a, b) => {
          if (a.carrera !== b.carrera) return a.carrera.localeCompare(b.carrera)
          if (a.materia !== b.materia) return a.materia.localeCompare(b.materia)
          return b.resultadoFinal - a.resultadoFinal
        })

        // Renumerar después del ordenamiento
        reportArray.forEach((registro, index) => {
          registro.nro = index + 1
        })

        console.log("📊 Reporte final generado:", reportArray.length, "registros")
        console.log("📊 Muestra de datos con notas:", reportArray.slice(0, 5))

        setReportData(reportArray)
      } catch (error) {
        console.error("Error al obtener datos para el reporte:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un problema al cargar los datos del reporte.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [baseURL])

  // ✅ EXTRAER VALORES ÚNICOS PARA LOS FILTROS - LÓGICA ORIGINAL
  const uniqueCarreras = [...new Set(reportData.map((r) => r.carrera).filter(Boolean))].sort()
  const uniqueProfesiones = [...new Set(reportData.map((r) => r.profesion).filter(Boolean))].sort()
  const uniqueGestiones = [
    ...new Set(
      reportData
        .map((r) => {
          if (r.fechaCreacion) {
            try {
              const fecha = new Date(r.fechaCreacion)
              return fecha.getFullYear().toString()
            } catch (error) {
              console.warn("Error al parsear fecha:", r.fechaCreacion)
              return null
            }
          }
          return null
        })
        .filter(Boolean),
    ),
  ].sort((a, b) => b - a)
  const uniqueMaterias = [...new Set(reportData.map((r) => r.materia).filter(Boolean))].sort()

  // ✅ FILTRAR REGISTROS - LÓGICA ORIGINAL
  const filteredRegistros = reportData.filter((registro) => {
    const matchesSearch =
      registro.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.carnet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.profesion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.materia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.carrera?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCarrera = filters.carrera ? registro.carrera === filters.carrera : true
    const matchesProfesion = filters.profesion ? registro.profesion === filters.profesion : true
    const matchesMateria = filters.materia ? registro.materia === filters.materia : true
    const matchesGestion = filters.gestion
      ? (() => {
          try {
            const fechaRegistro = new Date(registro.fechaCreacion)
            return fechaRegistro.getFullYear().toString() === filters.gestion
          } catch (error) {
            console.warn("Error al filtrar por gestión:", registro.fechaCreacion)
            return false
          }
        })()
      : true

    return matchesSearch && matchesCarrera && matchesProfesion && matchesGestion && matchesMateria
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
      profesion: "",
      gestion: "",
      materia: "",
    })
    setSearchTerm("")
  }

  // Exportar a Excel usando los datos filtrados
  const handleDownloadExcel = () => {
    if (filteredRegistros.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay datos para descargar.",
      })
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredRegistros.map((record) => ({
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
        "Habilitado Total Competencia": record.totalCompetenciaHabilitado,
        "Resultado Final": record.resultadoFinal.toFixed(2),
        Ganador: record.ganador,
        Observaciones: record.observaciones,
        "Fecha de Registro": record.fechaCreacion,
      })),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte General de Notas")
    XLSX.writeFile(workbook, "ReporteGeneralDeNotas.xlsx")
  }

  // Exportar a PDF usando los datos filtrados
  const handleDownloadPDF = () => {
    if (filteredRegistros.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin registros",
        text: "No hay datos para descargar.",
      })
      return
    }

    // Agrupar registros por carrera y materia
    const registrosPorCarrera = {}
    filteredRegistros.forEach((registro) => {
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
        const anchoLogo = anchoUtil * 0.25
        const anchoTitulo = anchoUtil * 0.5
        const anchoCodigo = anchoUtil * 0.25

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

        // Intentar cargar el logo
        const img = new Image()
        img.src = logoEMI
        const logoMaxHeight = altoEncabezado - 4
        const logoMaxWidth = anchoLogo - 10
        const logoHeight = logoMaxHeight
        const logoWidth = logoMaxHeight * 1.5
        const logoX = margenIzquierdo + (anchoLogo - logoWidth) / 2
        doc.addImage(img, "PNG", logoX, margenSuperior + 2, logoWidth, logoHeight)

        // Título en el centro
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

        // Bloque de información
        const yInfoBloque = margenSuperior + altoEncabezado
        const altoInfoBloque = 40
        doc.rect(margenIzquierdo, yInfoBloque, anchoUtil, altoInfoBloque)
        doc.setFontSize(8)
        doc.text("PERIODO ACADÉMICO:", margenIzquierdo + 5, yInfoBloque + 6)
        doc.line(margenIzquierdo, yInfoBloque + 10, margenIzquierdo + anchoUtil, yInfoBloque + 10)
        doc.text("CARRERA:", margenIzquierdo + 5, yInfoBloque + 16)
        doc.setFont("helvetica", "bold")
        doc.text(carrera, margenIzquierdo + 40, yInfoBloque + 16)
        doc.setFont("helvetica", "normal")
        doc.line(margenIzquierdo, yInfoBloque + 20, margenIzquierdo + anchoUtil, yInfoBloque + 20)
        doc.text("Artículo 32:", margenIzquierdo + 5, yInfoBloque + 26)
        const textoArticulo =
          "El puntaje mínimo a obtener en el Concurso de Méritos que permite a la Institución contar con Docentes de relativa experiencia, tanto en la enseñanza como en su actividad profesional es de 220 puntos para nivel Licenciatura y 200 para Nivel Técnico Universitario Superior. El Postulante que no alcance esta puntuación, será descalificado del proceso de selección y, en consecuencia, no podrá optar al Examen de Competencia."
        const textLines = doc.splitTextToSize(textoArticulo, anchoUtil - 60)
        doc.text(textLines, margenIzquierdo + 50, yInfoBloque + 26)

        let yPos = yInfoBloque + altoInfoBloque + 2 // ✅ REDUCIDO DE 5 A 2

        // Procesar cada materia de la carrera
        let materiaIndex = 0
        Object.entries(materias).forEach(([materia, postulantes]) => {
          if (postulantes.length === 0) return
          materiaIndex++

          const estimatedHeight = 10 + 12 + postulantes.length * 10
          if (yPos + estimatedHeight > pageHeight - 40) {
            doc.addPage()
            yPos = margenSuperior
          }

          // Encabezado de la asignatura
          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")
          doc.rect(margenIzquierdo, yPos, anchoUtil, 10)
          doc.text(`ASIGNATURA ${materiaIndex}:`, margenIzquierdo + 5, yPos + 6)
          doc.setFont("helvetica", "normal")
          doc.text(materia, margenIzquierdo + 50, yPos + 6)

          const headerHeight = 12
          const rowHeight = 10

          // ✅ AJUSTAR ANCHOS DE COLUMNA PARA INCLUIR NUEVA COLUMNA
          const colWidths = [
            8, // N° - más pequeño
            25, // NOMBRE(S) Y APELLIDOS
            18, // PROFESIÓN
            25, // ASIGNATURA A LA QUE POSTULA
            18, // PUNTAJE CONCURSO DE MÉRITOS
            18, // HABILITADO/NO HABILITADO (méritos)
            18, // PUNTAJE EXAMEN DE CONOCIMIENTO
            18, // HABILITADO/NO HABILITADO (conocimiento)
            18, // RESULTADO FASES 2 Y 3
            18, // TOTAL EXAMEN DE COMPETENCIA
            18, // HABILITADO/NO HABILITADO (competencia) ✅ NUEVA COLUMNA
            18, // RESULTADO FINAL
            12, // GANADOR
            15, // OBSERVACIONES
          ]

          const tableY = yPos + 10
          let currentX = margenIzquierdo

          // Dibujar encabezados de la tabla
          doc.rect(margenIzquierdo, tableY, anchoUtil, headerHeight)

          // Dibujar líneas verticales para separar columnas en encabezados
          for (let i = 0; i < colWidths.length - 1; i++) {
            currentX += colWidths[i]
            doc.line(currentX, tableY, currentX, tableY + headerHeight)
          }

          // Agregar textos de encabezados
          doc.setFontSize(4) // Reducir más el tamaño para que quepa la nueva columna
          doc.setFont("helvetica", "bold")
          currentX = margenIzquierdo
          const headers = [
            "N°",
            "NOMBRE(S) Y\nAPELLIDOS",
            "PROFESIÓN",
            "ASIGNATURA A LA\nQUE POSTULA",
            "PUNTAJE\nCONCURSO DE\nMÉRITOS",
            "HABILITADO/\nNO\nHABILITADO",
            "PUNTAJE\nEXAMEN DE\nCONOCIMIENTO",
            "HABILITADO/\nNO\nHABILITADO",
            "RESULTADO\nFASES 2 Y 3",
            "TOTAL\nEXAMEN DE\nCOMPETENCIA",
            "HABILITADO/\nNO\nHABILITADO", // ✅ NUEVA COLUMNA
            "RESULTADO\nFINAL",
            "GANADOR",
            "OBSERVACIONES",
          ]

          headers.forEach((header, index) => {
            doc.text(header, currentX + colWidths[index] / 2, tableY + headerHeight / 2, {
              align: "center",
            })
            currentX += colWidths[index]
          })

          // Dibujar filas de datos
          doc.setFont("helvetica", "normal")
          let currentY = tableY + headerHeight

          postulantes.forEach((postulante, index) => {
            const nombreText = postulante.nombre || ""
            const profesionText = postulante.profesion || ""
            const materiaText = materia || ""
            const nombreLines = doc.splitTextToSize(nombreText, colWidths[1] - 4)
            const profesionLines = doc.splitTextToSize(profesionText, colWidths[2] - 4)
            const materiaLines = doc.splitTextToSize(materiaText, colWidths[3] - 4)
            const maxLines = Math.max(nombreLines.length, profesionLines.length, materiaLines.length)
            const calculatedRowHeight = Math.max(rowHeight, maxLines * 3 + 4)

            // Dibujar rectángulo para toda la fila
            doc.rect(margenIzquierdo, currentY, anchoUtil, calculatedRowHeight)

            // Dibujar líneas verticales para separar columnas
            let colX = margenIzquierdo
            for (let i = 0; i < colWidths.length - 1; i++) {
              colX += colWidths[i]
              doc.line(colX, currentY, colX, currentY + calculatedRowHeight)
            }

            // Agregar textos de datos
            colX = margenIzquierdo

            // N°
            doc.text((index + 1).toString(), colX + colWidths[0] / 2, currentY + calculatedRowHeight / 2 + 2, {
              align: "center",
            })
            colX += colWidths[0]

            // Nombre
            const nombreY = currentY + (calculatedRowHeight - nombreLines.length * 3) / 2 + 3
            doc.text(nombreLines, colX + 2, nombreY)
            colX += colWidths[1]

            // Profesión
            const profesionY = currentY + (calculatedRowHeight - profesionLines.length * 3) / 2 + 3
            doc.text(profesionLines, colX + 2, profesionY)
            colX += colWidths[2]

            // Materia
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

            // ✅ NUEVA COLUMNA: Habilitado/No Habilitado para Total Competencia
            doc.text(
              postulante.totalCompetenciaHabilitado,
              colX + colWidths[10] / 2,
              currentY + calculatedRowHeight / 2 + 2,
              {
                align: "center",
              },
            )
            colX += colWidths[10]

            // Resultado Final
            doc.text(
              postulante.resultadoFinal.toFixed(2),
              colX + colWidths[11] / 2,
              currentY + calculatedRowHeight / 2 + 2,
              {
                align: "center",
              },
            )
            colX += colWidths[11]

            // ✅ GANADOR - Solo "SI" o vacío
            doc.text(postulante.ganador, colX + colWidths[12] / 2, currentY + calculatedRowHeight / 2 + 2, {
              align: "center",
            })
            colX += colWidths[12]

            // Observaciones
            const obsText = postulante.observaciones || ""
            doc.text(obsText, colX + colWidths[13] / 2, currentY + calculatedRowHeight / 2 + 2, { align: "center" })

            currentY += calculatedRowHeight
          })

          yPos = currentY + 10
        })

        // Verificar espacio para firma
        if (yPos + 50 > pageHeight - 20) {
          doc.addPage()
          yPos = margenSuperior
        }

        // Fecha y firma
        doc.setFontSize(8)
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

        doc.text(fechaFormateada, pageWidth - margenIzquierdo, yPos + 10, { align: "right" })

        const firmaY = yPos + 25
        doc.line(margenIzquierdo + anchoUtil / 2 - 30, firmaY, margenIzquierdo + anchoUtil / 2 + 30, firmaY)
        doc.text("JEFE DE UNIDAD DE EVALUACIÓN Y ACREDITACIÓN", margenIzquierdo + anchoUtil / 2, firmaY + 5, {
          align: "center",
        })
        doc.text("ESCUELA MILITAR DE INGENIERÍA", margenIzquierdo + anchoUtil / 2, firmaY + 10, { align: "center" })
      } catch (error) {
        console.error("Error al generar el PDF:", error)
        Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "El reporte se generó sin el logo institucional.",
        })
      }
    })

    doc.save("ResultadosFinalesSeleccionDocente.pdf")
  }

  return (
    <div className="p-2 sm:p-4 bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Encabezado con título y botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Reporte General de Notas</h2>
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
                  placeholder="Buscar por nombre, carnet, profesión, materia o carrera..."
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
              {(filters.carrera || filters.profesion || filters.gestion || filters.materia) && (
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
                  <label htmlFor="profesion-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Profesión
                  </label>
                  <select
                    id="profesion-filter"
                    value={filters.profesion}
                    onChange={(e) => setFilters({ ...filters, profesion: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las profesiones</option>
                    {uniqueProfesiones.map((profesion) => (
                      <option key={profesion} value={profesion}>
                        {profesion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="gestion-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Gestión (Año) ✅
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

              {/* ✅ INFORMACIÓN DE DEBUG PARA VERIFICAR FECHAS Y NOTAS */}
              {reportData.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>📊 Debug:</strong> Se encontraron {uniqueGestiones.length} gestiones únicas:{" "}
                    {uniqueGestiones.join(", ")}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Total de registros con fechas válidas: {reportData.filter((r) => r.fechaCreacion).length} de{" "}
                    {reportData.length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    <strong>✅ Registros con notas de méritos &gt; 0:</strong>{" "}
                    {reportData.filter((r) => r.meritos > 0).length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    <strong>✅ Registros con notas de conocimientos &gt; 0:</strong>{" "}
                    {reportData.filter((r) => r.conocimientos > 0).length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    <strong>✅ Registros con notas de competencias &gt; 0:</strong>{" "}
                    {reportData.filter((r) => r.resultadoFases2y3 > 0).length}
                  </p>
                </div>
              )}
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

        {/* Contenedor de tabla con scroll horizontal */}
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
                <th className="py-3 px-4 text-left">Habilitado</th>
                <th className="py-3 px-4 text-left">Resultado Final</th>
                <th className="py-3 px-4 text-left">Ganador</th>
                <th className="py-3 px-4 text-left">📅 Fecha</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-light">
              {isLoading ? (
                <tr>
                  <td colSpan="16" className="py-6 text-center text-gray-500">
                    Cargando registros...
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((record, index) => (
                  <tr
                    key={`${record.carnet}-${record.materia}-${record.carrera}`}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"} border-b border-gray-200 hover:bg-gray-100`}
                  >
                    <td className="py-2 px-4">{record.nro}</td>
                    <td className="py-2 px-4">{record.carnet}</td>
                    <td className="py-2 px-4">{record.nombre}</td>
                    <td className="py-2 px-4">{record.profesion}</td>
                    <td className="py-2 px-4">{record.materia}</td>
                    <td className="py-2 px-4">{record.carrera}</td>
                    <td className="py-2 px-4 font-semibold text-blue-600">{record.meritos}</td>
                    <td className="py-2 px-4">{record.meritosHabilitado}</td>
                    <td className="py-2 px-4 font-semibold text-green-600">{record.conocimientos}</td>
                    <td className="py-2 px-4">{record.conocimientosHabilitado}</td>
                    <td className="py-2 px-4 font-semibold text-purple-600">{record.resultadoFases2y3.toFixed(2)}</td>
                    <td className="py-2 px-4 font-semibold text-orange-600">
                      {record.totalExamenCompetencia.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 font-medium">
                      <span
                        className={
                          record.totalCompetenciaHabilitado === "Habilitado" ? "text-green-600" : "text-red-600"
                        }
                      >
                        {record.totalCompetenciaHabilitado}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-bold text-lg">{record.resultadoFinal.toFixed(2)}</td>
                    <td className="py-2 px-4 font-bold">
                      <span className={record.ganador === "SI" ? "text-green-600" : ""}>{record.ganador}</span>
                    </td>
                    <td className="py-2 px-4 text-xs text-gray-500">
                      {record.fechaCreacion ? new Date(record.fechaCreacion).toLocaleDateString() : "Sin fecha"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="16" className="py-6 text-center text-gray-500">
                    No se encontraron registros que coincidan con los criterios de búsqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista en tarjetas para pantallas pequeñas */}
        <div className="bg-white rounded-xl shadow-lg block sm:hidden mt-4">
          {currentItems.length > 0 ? (
            currentItems.map((record) => (
              <div
                key={`${record.carnet}-${record.materia}-${record.carrera}`}
                className="border-b border-gray-200 hover:bg-gray-100 p-4"
              >
                <div className="mb-1">
                  <span className="font-bold text-gray-800">
                    {record.nro}. {record.nombre}
                  </span>
                  {record.ganador === "SI" && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">
                      GANADOR
                    </span>
                  )}
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
                  <strong>Méritos:</strong> <span className="font-semibold text-blue-600">{record.meritos}</span> (
                  {record.meritosHabilitado})
                </p>
                <p className="text-gray-600">
                  <strong>Conocimientos:</strong>{" "}
                  <span className="font-semibold text-green-600">{record.conocimientos}</span> (
                  {record.conocimientosHabilitado})
                </p>
                <p className="text-gray-600">
                  <strong>Fases 2 y 3:</strong>{" "}
                  <span className="font-semibold text-purple-600">{record.resultadoFases2y3.toFixed(2)}</span>
                </p>
                <p className="text-gray-600">
                  <strong>Total Competencia:</strong>{" "}
                  <span className="font-semibold text-orange-600">{record.totalExamenCompetencia.toFixed(2)}</span>
                  <span
                    className={`ml-2 font-medium ${record.totalCompetenciaHabilitado === "Habilitado" ? "text-green-600" : "text-red-600"}`}
                  >
                    ({record.totalCompetenciaHabilitado})
                  </span>
                </p>
                <p className="text-gray-600">
                  <strong>Resultado Final:</strong>{" "}
                  <span className="font-bold text-lg">{record.resultadoFinal.toFixed(2)}</span>
                </p>
                <p className="text-gray-500 text-xs">
                  <strong>📅 Fecha:</strong>{" "}
                  {record.fechaCreacion ? new Date(record.fechaCreacion).toLocaleDateString() : "Sin fecha"}
                </p>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No se encontraron registros que coincidan con los criterios de búsqueda
            </div>
          )}
        </div>

        {/* Estado de carga */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando registros...</p>
          </div>
        ) : filteredRegistros.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600">No se encontraron registros con los filtros aplicados.</p>
            {(searchTerm || filters.carrera || filters.profesion || filters.gestion || filters.materia) && (
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

export default Reportes
