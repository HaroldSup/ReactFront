"use client"

import { useState, useEffect } from "react"
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "reactflow"
import "reactflow/dist/style.css"

// Nodo personalizado para procesos
const ProcessNode = ({ data }) => {
  return (
    <div
      className={`p-3 rounded-lg shadow-md ${
        data.visited ? "bg-blue-50 border-2 border-blue-500" : "bg-white border border-gray-300"
      }`}
      style={{ width: "200px" }}
    >
      <div className="flex items-center">
        <div className={`p-1.5 rounded-full ${data.visited ? "bg-blue-500 text-white" : "bg-gray-100"} mr-2`}>
          {data.icon}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          {data.description && <div className="text-xs text-gray-500 mt-1">{data.description}</div>}
        </div>
        {data.visited && (
          <div className="w-5 h-5 text-green-600 ml-1 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} style={{ background: "#2196F3" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#2196F3" }} />
    </div>
  )
}

// Nodo personalizado para roles/departamentos
const RoleNode = ({ data }) => {
  return (
    <div className="p-3 rounded-lg shadow-md bg-blue-600 text-white" style={{ width: "200px" }}>
      <div className="flex items-center">
        <div className="p-1.5 rounded-full bg-white text-blue-600 mr-2">{data.icon}</div>
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#fff" }} />
    </div>
  )
}

// Definición de tipos de nodos
const nodeTypes = {
  process: ProcessNode,
  role: RoleNode,
}

const Workflow = ({ visitedModules }) => {
  // Secuencia automatizada
  const sequenceOrder = [
    "Inicio",
    "Unidad de Evaluación y Acreditación",
    "Gestión de la documentación",
    "Asignar roles y permisos",
    "Postulante",
    "Subir Documentación",
    "Comité de Evaluación",
    "Gestión de la documentación concurso de méritos",
    "Registrar puntos de evaluación",
    "Comité de evaluación",
    "Gestión de la documentación examen de competencias",
    "Registrar puntos de evaluación",
    "Director de la unidad académica",
    "Subir documentación",
    "Descargar documentación con Firma Digital",
    "Fin",
  ]

  const [sequenceStarted, setSequenceStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentTask = sequenceOrder[currentIndex]

  // Definición de nodos con mucho más espacio entre ellos
  const initialNodes = [
    // Nodo de inicio - Centrado en la parte superior
    {
      id: "1",
      type: "process",
      position: { x: 400, y: 50 },
      data: {
        label: "Inicio",
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
        visited: true, // Siempre marcado como visitado
      },
    },

    // Roles (carriles) - Con mucho más espacio vertical entre ellos
    {
      id: "role1",
      type: "role",
      position: { x: 50, y: 200 },
      data: {
        label: "Unidad de Evaluación y Acreditación",
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
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
      },
    },
    {
      id: "role2",
      type: "role",
      position: { x: 50, y: 400 },
      data: {
        label: "Postulante",
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
      },
    },
    {
      id: "role3",
      type: "role",
      position: { x: 50, y: 600 },
      data: {
        label: "Comité de Evaluación",
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
      },
    },
    {
      id: "role4",
      type: "role",
      position: { x: 50, y: 800 },
      data: {
        label: "Director de la unidad académica",
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
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
    },

    // Procesos de Unidad de Evaluación - Mucho más espaciados horizontalmente
    {
      id: "2",
      type: "process",
      position: { x: 350, y: 200 },
      data: {
        label: "Gestión de la documentación",
        description: "Preparación de documentos",
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
        visited: false, // No debe estar marcado como visitado
      },
    },
    {
      id: "3",
      type: "process",
      position: { x: 650, y: 200 },
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
        visited: true, // Debe estar marcado como visitado
      },
    },

    // Procesos de Postulante
    {
      id: "5",
      type: "process",
      position: { x: 350, y: 400 },
      data: {
        label: "Subir Documentación",
        description: "Carga de documentos",
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
        visited: true, // Debe estar marcado como visitado
      },
    },

    // Procesos de Comité de Evaluación - Mejor organizados
    {
      id: "7",
      type: "process",
      position: { x: 350, y: 570 },
      data: {
        label: "Gestión documentación concurso de méritos",
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
        visited: false, // No debe estar marcado como visitado
      },
    },
    {
      id: "8",
      type: "process",
      position: { x: 650, y: 570 },
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
        visited: true, // Debe estar marcado como visitado
      },
    },
    {
      id: "9",
      type: "process",
      position: { x: 350, y: 670 },
      data: {
        label: "Gestión documentación examen competencias",
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
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
        visited: false, // No debe estar marcado como visitado
      },
    },
    {
      id: "10",
      type: "process",
      position: { x: 650, y: 670 },
      data: {
        label: "Registrar puntos de evaluación",
        description: "Calificación competencias",
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
        visited: true, // Debe estar marcado como visitado
      },
    },

    // Procesos de Director Académico
    {
      id: "12",
      type: "process",
      position: { x: 350, y: 800 },
      data: {
        label: "Subir documentación",
        description: "Documentación final",
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
        visited: true, // Debe estar marcado como visitado
      },
    },
    {
      id: "13",
      type: "process",
      position: { x: 650, y: 800 },
      data: {
        label: "Descargar con Firma Digital",
        description: "Finalización del proceso",
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
        visited: true, // Debe estar marcado como visitado
      },
    },

    // Nodo de fin - Reposicionado para mejor visibilidad
    {
      id: "16",
      type: "process",
      position: { x: 950, y: 400 },
      data: {
        label: "Fin",
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
        visited: true, // Debe estar marcado como visitado
      },
    },
  ]

  // Conexiones entre nodos - Rediseñadas para evitar superposiciones
  const initialEdges = [
    // Conexiones desde Inicio - Curvas más pronunciadas para evitar superposiciones
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
      id: "e1-5",
      source: "1",
      target: "5",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e1-7",
      source: "1",
      target: "7",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e1-12",
      source: "1",
      target: "12",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },

    // Conexiones de procesos - Usando tipos de conexión diferentes para mejor visualización
    {
      id: "e2-3",
      source: "2",
      target: "3",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "default",
    },
    {
      id: "e3-5",
      source: "3",
      target: "5",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e5-7",
      source: "5",
      target: "7",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e7-8",
      source: "7",
      target: "8",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "default",
    },
    {
      id: "e7-9",
      source: "7",
      target: "9",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e9-10",
      source: "9",
      target: "10",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "default",
    },
    {
      id: "e8-16",
      source: "8",
      target: "16",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e10-16",
      source: "10",
      target: "16",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e8-12",
      source: "8",
      target: "12",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e10-12",
      source: "10",
      target: "12",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
    {
      id: "e12-13",
      source: "12",
      target: "13",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "default",
    },
    {
      id: "e13-16",
      source: "13",
      target: "16",
      style: { stroke: "#2196F3", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2196F3" },
      type: "smoothstep",
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Actualizar nodos cuando cambian los módulos visitados
  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.type === "process" && node.data.label) {
          // Verificar si el nodo debe estar marcado como visitado basado en su ID o etiqueta
          let isVisited = false

          // Nodos específicos que deben estar marcados como visitados según la imagen
          const visitedNodeIds = ["1", "3", "5", "8", "10", "13", "16"]
          const visitedLabels = [
            "Inicio",
            "Asignar roles y permisos",
            "Subir Documentación",
            "Registrar puntos de evaluación",
            "Registrar puntos de evaluación",
            "Descargar con Firma Digital",
            "Fin",
          ]

          // Marcar como visitado si el ID o la etiqueta está en la lista
          if (visitedNodeIds.includes(node.id) || visitedLabels.includes(node.data.label)) {
            isVisited = true
          }

          // Casos especiales para nodos que NO deben estar marcados
          const nonVisitedLabels = [
            "Gestión de la documentación",
            "Gestión documentación concurso de méritos",
            "Gestión documentación examen competencias",
          ]

          if (nonVisitedLabels.includes(node.data.label)) {
            isVisited = false
          }

          return {
            ...node,
            data: {
              ...node.data,
              visited: isVisited,
            },
          }
        }
        return node
      }),
    )
  }, [visitedModules, setNodes])

  // Efecto para la secuencia automatizada
  useEffect(() => {
    if (sequenceStarted && currentIndex < sequenceOrder.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [sequenceStarted, currentIndex, sequenceOrder.length])

  const startSequence = () => {
    setSequenceStarted(true)
    setCurrentIndex(0)
  }

  return (
    <div
      style={{
        height: "100vh",
        padding: "20px",
        fontFamily: "Helvetica, sans-serif",
        background: "linear-gradient(to bottom, #E3F2FD, #90CAF9)",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "10px" }}>Workflow - Automatización Secuencial</h1>
      <p style={{ textAlign: "center", fontSize: "18px", marginBottom: "20px" }}>
        <strong>Tarea Actual:</strong> {currentTask}
      </p>

      <div
        style={{
          height: 900, // Aumentado significativamente para dar más espacio al diagrama
          border: "2px solid #2196F3",
          borderRadius: "12px",
          background: "#fff",
          marginBottom: "20px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          defaultZoom={0.5} // Zoom por defecto reducido para ver todo el diagrama
          fitViewOptions={{ padding: 0.3 }}
        >
          <Controls position="bottom-right" />
          <Background color="#AAA" gap={16} />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "role") return "#1e40af" // Azul oscuro para roles
              if (node.data?.visited) return "#4ade80" // Verde para nodos visitados
              return "#93c5fd" // Azul claro para nodos no visitados
            }}
            nodeStrokeWidth={3}
            position="bottom-left"
          />
        </ReactFlow>
      </div>

      <div style={{ textAlign: "center" }}>
        {!sequenceStarted && (
          <button
            onClick={startSequence}
            style={{
              padding: "14px 28px",
              backgroundColor: "#2196F3",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1976D2")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2196F3")}
          >
            Iniciar Secuencia
          </button>
        )}
      </div>
    </div>
  )
}

export default Workflow
