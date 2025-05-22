"use client"

import { useState, useEffect } from "react"

// Si no tienes lucide-react, puedes eliminar estas importaciones y usar iconos simples o texto

const DocumentManager = () => {
  const [activeTab, setActiveTab] = useState("tutorial")
  const [signedFiles, setSignedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  // Cargar archivos guardados al iniciar
  useEffect(() => {
    const savedFiles = localStorage.getItem("signedFiles")
    if (savedFiles) {
      try {
        setSignedFiles(JSON.parse(savedFiles))
      } catch (error) {
        console.error("Error al cargar archivos guardados:", error)
      }
    }
  }, [])

  // Guardar archivos cuando cambian
  useEffect(() => {
    if (signedFiles.length > 0) {
      localStorage.setItem("signedFiles", JSON.stringify(signedFiles))
    }
  }, [signedFiles])

  // Función para cambiar de pestaña
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  // Función para manejar la subida de archivos
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validar que sea un PDF
    if (file.type !== "application/pdf") {
      window.alert("Solo se permiten archivos PDF")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simular progreso de carga
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 100)

    // Simular subida al servidor
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)

      // Crear URL para el archivo (en una implementación real, esto vendría del servidor)
      const fileUrl = URL.createObjectURL(file)

      // Añadir archivo a la lista
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        date: new Date().toLocaleDateString(),
      }

      setSignedFiles((prev) => [newFile, ...prev])
      setIsUploading(false)
      setUploadProgress(0)
    }, 2000)
  }

  // Función para eliminar un archivo
  const handleDeleteFile = (id) => {
    // Usar window.confirm para evitar el error de ESLint
    if (window.confirm("¿Está seguro que desea eliminar este archivo?")) {
      setSignedFiles((prev) => {
        const newFiles = prev.filter((file) => file.id !== id)
        localStorage.setItem("signedFiles", JSON.stringify(newFiles))
        return newFiles
      })
    }
  }

  // Filtrar archivos por término de búsqueda
  const filteredFiles = signedFiles.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Componente simple de acordeón
  const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <div className="border-b border-gray-200 py-4">
        <button
          className="flex justify-between items-center w-full text-left font-medium"
          onClick={() => setIsOpen(!isOpen)}
        >
          {question}
          <span>{isOpen ? "−" : "+"}</span>
        </button>
        {isOpen && <div className="mt-2 text-gray-600">{answer}</div>}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Sistema de Firma Digital</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Guía completa para firmar documentos digitalmente utilizando Jacobitus Total y token
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "tutorial" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("tutorial")}
        >
          Tutorial de Firma
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "faq" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("faq")}
        >
          Preguntas Frecuentes
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "resources" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("resources")}
        >
          Recursos
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "files" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleTabChange("files")}
        >
          Archivos Firmados
        </button>
      </div>

      {/* Tutorial Tab Content */}
      {activeTab === "tutorial" && (
        <div className="space-y-6">
          {/* Alerta */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {/* Puedes reemplazar esto con un ícono simple o texto */}
                <span className="text-amber-600">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-amber-800 font-medium">Importante</h3>
                <div className="text-amber-700 mt-1">
                  Para firmar documentos digitalmente, necesitará tener instalado Jacobitus Total y un token
                  correctamente configurado. Siga las instrucciones a continuación.
                </div>
              </div>
            </div>
          </div>

          {/* Paso 1 */}
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="text-green-600 mr-2">💻</span>
                Paso 1: Instalación de Jacobitus Total
              </h3>
              <p className="text-gray-600">Descargue e instale la aplicación oficial de ADSIB para firmar documentos</p>
            </div>
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-3">
                <li>Visite el sitio oficial de ADSIB para descargar Jacobitus Total</li>
                <li>Seleccione la versión correspondiente a su sistema operativo (Windows, Linux o macOS)</li>
                <li>Ejecute el instalador y siga las instrucciones en pantalla</li>
                <li>Verifique que la instalación se haya completado correctamente</li>
              </ol>
              <div className="flex justify-center mt-4">
                <a
                  href="https://www.firmadigital.bo/herramientas/jacobitus-escritorio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <span className="mr-2">⬇️</span>
                  Descargar Jacobitus Total
                  <span className="ml-2">↗️</span>
                </a>
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="text-blue-600 mr-2">🔑</span>
                Paso 2: Configuración del Token
              </h3>
              <p className="text-gray-600">Prepare su token para ser utilizado con Jacobitus Total</p>
            </div>
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-3">
                <li>Conecte su token a un puerto USB de su computadora</li>
                <li>Espere a que el sistema operativo reconozca el dispositivo</li>
                <li>Si es la primera vez que lo utiliza, es posible que necesite instalar los controladores</li>
                <li>Verifique que el token sea reconocido correctamente (la luz del token debe encenderse)</li>
              </ol>
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
                <p className="text-blue-800 font-medium flex items-center">
                  <span className="mr-2">ℹ️</span>
                  Recuerde que su token debe estar previamente habilitado por ADSIB
                </p>
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="text-purple-600 mr-2">📄</span>
                Paso 3: Proceso de Firma Digital
              </h3>
              <p className="text-gray-600">Siga estos pasos para firmar su documento PDF</p>
            </div>
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-3">
                <li>Abra la aplicación Jacobitus Total en su computadora</li>
                <li>Seleccione la opción "Firmar documento" en el menú principal</li>
                <li>Haga clic en "Seleccionar archivo" y busque el documento PDF que desea firmar</li>
                <li>Configure las opciones de firma según sus preferencias (posición, apariencia, etc.)</li>
                <li>Haga clic en el botón "Firmar" para iniciar el proceso</li>
                <li>Cuando se le solicite, ingrese el PIN de su token</li>
                <li>Espere a que se complete el proceso de firma</li>
                <li>Guarde el documento firmado en la ubicación deseada</li>
              </ol>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    Recomendaciones
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Utilice nombres descriptivos para sus archivos</li>
                    <li>Verifique que el documento esté correctamente firmado</li>
                    <li>Guarde una copia de seguridad de sus documentos firmados</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center">
                    <span className="text-red-600 mr-2">⚠️</span>
                    Advertencias
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                    <li>No desconecte el token durante el proceso de firma</li>
                    <li>No cierre la aplicación hasta que el proceso termine</li>
                    <li>No comparta su PIN con otras personas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 4 */}
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="text-indigo-600 mr-2">💾</span>
                Paso 4: Verificación y Uso del Documento Firmado
              </h3>
              <p className="text-gray-600">Cómo verificar y utilizar su documento firmado digitalmente</p>
            </div>
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-3">
                <li>Abra el documento firmado con Adobe Reader u otro visor de PDF</li>
                <li>Verifique que aparezca el sello de firma digital en el documento</li>
                <li>Para verificar la validez de la firma, haga clic sobre el sello de firma</li>
                <li>Debe aparecer información sobre la validez de la firma y el certificado</li>
                <li>El documento firmado ya está listo para ser compartido o enviado oficialmente</li>
              </ol>
              <div className="bg-green-50 p-4 rounded-md border border-green-200 mt-4">
                <p className="text-green-800 font-medium flex items-center">
                  <span className="mr-2">✅</span>
                  Un documento firmado digitalmente tiene la misma validez legal que un documento firmado a mano
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Tab Content */}
      {activeTab === "faq" && (
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Preguntas Frecuentes</h3>
            <p className="text-gray-600">Respuestas a las dudas más comunes sobre la firma digital</p>
          </div>
          <div className="space-y-2">
            <FaqItem
              question="¿Qué es Jacobitus Total?"
              answer="Jacobitus Total es una aplicación desarrollada por ADSIB (Agencia para el Desarrollo de la Sociedad de la Información en Bolivia) que permite firmar digitalmente documentos PDF utilizando certificados digitales emitidos por la Entidad Certificadora del Estado."
            />
            <FaqItem
              question="¿Cómo obtengo un token?"
              answer="Los tokens son proporcionados por ADSIB al momento de solicitar su certificado digital. Debe acudir personalmente a las oficinas de ADSIB con su documentación para obtener tanto el certificado digital como el token físico. Puede encontrar más información en el sitio web oficial de ADSIB."
            />
            <FaqItem
              question="¿Qué hago si olvidé el PIN de mi token?"
              answer="Si olvidó el PIN de su token, deberá comunicarse directamente con ADSIB. Tenga en cuenta que después de tres intentos fallidos, el token se bloqueará por motivos de seguridad y deberá ser desbloqueado por personal autorizado de ADSIB."
            />
            <FaqItem
              question="¿Los documentos firmados son válidos legalmente?"
              answer="Sí, los documentos firmados digitalmente con certificados emitidos por la Entidad Certificadora del Estado tienen plena validez legal según la Ley N° 164 (Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación) y el Decreto Supremo N° 1793. Estos documentos tienen la misma validez jurídica que un documento firmado a mano."
            />
            <FaqItem
              question="¿Jacobitus funciona en todos los sistemas operativos?"
              answer="Sí, Jacobitus Total está disponible para Windows, Linux y macOS. Sin embargo, es importante verificar los requisitos específicos para cada sistema operativo en el sitio web oficial de ADSIB antes de la instalación."
            />
            <FaqItem
              question="¿Puedo firmar cualquier tipo de documento?"
              answer="Jacobitus Total está diseñado principalmente para firmar documentos en formato PDF. Si necesita firmar otros tipos de documentos, deberá convertirlos primero a formato PDF antes de utilizar Jacobitus para firmarlos digitalmente."
            />
          </div>
        </div>
      )}

      {/* Resources Tab Content */}
      {activeTab === "resources" && (
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Recursos y Enlaces Útiles</h3>
            <p className="text-gray-600">Material adicional para ayudarle con el proceso de firma digital</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-2 flex items-center">
                <span className="text-green-600 mr-2">⬇️</span>
                Software Oficial
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Descargue las herramientas oficiales necesarias para la firma digital
              </p>
              <a
                href="https://www.firmadigital.bo/herramientas/jacobitus-escritorio/"
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-300 rounded-md px-4 py-2 text-center hover:bg-gray-50"
              >
                Descargar Jacobitus Total
              </a>
            </div>

            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-2 flex items-center">
                <span className="text-blue-600 mr-2">📝</span>
                Términos y Condiciones
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Consulte los términos y condiciones del servicio de firma digital
              </p>
              <a
                href="https://www.firmadigital.bo/quienes-somos/terminos-y-condiciones-del-servicio/"
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-300 rounded-md px-4 py-2 text-center hover:bg-gray-50"
              >
                Ver Términos y Condiciones
              </a>
            </div>

            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-2 flex items-center">
                <span className="text-purple-600 mr-2">❓</span>
                Soporte Técnico
              </h3>
              <p className="text-gray-600 mb-4 text-sm">Obtenga ayuda técnica para resolver problemas con Jacobitus</p>
              <a
                href="https://www.firmadigital.bo/soporte-tecnico/tutoriales/"
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-300 rounded-md px-4 py-2 text-center hover:bg-gray-50"
              >
                Centro de Soporte ADSIB
              </a>
            </div>

            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-2 flex items-center">
                <span className="text-amber-600 mr-2">📚</span>
                Tutoriales y Manuales
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Aprenda cómo obtener un certificado de firma digital con token
              </p>
              <a
                href="https://firmadigital.bo//servicios/como-obtener-un-certificado-de-firma-digital-con-token/"
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-300 rounded-md px-4 py-2 text-center hover:bg-gray-50"
              >
                Obtener Certificado Digital
              </a>
            </div>

            <div className="col-span-1 md:col-span-2 border rounded-lg p-4 hover:shadow-md transition-shadow bg-green-50 border-green-200 mt-4">
              <h3 className="font-medium text-lg mb-2 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Validador de Documentos Firmados
              </h3>
              <p className="text-gray-700 mb-4">
                Verifique la validez de documentos firmados digitalmente subiendo el archivo PDF a la plataforma oficial
                de validación de ADSIB.
              </p>
              <div className="flex justify-center">
                <a
                  href="https://validar.firmadigital.bo/#/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md flex items-center font-medium"
                >
                  <span className="mr-2">🔍</span>
                  Validar Documento Firmado
                  <span className="ml-2">↗️</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-lg mb-3">Tutoriales</h3>
            <div className="grid grid-cols-1 gap-4">
              <a
                href="https://firmadigital.bo/soporte-tecnico/tutoriales/jacobitus/instalacion-de-la-aplicacion-jacobitus-de-escritorio-windows/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white rounded border hover:shadow-sm transition-shadow"
              >
                <div className="bg-purple-100 p-2 rounded">
                  <span className="text-purple-600">📹</span>
                </div>
                <div>
                  <p className="font-medium">Instalación de Jacobitus y firma de documentos</p>
                  <p className="text-sm text-gray-500">Guía completa paso a paso</p>
                </div>
                <span className="ml-auto text-gray-400">→</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Archivos Firmados Tab Content */}
      {activeTab === "files" && (
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Archivos Firmados</h3>
            <p className="text-gray-600">Gestione sus documentos PDF firmados digitalmente</p>
          </div>

          {/* Sección de carga de archivos */}
          <div className="mb-8 p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-center mb-4">
              <h4 className="font-medium text-lg mb-2">Subir documento firmado</h4>
              <p className="text-gray-600 text-sm mb-4">
                Seleccione un archivo PDF firmado digitalmente para almacenarlo en el sistema
              </p>
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
              >
                <span className="mr-2">📤</span>
                Seleccionar archivo PDF
                <input
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">Subiendo archivo... {uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Lista de archivos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-lg">Documentos almacenados</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  className="pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No hay documentos firmados almacenados</p>
                <p className="text-sm text-gray-400 mt-1">Los documentos que suba aparecerán en esta sección</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Nombre del archivo
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Fecha
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tamaño
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-red-500 mr-2">📄</span>
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{file.date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver documento"
                            >
                              👁️
                            </a>
                            <a
                              href={file.url}
                              download={file.name}
                              className="text-green-600 hover:text-green-900"
                              title="Descargar"
                            >
                              ⬇️
                            </a>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              <p>
                <strong>Nota:</strong> Los archivos se almacenan localmente en su navegador. Para una solución
                permanente, se recomienda implementar un sistema de almacenamiento en servidor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentManager
