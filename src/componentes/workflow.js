// componentes/workflow.js
import React, { useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckCircleIcon } from '@heroicons/react/24/outline'; // Ícono para marcar nodos visitados

const initialNodes = [
  { id: '1', type: 'input', position: { x: 50, y: 50 }, data: { label: 'Inicio' } },
  { id: '2', position: { x: 250, y: 50 }, data: { label: 'Unidad de Evaluación y Acreditación' } },
  { id: '3', position: { x: 450, y: 50 }, data: { label: 'Gestión de la documentación' } },
  { id: '4', position: { x: 650, y: 50 }, data: { label: 'Asignar roles y permisos' } },
  { id: '5', position: { x: 250, y: 150 }, data: { label: 'Postulante' } },
  { id: '6', position: { x: 450, y: 150 }, data: { label: 'Subir Documentación' } },
  { id: '7', position: { x: 250, y: 250 }, data: { label: 'Comité de Evaluación' } },
  { id: '8', position: { x: 450, y: 250 }, data: { label: 'Gestión de la documentación concurso de méritos' } },
  { id: '9', position: { x: 650, y: 250 }, data: { label: 'Registrar puntos de evaluación' } },
  { id: '10', position: { x: 250, y: 350 }, data: { label: 'Comité de evaluación' } },
  { id: '11', position: { x: 450, y: 350 }, data: { label: 'Gestión de la documentación examen de competencias' } },
  { id: '12', position: { x: 650, y: 350 }, data: { label: 'Registrar puntos de evaluación' } },
  { id: '13', position: { x: 250, y: 450 }, data: { label: 'Director de la unidad académica' } },
  { id: '14', position: { x: 450, y: 450 }, data: { label: 'Subir documentación' } },
  { id: '15', position: { x: 650, y: 450 }, data: { label: 'Descargar documentación con Firma Digital' } },
  { id: '16', type: 'output', position: { x: 850, y: 250 }, data: { label: 'Fin' } },
];

const originalEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-3', source: '2', target: '3', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-4', source: '3', target: '4', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-5', source: '1', target: '5', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e5-6', source: '5', target: '6', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-7', source: '1', target: '7', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e7-8', source: '7', target: '8', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e8-9', source: '8', target: '9', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-10', source: '1', target: '10', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e10-11', source: '10', target: '11', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e11-12', source: '11', target: '12', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-13', source: '1', target: '13', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e13-14', source: '13', target: '14', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e14-15', source: '14', target: '15', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e9-16', source: '9', target: '16', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e12-16', source: '12', target: '16', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e15-16', source: '15', target: '16', markerEnd: { type: MarkerType.ArrowClosed } },
];

const additionalEdges = [
  { id: 'e4-5', source: '4', target: '5', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e6-7_seq', source: '6', target: '7', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e9-13_seq', source: '9', target: '13', markerEnd: { type: MarkerType.ArrowClosed } },
];

const initialEdges = [...originalEdges, ...additionalEdges];

const Workflow = ({ visitedModules }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Secuencia automatizada (ejemplo)
  const sequenceOrder = [
    'Inicio',
    'Unidad de Evaluación y Acreditación',
    'Gestión de la documentación',
    'Asignar roles y permisos',
    'Postulante',
    'Subir Documentación',
    'Comité de Evaluación',
    'Gestión de la documentación concurso de méritos',
    'Registrar puntos de evaluación',
    'Comité de evaluación',
    'Gestión de la documentación examen de competencias',
    'Registrar puntos de evaluación',
    'Director de la unidad académica',
    'Subir documentación',
    'Descargar documentación con Firma Digital',
    'Fin'
  ];

  const [sequenceStarted, setSequenceStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTask = sequenceOrder[currentIndex];

  useEffect(() => {
    if (sequenceStarted && currentIndex < sequenceOrder.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sequenceStarted, currentIndex, sequenceOrder.length]);

  // Función para definir el estilo de cada nodo según su estado
  // Se mantiene el estilo especial para "Inicio", mientras que "Fin" se trata como un nodo por defecto (celeste)
  const getNodeStyle = (label, isVisited, isActive) => {
    if (label === 'Inicio') {
      return {
        background: '#81C784', // Verde suave para Inicio
        border: '4px solid #388E3C',
      };
    }
    if (isVisited) {
      return {
        background: '#A5D6A7', // Verde cuando está marcado
        border: '4px solid #4CAF50',
      };
    }
    if (isActive) {
      return {
        background: '#FFF9C4',
        border: '4px solid #FBC02D',
      };
    }
    // Por defecto (incluye "Fin" sin marcar, quedando celeste)
    return {
      background: '#BBDEFB',
      border: '3px solid #2196F3',
    };
  };

  // Aplicamos estilos a cada nodo según su estado
  const styledNodes = nodes.map(node => {
    const isVisited = visitedModules && visitedModules.includes(node.data.label);
    const isActive = node.data.label === currentTask;
    const baseStyle = getNodeStyle(node.data.label, isVisited, isActive);

    return {
      ...node,
      style: {
        ...baseStyle,
        borderRadius: '12px',
        padding: '12px',
        fontWeight: 'bold',
        boxShadow: isVisited || isActive 
          ? '0 6px 15px rgba(0, 0, 0, 0.3)' 
          : '0 3px 10px rgba(0, 0, 0, 0.15)',
        color: '#000',
      },
      data: {
        ...node.data,
        label: (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {node.data.label}
            {isVisited && (
              <CheckCircleIcon className="w-7 h-7 text-green-700 ml-2" />
            )}
          </div>
        ),
      },
    };
  });

  // Se regresa el diseño anterior de las flechas (marcador cerrado)
  const styledEdges = edges.map(edge => ({
    ...edge,
    style: { stroke: '#2196F3', strokeWidth: 2 },
    markerEnd: { ...edge.markerEnd, type: MarkerType.ArrowClosed, color: '#2196F3' },
  }));

  const startSequence = () => {
    setSequenceStarted(true);
    setCurrentIndex(0);
  };

  return (
    <div
      style={{
        height: '100vh',
        padding: '20px',
        fontFamily: 'Helvetica, sans-serif',
        background: 'linear-gradient(to bottom, #E3F2FD, #90CAF9)', // Fondo degradado en tonos azules
      }}
    >
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>
        Workflow - Automatización Secuencial
      </h1>
      <p style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px' }}>
        <strong>Tarea Actual:</strong> {currentTask}
      </p>

      <div
        style={{
          height: 500,
          border: '2px solid #2196F3',
          borderRadius: '12px',
          background: '#fff',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        }}
      >
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
          <Background color="#AAA" gap={16} />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'input') return '#81C784';  // Verde para "Inicio"
              if (node.type === 'output') return '#BBDEFB';  // "Fin" sin marcar (celeste)
              return '#BBDEFB'; // Celeste para nodos intermedios
            }}
            nodeStrokeWidth={3}
          />
        </ReactFlow>
      </div>

      <div style={{ textAlign: 'center' }}>
        {!sequenceStarted && (
          <button
            onClick={startSequence}
            style={{
              padding: '14px 28px',
              backgroundColor: '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
              transition: 'background 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1976D2')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2196F3')}
          >
            Iniciar Secuencia
          </button>
        )}
      </div>
    </div>
  );
};

export default Workflow;
