"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import Registrodeconocimientos from "./Registrodeconocimientos"
import logoEMI from "../images/emiemi.png" // Importamos el logo desde la misma ruta

function Examendeconocimientos() {
  const [registros, setRegistros] = useState([])
  const [registrosFiltrados, setRegistrosFiltrados] = useState([])
  const [registrosMeritos, setRegistrosMeritos] = useState([]) // Para almacenar los registros de méritos
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [conocimientoEdit, setConocimientoEdit] = useState(null)
  const [filtros, setFiltros] = useState({
    busqueda: "",
    campo: "todos", // Opciones: todos, nombre, carnet, profesion, carrera
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Obtener los registros desde el backend, filtrarlos según el usuario y ordenarlos por Nota Final (descendente)
  const fetchRegistros = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/examen-conocimientos`)
      console.log("Registros obtenidos:", response.data)

      // Recuperar datos del usuario desde localStorage (clave "user")
      const user = JSON.parse(localStorage.getItem("user"))
      console.log("Usuario logueado:", user)

      let registrosData = response.data
      if (user && !user.administrador) {
        // Filtrar registros que tengan evaluadorId y que coincidan con user._id
        registrosData = registrosData.filter((registro) => registro.evaluadorId && registro.evaluadorId === user._id)
      }
      // Ordenar la lista de registros de forma descendente según la Nota Final
      registrosData.sort((a, b) => Number(b.notaFinal) - Number(a.notaFinal))
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

  // Obtener los registros de méritos para combinarlos en el reporte
  const fetchRegistrosMeritos = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/concurso-meritos`)
      console.log("Registros de méritos obtenidos:", response.data)
      setRegistrosMeritos(response.data)
    } catch (error) {
      console.error("Error al obtener los registros de méritos:", error)
      // No mostramos alerta para no interrumpir la experiencia del usuario
    }
  }

  useEffect(() => {
    fetchRegistros()
    fetchRegistrosMeritos() // Cargar también los registros de méritos
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
          (registro.profesion?.toLowerCase() || "").includes(busquedaLower) ||
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
        await axios.delete(`${baseURL}/api/examen-conocimientos/${id}`)
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

  // Actualiza la lista luego de registrar o editar
  const onConocimientoRegistered = (nuevoRegistro) => {
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
  }

  // Función para buscar el registro de méritos correspondiente
  const buscarRegistroMeritos = (nombre, materia, carrera) => {
    // Intentamos encontrar una coincidencia exacta por nombre y materia
    const registroExacto = registrosMeritos.find(
      (r) =>
        r.nombrePostulante?.toLowerCase() === nombre?.toLowerCase() &&
        r.materia?.toLowerCase() === materia?.toLowerCase() &&
        r.carrera?.toLowerCase() === carrera?.toLowerCase(),
    )

    if (registroExacto) return registroExacto

    // Si no hay coincidencia exacta, buscamos por similitud en el nombre y materia exacta
    return registrosMeritos.find(
      (r) =>
        r.nombrePostulante?.toLowerCase().includes(nombre?.toLowerCase()) &&
        r.materia?.toLowerCase() === materia?.toLowerCase() &&
        r.carrera?.toLowerCase() === carrera?.toLowerCase(),
    )
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
          "RESULTADOS DE LA FASE I DEL EXAMEN DE COMPETENCIAS:",
          margenIzquierdo + anchoLogo + anchoTitulo / 2,
          margenSuperior + altoEncabezado / 2 - 3,
          { align: "center" },
        )
        doc.text(
          "EVALUACIÓN DE CONOCIMIENTOS",
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
        doc.text("CR-UCA-FA-R-19", seccionDerecha + anchoDerecha - 3, margenSuperior + altoFila / 2 + 2, {
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
          // Ahora incluimos dos columnas adicionales para el examen de conocimiento
          const colWidths = [
            12, // N° - ligeramente más ancho
            45, // NOMBRE(S) Y APELLIDOS - más ancho para aprovechar el espacio horizontal
            30, // PROFESIÓN - más ancho
            45, // ASIGNATURA A LA QUE POSTULA - más ancho
            25, // PUNTAJE CONCURSO DE MÉRITOS
            25, // HABILITADO/NO HABILITADO (méritos)
            25, // PUNTAJE EXAMEN DE CONOCIMIENTO
            25, // HABILITADO/NO HABILITADO (conocimiento)
            25, // OBSERVACIONES
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
          doc.setFontSize(6) // Reducir tamaño de fuente para encabezados más largos
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
          // Nueva columna: PUNTAJE EXAMEN DE CONOCIMIENTO
          doc.text("PUNTAJE\nEXAMEN DE\nCONOCIMIENTO", currentX + colWidths[6] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[6]
          // Nueva columna: HABILITADO/NO HABILITADO (para examen de conocimiento)
          doc.text("HABILITADO/\nNO\nHABILITADO", currentX + colWidths[7] / 2, tableY + headerHeight / 2 - 2, {
            align: "center",
          })

          currentX += colWidths[7]
          // Mantener el mismo tamaño de letra para "OBSERVACIONES" que los demás encabezados
          doc.text("OBSERVACIONES", currentX + colWidths[8] / 2, tableY + headerHeight / 2 + 2, { align: "center" })

          // Dibujar filas de datos
          doc.setFont("helvetica", "normal")

          let currentY = tableY + headerHeight

          // Dibujar cada fila de datos
          postulantes.forEach((postulante, index) => {
            // Buscar el registro de méritos correspondiente
            const registroMerito = buscarRegistroMeritos(postulante.nombre, postulante.materia, postulante.carrera)

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
            // Puntaje Concurso de Méritos (del registro de méritos si existe)
            const puntajeMeritos = registroMerito ? registroMerito.puntosEvaluacion : "-"
            doc.text(puntajeMeritos.toString(), colX + colWidths[4] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[4]
            // Habilitado/No Habilitado para Concurso de Méritos
            const habilitadoMeritos = registroMerito ? registroMerito.habilitado || "-" : "-"
            doc.text(habilitadoMeritos, colX + colWidths[5] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[5]
            // Puntaje Examen de Conocimiento
            doc.text(postulante.notaFinal.toString(), colX + colWidths[6] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[6]
            // Habilitado/No Habilitado para Examen de Conocimiento
            doc.text(postulante.habilitado || "-", colX + colWidths[7] / 2, currentY + rowHeight / 2 + 2, {
              align: "center",
            })

            colX += colWidths[7]
            // Observaciones
            const obsText = postulante.observaciones || "Ninguna"
            doc.text(obsText, colX + colWidths[8] / 2, currentY + rowHeight / 2 + 2, { align: "center" })

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

        // Verificar si hay espacio suficiente para la firma
        // Necesitamos aproximadamente 50 puntos de altura para la firma
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

        // Una sola firma centrada - Jefe de Unidad (sin cargo profesional)
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
    doc.save("ResultadosExamenConocimientos.pdf")
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen w-full">
      {/* Encabezado y botones */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Examen de Conocimientos</h2>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 transition"
          >
            Descargar PDF
          </button>
          <button
            onClick={() => {
              setConocimientoEdit(null)
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
                  <option value="profesion">Profesión</option>
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
          <Registrodeconocimientos
            conocimiento={conocimientoEdit}
            onConocimientoRegistered={onConocimientoRegistered}
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
                <th className="py-3 px-2 text-left">Nombre</th>
                <th className="py-3 px-2 text-left">Carnet</th>
                <th className="py-3 px-2 text-left">Evaluador</th>
                <th className="py-3 px-2 text-left">Profesión</th>
                <th className="py-3 px-2 text-left">Carrera</th>
                <th className="py-3 px-2 text-left">Materia</th>
                <th className="py-3 px-2 text-left">Estado</th>
                <th className="py-3 px-2 text-left">Observaciones</th>
                <th className="py-3 px-2 text-left">Fecha</th>
                <th className="py-3 px-2 text-left">Nota Final (40%)</th>
                <th className="py-3 px-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-light">
              {registrosFiltrados.length > 0 ? (
                registrosFiltrados.map((registro, index) => (
                  <tr key={registro._id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-2 text-left whitespace-nowrap">{index + 1}</td>
                    <td className="py-3 px-2 text-left">{registro.nombre}</td>
                    <td className="py-3 px-2 text-left">{registro.carnet}</td>
                    <td className="py-3 px-2 text-left">{registro.nombreEvaluador || ""}</td>
                    <td className="py-3 px-2 text-left">{registro.profesion || ""}</td>
                    <td className="py-3 px-2 text-left">{registro.carrera || ""}</td>
                    <td className="py-3 px-2 text-left">{registro.materia || ""}</td>
                    <td className="py-3 px-2 text-left">{registro.habilitado || ""}</td>
                    <td className="py-3 px-2 text-left">{registro.observaciones || ""}</td>
                    <td className="py-3 px-2 text-left">{new Date(registro.fecha).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-left">{registro.notaFinal}</td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => {
                            setConocimientoEdit(registro)
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
                  <td colSpan="12" className="py-6 text-center text-gray-500">
                    No se encontraron registros que coincidan con los criterios de búsqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Vista en tarjetas para pantallas pequeñas */}
          <div className="block sm:hidden w-full">
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((registro, index) => (
                <div key={registro._id} className="border-b border-gray-200 hover:bg-gray-100 p-4">
                  <div>
                    <span className="font-bold text-gray-800">
                      {index + 1}. {registro.nombre} - {registro.carnet}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-600">
                      <strong>Evaluador:</strong> {registro.nombreEvaluador || ""}
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
                      <strong>Estado:</strong> {registro.habilitado || ""}
                    </p>
                    <p className="text-gray-600">
                      <strong>Observaciones:</strong> {registro.observaciones || ""}
                    </p>
                    <p className="text-gray-600">
                      <strong>Fecha:</strong> {new Date(registro.fecha).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>Nota Final (40%):</strong> {registro.notaFinal}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        setConocimientoEdit(registro)
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

export default Examendeconocimientos
