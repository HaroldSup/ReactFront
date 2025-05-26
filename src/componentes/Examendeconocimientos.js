"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import Registrodeconocimientos from "./Registrodeconocimientos"
import logoEMI from "../images/emiemi.png" // Importamos el logo desde la misma ruta
import { Search, FileSpreadsheet, FileIcon as FilePdf, Plus, ChevronDown, ChevronUp, Filter, Calendar } from 'lucide-react'
import * as XLSX from "xlsx"

function Examendeconocimientos() {
  const [registros, setRegistros] = useState([])
  const [registrosMeritos, setRegistrosMeritos] = useState([]) // Para almacenar los registros de méritos
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [conocimientoEdit, setConocimientoEdit] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [filters, setFilters] = useState({
    carrera: "",
    profesion: "",
    gestion: "",
    estado: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const baseURL =
    process.env.NODE_ENV === "development" ? process.env.REACT_APP_urlbacklocalhost : process.env.REACT_APP_urlback

  // Obtener los registros desde el backend, filtrarlos según el usuario y ordenarlos por Nota Final (descendente)
  const fetchRegistros = async () => {
    setIsLoading(true)
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
  // useEffect(() => {
  //   aplicarFiltros()
  // }, [filtros, registros])

  // Función para aplicar los filtros a los registros
  // const aplicarFiltros = () => {
  //   const { busqueda, campo } = filtros

  //   if (!busqueda.trim()) {
  //     setRegistrosFiltrados(registros)
  //     return
  //   }

  //   const busquedaLower = busqueda.toLowerCase().trim()

  //   const resultadosFiltrados = registros.filter((registro) => {
  //     // Si el campo es "todos", buscar en todos los campos
  //     if (campo === "todos") {
  //       return (
  //         (registro.nombre?.toLowerCase() || "").includes(busquedaLower) ||
  //         (registro.carnet?.toLowerCase() || "").includes(busquedaLower) ||
  //         (registro.profesion?.toLowerCase() || "").includes(busquedaLower) ||
  //         (registro.carrera?.toLowerCase() || "").includes(busquedaLower)
  //       )
  //     }

  //     // Buscar en el campo específico
  //     switch (campo) {
  //       case "nombre":
  //         return (registro.nombre?.toLowerCase() || "").includes(busquedaLower)
  //       case "carnet":
  //         return (registro.carnet?.toLowerCase() || "").includes(busquedaLower)
  //       case "profesion":
  //         return (registro.profesion?.toLowerCase() || "").includes(busquedaLower)
  //       case "carrera":
  //         return (registro.carrera?.toLowerCase() || "").includes(busquedaLower)
  //       default:
  //         return false
  //     }
  //   })

  //   setRegistrosFiltrados(resultadosFiltrados)
  // }

  // Manejar cambios en el campo de búsqueda
  // const handleBusquedaChange = (e) => {
  //   setFiltros({
  //     ...filtros,
  //     busqueda: e.target.value,
  //   })
  // }

  // Manejar cambios en el campo de filtro
  // const handleCampoChange = (e) => {
  //   setFiltros({
  //     ...filtros,
  //     campo: e.target.value,
  //   })
  // }

  // Limpiar todos los filtros
  // const limpiarFiltros = () => {
  //   setFiltros({
  //     busqueda: "",
  //     campo: "todos",
  //   })
  // }

  // Extraer valores únicos para los filtros
  const uniqueCarreras = [...new Set(registros.map((r) => r.carrera).filter(Boolean))].sort()
  const uniqueProfesiones = [...new Set(registros.map((r) => r.profesion).filter(Boolean))].sort()
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
  const uniqueEstados = [...new Set(registros.map((r) => r.habilitado).filter(Boolean))].sort()

  // Filtrar registros
  const filteredRegistros = registros.filter((registro) => {
    const matchesSearch =
      registro.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.carnet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.profesion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.carrera?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.materia?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCarrera = filters.carrera ? registro.carrera === filters.carrera : true
    const matchesProfesion = filters.profesion ? registro.profesion === filters.profesion : true
    const matchesEstado = filters.estado ? registro.habilitado === filters.estado : true

    const matchesGestion = filters.gestion
      ? new Date(registro.fecha).getFullYear().toString() === filters.gestion
      : true

    return matchesSearch && matchesCarrera && matchesProfesion && matchesGestion && matchesEstado
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
      estado: "",
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
        Nombre: registro.nombre,
        Carnet: registro.carnet,
        Evaluador: registro.nombreEvaluador,
        Profesión: registro.profesion,
        Carrera: registro.carrera,
        Materia: registro.materia,
        Estado: registro.habilitado,
        Observaciones: registro.observaciones,
        Fecha: new Date(registro.fecha).toLocaleDateString(),
        "Nota Final": registro.notaFinal,
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Examen_Conocimientos")

    XLSX.writeFile(workbook, "Examen_Conocimientos.xlsx")
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

  // Actualiza la lista luego de registrar o editar
  const onConocimientoRegistered = (nuevoRegistro) => {
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
    <div className="p-2 sm:p-4 bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Encabezado con título y botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Examen de Conocimientos</h2>
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
                setConocimientoEdit(null)
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
                  placeholder="Buscar por nombre, carnet, profesión, carrera o materia..."
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
              {(filters.carrera || filters.profesion || filters.gestion || filters.estado) && (
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
                  <label htmlFor="estado-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    id="estado-filter"
                    value={filters.estado}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    {uniqueEstados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
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
            <Registrodeconocimientos
              conocimiento={conocimientoEdit}
              onConocimientoRegistered={onConocimientoRegistered}
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
                {(searchTerm || filters.carrera || filters.profesion || filters.gestion || filters.estado) && (
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
                        <th className="py-3 px-6 text-left">Nombre</th>
                        <th className="py-3 px-6 text-left">Carnet</th>
                        <th className="py-3 px-6 text-left">Evaluador</th>
                        <th className="py-3 px-6 text-left">Profesión</th>
                        <th className="py-3 px-6 text-left">Carrera</th>
                        <th className="py-3 px-6 text-left">Materia</th>
                        <th className="py-3 px-6 text-left">Estado</th>
                        <th className="py-3 px-6 text-left">Fecha</th>
                        <th className="py-3 px-6 text-left">Nota Final</th>
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
                          <td className="py-3 px-6 text-left font-medium text-gray-800">{registro.nombre}</td>
                          <td className="py-3 px-6 text-left">{registro.carnet}</td>
                          <td className="py-3 px-6 text-left">{registro.nombreEvaluador || ""}</td>
                          <td className="py-3 px-6 text-left">{registro.profesion || ""}</td>
                          <td className="py-3 px-6 text-left">{registro.carrera || ""}</td>
                          <td className="py-3 px-6 text-left">{registro.materia || ""}</td>
                          <td className="py-3 px-6 text-left">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                registro.habilitado === "HABILITADO"
                                  ? "bg-green-100 text-green-800"
                                  : registro.habilitado === "NO HABILITADO"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {registro.habilitado || ""}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-left">{new Date(registro.fecha).toLocaleDateString()}</td>
                          <td className="py-3 px-6 text-left font-semibold">{registro.notaFinal}</td>
                          <td className="py-3 px-6 text-center flex justify-center space-x-2">
                            <button
                              onClick={() => {
                                setConocimientoEdit(registro)
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
                          {indexOfFirstItem + index + 1}. {registro.nombre} - {registro.carnet}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2">
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
                          <strong>Estado:</strong>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              registro.habilitado === "HABILITADO"
                                ? "bg-green-100 text-green-800"
                                : registro.habilitado === "NO HABILITADO"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {registro.habilitado || ""}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          <strong>Fecha:</strong> {new Date(registro.fecha).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">
                          <strong>Nota Final:</strong> <span className="font-semibold">{registro.notaFinal}</span>
                        </p>
                      </div>
                      <div className="mt-4 flex justify-center space-x-4">
                        <button
                          onClick={() => {
                            setConocimientoEdit(registro)
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

export default Examendeconocimientos