"use client"

import { useState, useEffect, useRef } from "react"
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow"
import "reactflow/dist/style.css"
import { CheckCircleIcon } from "@heroicons/react/24/outline"

// Hook personalizado para detectar el tamaño de la ventana
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  return windowSize
}

// Nodo personalizado para procesos
const ProcessNode = ({ data }) => {
  const { width } = useWindowSize()
  const isMobile = width < 768

  return (
    <div
      className={`p-3 rounded-lg shadow-md ${
        data.isVisited ? "bg-blue-50 border-2 border-blue-500" : "bg-white border border-gray-300"
      } ${data.isActive ? "bg-yellow-50 border-2 border-yellow-500" : ""}`}
      style={{ width: isMobile ? "180px" : "220px" }}
    >
      <div className="flex items-center">
        <div
          className={`p-1.5 rounded-full ${data.isVisited ? "bg-blue-500 text-white" : data.isActive ? "bg-yellow-500 text-white" : "bg-gray-100"} mr-2`}
        >
          {data.icon}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          {!isMobile && data.description && <div className="text-xs text-gray-500 mt-1">{data.description}</div>}
        </div>
        {data.isVisited && (
          <div className="w-5 h-5 text-green-600 ml-1 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#2196F3" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#2196F3" }} />
    </div>
  )
}

// Nodo personalizado para inicio y fin
const SpecialNode = ({ data }) => {
  const { width } = useWindowSize()
  const isMobile = width < 768
  const isStart = data.label === "Inicio"

  return (
    <div
      className={`p-3 rounded-lg shadow-md ${
        isStart ? "bg-gradient-to-r from-green-500 to-green-700" : "bg-gradient-to-r from-red-500 to-red-700"
      } text-white`}
      style={{ width: isMobile ? "120px" : "150px" }}
    >
      <div className="flex items-center justify-center">
        <div className="p-1.5 rounded-full bg-white text-current mr-2">{data.icon}</div>
        <div className="font-medium">{data.label}</div>
      </div>
      {isStart ? (
        <Handle type="source" position={Position.Right} style={{ background: "#fff" }} />
      ) : (
        <Handle type="target" position={Position.Left} style={{ background: "#fff" }} />
      )}
    </div>
  )
}

// Definición de tipos de nodos
const nodeTypes = {
  process: ProcessNode,
  special: SpecialNode,
}

// Nodos reorganizados con flujo de izquierda a derecha
const initialNodes = [
  // Nodo de inicio
  {
    id: "1",
    type: "special",
    position: { x: 50, y: 300 },
    data: {
      label: "Inicio",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-green-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      isVisited: true,
    },
  },

  // Grupo 1: Administración
  {
    id: "2",
    type: "process",
    position: { x: 300, y: 100 },
    data: {
      label: "Lista de materias acefalas",
      description: "Gestión de acefalías",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "3",
    type: "process",
    position: { x: 600, y: 100 },
    data: {
      label: "Añadir materia acefala",
      description: "Registro de acefalías",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      isVisited: false,
    },
  },

  // Grupo 2: Usuarios
  {
    id: "19",
    type: "process",
    position: { x: 300, y: 200 },
    data: {
      label: "Lista Usuarios",
      description: "Gestión de usuarios",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "20",
    type: "process",
    position: { x: 600, y: 200 },
    data: {
      label: "Añadir Usuario",
      description: "Registro de usuarios",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "4",
    type: "process",
    position: { x: 900, y: 200 },
    data: {
      label: "Asignar roles y permisos",
      description: "Configuración de accesos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      isVisited: false,
    },
  },

  // Grupo 3: Postulantes
  {
    id: "5",
    type: "process",
    position: { x: 300, y: 300 },
    data: {
      label: "Postulaciones",
      description: "Gestión de postulantes",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "6",
    type: "process",
    position: { x: 600, y: 300 },
    data: {
      label: "Visualizar historial de registro y documentacion",
      description: "Revisión de documentos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      isVisited: false,
    },
  },

  // Grupo 4: Evaluación de Méritos
  {
    id: "7",
    type: "process",
    position: { x: 300, y: 400 },
    data: {
      label: "Comité de Evaluación",
      description: "Evaluación de candidatos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "8",
    type: "process",
    position: { x: 600, y: 400 },
    data: {
      label: "Gestión de la documentación concurso de méritos",
      description: "Documentación de méritos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "9",
    type: "process",
    position: { x: 900, y: 400 },
    data: {
      label: "Registrar puntos de evaluación",
      description: "Calificación de méritos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      isVisited: false,
    },
  },

  // Grupo 5: Evaluación de Competencias
  {
    id: "10",
    type: "process",
    position: { x: 300, y: 500 },
    data: {
      label: "Comité de evaluación",
      description: "Evaluación de competencias",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "11",
    type: "process",
    position: { x: 600, y: 500 },
    data: {
      label: "Gestión de la documentación examen de competencias",
      description: "Documentación de competencias",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "12",
    type: "process",
    position: { x: 900, y: 500 },
    data: {
      label: "Registrar puntos de evaluación",
      description: "Calificación de competencias",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      isVisited: false,
    },
  },

  // Grupo 6: Reportes
  {
    id: "17",
    type: "process",
    position: { x: 300, y: 600 },
    data: {
      label: "Módulo de Reportes",
      description: "Generación de reportes",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "18",
    type: "process",
    position: { x: 600, y: 600 },
    data: {
      label: "Reporte General de Notas",
      description: "Visualización de calificaciones",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      isVisited: false,
    },
  },

  // Grupo 7: Dirección Académica
  {
    id: "13",
    type: "process",
    position: { x: 300, y: 700 },
    data: {
      label: "Firma Digital",
      description: "Autorización de documentos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "14",
    type: "process",
    position: { x: 600, y: 700 },
    data: {
      label: "Subir documentación",
      description: "Carga de documentos finales",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      isVisited: false,
    },
  },
  {
    id: "15",
    type: "process",
    position: { x: 900, y: 700 },
    data: {
      label: "Descargar documentación con Firma Digital",
      description: "Obtención de documentos firmados",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      isVisited: false,
    },
  },

  // Nodo final
  {
    id: "16",
    type: "special",
    position: { x: 1150, y: 300 },
    data: {
      label: "Fin",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-red-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      isVisited: false,
    },
  },
]

// Conexiones reorganizadas para flujo de izquierda a derecha
const originalEdges = [
  // Conexiones desde Inicio
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "smoothstep",
  },
  {
    id: "e1-19",
    source: "1",
    target: "19",
    animated: true,
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "smoothstep",
  },
  {
    id: "e1-5",
    source: "1",
    target: "5",
    animated: true,
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "smoothstep",
  },
  {
    id: "e1-7",
    source: "1",
    target: "7",
    animated: true,
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "smoothstep",
  },
  {
    id: "e1-10",
    source: "1",
    target: "10",
    animated: true,
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "smoothstep",
  },
  {
    id: "e1-17",
    source: "1",
    target: "17",
    animated: true,
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "smoothstep",
  },
  {
    id: "e1-13",
    source: "1",
    target: "13",
    animated: true,
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "smoothstep",
  },

  // Flujo de Administración
  {
    id: "e2-3",
    source: "2",
    target: "3",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },

  // Flujo de Usuarios
  {
    id: "e19-20",
    source: "19",
    target: "20",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },
  {
    id: "e20-4",
    source: "20",
    target: "4",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },

  // Flujo de Postulantes
  {
    id: "e5-6",
    source: "5",
    target: "6",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },

  // Flujo de Evaluación de Méritos
  {
    id: "e7-8",
    source: "7",
    target: "8",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },
  {
    id: "e8-9",
    source: "8",
    target: "9",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },

  // Flujo de Evaluación de Competencias
  {
    id: "e10-11",
    source: "10",
    target: "11",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },
  {
    id: "e11-12",
    source: "11",
    target: "12",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },

  // Flujo de Reportes
  {
    id: "e17-18",
    source: "17",
    target: "18",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },

  // Flujo de Dirección Académica
  {
    id: "e13-14",
    source: "13",
    target: "14",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },
  {
    id: "e14-15",
    source: "14",
    target: "15",
    style: { stroke: "#2196F3", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
    type: "default",
  },

  // Conexiones al nodo final
  {
    id: "e3-16",
    source: "3",
    target: "16",
    style: { stroke: "#C62828", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#C62828" },
    type: "smoothstep",
  },
  {
    id: "e4-16",
    source: "4",
    target: "16",
    style: { stroke: "#C62828", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#C62828" },
    type: "smoothstep",
  },
  {
    id: "e6-16",
    source: "6",
    target: "16",
    style: { stroke: "#C62828", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#C62828" },
    type: "smoothstep",
  },
  {
    id: "e9-16",
    source: "9",
    target: "16",
    style: { stroke: "#C62828", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#C62828" },
    type: "smoothstep",
  },
  {
    id: "e12-16",
    source: "12",
    target: "16",
    style: { stroke: "#C62828", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#C62828" },
    type: "smoothstep",
  },
  {
    id: "e18-16",
    source: "18",
    target: "16",
    style: { stroke: "#C62828", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#C62828" },
    type: "smoothstep",
  },
  {
    id: "e15-16",
    source: "15",
    target: "16",
    style: { stroke: "#C62828", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#C62828" },
    type: "smoothstep",
  },
]

// Conexiones adicionales para mostrar secuencia
const additionalEdges = [
  {
    id: "e3-19",
    source: "3",
    target: "19",
    style: { stroke: "#42A5F5", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#42A5F5" },
    type: "smoothstep",
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    style: { stroke: "#42A5F5", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#42A5F5" },
    type: "smoothstep",
  },
  {
    id: "e6-7",
    source: "6",
    target: "7",
    style: { stroke: "#42A5F5", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#42A5F5" },
    type: "smoothstep",
  },
  {
    id: "e9-10",
    source: "9",
    target: "10",
    style: { stroke: "#42A5F5", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#42A5F5" },
    type: "smoothstep",
  },
  {
    id: "e12-17",
    source: "12",
    target: "17",
    style: { stroke: "#42A5F5", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#42A5F5" },
    type: "smoothstep",
  },
  {
    id: "e18-13",
    source: "18",
    target: "13",
    style: { stroke: "#42A5F5", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#42A5F5" },
    type: "smoothstep",
  },
]

const initialEdges = [...originalEdges, ...additionalEdges]

// Componente principal de Flow que debe estar envuelto en ReactFlowProvider
const FlowWithProvider = ({ visitedModules }) => {
  const { width, height } = useWindowSize()
  const isMobile = width < 768
  const flowContainerRef = useRef(null)

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Secuencia automatizada con los nombres originales y los nuevos nodos
  const sequenceOrder = [
    "Inicio",
    "Lista de materias acefalas",
    "Añadir materia acefala",
    "Lista Usuarios",
    "Añadir Usuario",
    "Asignar roles y permisos",
    "Postulaciones",
    "Visualizar historial de registro y documentacion",
    "Comité de Evaluación",
    "Gestión de la documentación concurso de méritos",
    "Registrar puntos de evaluación",
    "Comité de evaluación",
    "Gestión de la documentación examen de competencias",
    "Registrar puntos de evaluación",
    "Módulo de Reportes",
    "Reporte General de Notas",
    "Firma Digital",
    "Subir documentación",
    "Descargar documentación con Firma Digital",
    "Fin",
  ]

  const [sequenceStarted, setSequenceStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentTask = sequenceOrder[currentIndex]
  const [viewMode, setViewMode] = useState("full") // 'full', 'compact', 'list'
  const reactFlowInstance = useReactFlow()

  // Ajustar el zoom y la posición para adaptarse a diferentes tamaños de pantalla
  useEffect(() => {
    if (reactFlowInstance && flowContainerRef.current) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: isMobile ? 0.1 : 0.2 })
      }, 100)
    }
  }, [reactFlowInstance, isMobile, width, height, viewMode])

  // Efecto para la secuencia automatizada
  useEffect(() => {
    if (sequenceStarted && currentIndex < sequenceOrder.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [sequenceStarted, currentIndex, sequenceOrder.length])

  // Actualizar nodos cuando cambian los módulos visitados o la tarea actual
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "process" || node.type === "special") {
          const isVisited = visitedModules && visitedModules.includes(node.data.label)
          const isActive = node.data.label === currentTask

          return {
            ...node,
            data: {
              ...node.data,
              isVisited,
              isActive,
            },
          }
        }
        return node
      }),
    )
  }, [visitedModules, currentTask, setNodes])

  const startSequence = () => {
    setSequenceStarted(true)
    setCurrentIndex(0)
  }

  // Función para centrar en un nodo específico
  const focusNode = (nodeId) => {
    if (reactFlowInstance) {
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 800 })
      }
    }
  }

  // Función para cambiar el modo de visualización
  const toggleViewMode = () => {
    setViewMode((current) => {
      if (current === "full") return "compact"
      if (current === "compact") return "list"
      return "full"
    })
  }

  // Renderizar la vista de lista para móviles
  const renderListView = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 overflow-y-auto max-h-[60vh]">
        <h3 className="text-lg font-bold text-blue-800 mb-4">Secuencia de Workflow</h3>
        <ul className="space-y-2">
          {sequenceOrder.map((task, index) => {
            const isVisited = visitedModules && visitedModules.includes(task)
            const isActive = task === currentTask
            const nodeId = nodes.find((n) => n.data.label === task)?.id

            return (
              <li
                key={index}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? "bg-yellow-100 border-l-4 border-yellow-500"
                    : isVisited
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => nodeId && focusNode(nodeId)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      isActive ? "bg-yellow-500 text-white" : isVisited ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`${isActive || isVisited ? "font-medium" : ""}`}>{task}</span>
                  {isVisited && (
                    <div className="ml-auto">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-3 md:p-6 rounded-xl shadow-lg">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
        <h1 className="text-xl md:text-3xl font-bold text-blue-900">Workflow - Sistema de Selección Docente</h1>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleViewMode}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md hover:bg-blue-700 transition-colors"
          >
            {viewMode === "full" ? "Vista Compacta" : viewMode === "compact" ? "Vista Lista" : "Vista Completa"}
          </button>

          <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-blue-200">
            <p className="text-sm md:text-base font-semibold text-blue-800">
              <span className="font-bold">Tarea:</span> {currentTask}
            </p>
          </div>
        </div>
      </div>

      {viewMode === "list" && isMobile ? (
        renderListView()
      ) : (
        <div
          ref={flowContainerRef}
          className="h-[60vh] md:h-[800px] border-2 border-blue-300 rounded-xl bg-white shadow-xl overflow-hidden mb-4 md:mb-6"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
            defaultZoom={isMobile ? 0.4 : 0.5}
            attributionPosition="bottom-right"
            fitViewOptions={{ padding: isMobile ? 0.1 : 0.2 }}
          >
            <Controls
              position="bottom-right"
              showInteractive={!isMobile}
              style={{
                marginRight: "10px",
                marginBottom: "10px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                borderRadius: "8px",
                padding: "4px",
              }}
            />
            <Background color="#BBDEFB" gap={20} size={1.5} variant="dots" />
            {!isMobile && (
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === "special") {
                    if (node.data.label === "Inicio") return "#4CAF50"
                    return "#F44336"
                  }
                  if (node.data?.isVisited) return "#81C784"
                  if (node.data?.isActive) return "#FBC02D"
                  return "#90CAF9"
                }}
                nodeStrokeWidth={3}
                maskColor="rgba(255, 255, 255, 0.5)"
                style={{
                  right: 10,
                  top: 10,
                  border: "2px solid #1E88E5",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              />
            )}

            <Panel position="top-left" style={{ margin: "10px" }}>
              <div className="bg-white p-3 rounded-lg shadow-md border border-blue-200">
                <h3 className="text-base md:text-lg font-bold text-blue-800 mb-2">Leyenda</h3>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-green-700 mr-2"></div>
                    <span className="text-xs md:text-sm">Inicio</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-700 mr-2"></div>
                    <span className="text-xs md:text-sm">Fin</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-xs md:text-sm">Visitados</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-xs md:text-sm">Actual</span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      )}

      <div className="flex justify-center">
        {!sequenceStarted && (
          <button
            onClick={startSequence}
            className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-full text-base md:text-lg font-bold shadow-lg hover:from-blue-700 hover:to-blue-900 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Iniciar Secuencia Automática
          </button>
        )}
      </div>
    </div>
  )
}

// Componente Workflow FlowWithProvider con ReactFlowProvider
const Workflow = ({ visitedModules }) => {
  return (
    <ReactFlowProvider>
      <FlowWithProvider visitedModules={visitedModules} />
    </ReactFlowProvider>
  )
}

export default Workflow
