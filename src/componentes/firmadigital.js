import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useDropzone } from 'react-dropzone';
import { FaFilePdf, FaDownload, FaSyncAlt, FaRocket } from 'react-icons/fa';

const DocumentManager = () => {
  const [file, setFile] = useState(null);
  const [signedFiles, setSignedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // URL base según entorno
  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  // Configuración de dropzone para drag & drop de PDFs
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'application/pdf'
  });

  // Función para subir el archivo
  const handleUpload = async () => {
    if (!file) {
      Swal.fire({ icon: 'warning', title: 'No se seleccionó archivo', text: 'Seleccione un archivo PDF.' });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${baseURL}/api/upload-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: progressEvent => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      Swal.fire({ icon: 'success', title: 'Archivo subido', text: response.data.message, timer: 1500, showConfirmButton: false });
      setFile(null);
      fetchSignedDocuments();
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error al subir', text: 'Ocurrió un error al subir el archivo.' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Función para abrir Jacobitus
  const handleOpenJacobitus = async () => {
    setIsOpening(true);
    try {
      const response = await axios.post(`${baseURL}/api/open-jacobitus`);
      Swal.fire({ icon: 'success', title: 'Jacobitus abierto', text: response.data.message, timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo abrir Jacobitus.' });
    } finally {
      setIsOpening(false);
    }
  };

  // Obtener documentos firmados
  const fetchSignedDocuments = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/signed-documents`);
      setSignedFiles(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron obtener los documentos firmados.' });
    }
  };

  useEffect(() => {
    fetchSignedDocuments();
  }, []);

  // Filtrar documentos por búsqueda
  const filteredFiles = signedFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen text-gray-900 transition-colors">
      <h2 className="text-2xl font-bold mb-6">Gestión de Documentos y Firma Digital</h2>

      {/* Sección de carga de archivo con drag & drop */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Subir archivo PDF</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Suelta el archivo aquí...</p>
          ) : (
            <p>Arrastra y suelta un archivo PDF aquí, o haz clic para seleccionar uno.</p>
          )}
          {file && (
            <p className="mt-2 text-green-600">Archivo seleccionado: {file.name}</p>
          )}
        </div>
        {isUploading && (
          <div className="w-full bg-gray-300 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-md mr-2 transform hover:scale-105"
        >
          {isUploading ? 'Subiendo...' : 'Subir archivo'}
        </button>
      </div>

      {/* Sección para abrir Jacobitus */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Abrir Jacobitus</h3>
        <button
          onClick={handleOpenJacobitus}
          disabled={isOpening}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 transition-colors text-white rounded-md flex items-center space-x-2 transform hover:scale-105"
        >
          <FaRocket />
          <span>{isOpening ? 'Abriendo...' : 'Abrir Jacobitus'}</span>
        </button>
      </div>

      {/* Sección de documentos firmados */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h3 className="text-xl font-semibold mb-2 sm:mb-0">Documentos Firmados</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Buscar documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchSignedDocuments}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-md flex items-center space-x-1 transform hover:scale-105"
            >
              <FaSyncAlt />
              <span>Refrescar</span>
            </button>
          </div>
        </div>
        {filteredFiles.length === 0 ? (
          <p>No hay documentos firmados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between border border-gray-300 p-4 rounded-md">
                <div className="flex items-center space-x-3">
                  <FaFilePdf className="text-red-500" size={24} />
                  <a
                    href={`${baseURL}${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {file.name}
                  </a>
                </div>
                <a
                  href={`${baseURL}${file.url}`}
                  download
                  className="text-green-600 hover:text-green-700 transition-colors"
                >
                  <FaDownload size={20} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
