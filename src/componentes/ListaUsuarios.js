import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function Usuarios({ onAddUser, onEditUser }) {
  const [usuarios, setUsuarios] = useState([]);
  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(`${baseURL}/usuarios`);
        setUsuarios(response.data);
      } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener los usuarios. Por favor, inténtalo más tarde.',
        });
      }
    };

    fetchUsuarios();
  }, [baseURL]);

  const handleDeleteUser = async (userId) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto eliminará al usuario permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/usuarios/${userId}`);
        setUsuarios((prev) => prev.filter((usuario) => usuario._id !== userId));
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Usuario eliminado exitosamente.',
        });
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al eliminar el usuario.',
        });
      }
    }
  };

  const handleDownloadExcel = () => {
    if (usuarios.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay usuarios para descargar.',
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      usuarios.map((usuario) => ({
        Nombre: usuario.nombre,
        'Nombre de Usuario': usuario.nombreUsuario,
        Email: usuario.email,
        Carrera: usuario.carrera,
        Administrador: usuario.administrador ? 'Sí' : 'No',
        Activo: usuario.activo ? 'Sí' : 'No',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

    XLSX.writeFile(workbook, 'Usuarios.xlsx');
  };

  const handleDownloadPDF = () => {
    if (usuarios.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin registros',
        text: 'No hay usuarios para descargar.',
      });
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Lista de Usuarios", 14, 20);

    const tableColumn = [
      "Nro",
      "Nombre",
      "Nombre de Usuario",
      "Email",
      "Carrera",
      "Administrador",
      "Activo",
    ];
    const tableRows = [];

    usuarios.forEach((usuario, index) => {
      const rowData = [
        index + 1,
        usuario.nombre,
        usuario.nombreUsuario,
        usuario.email,
        usuario.carrera,
        usuario.administrador ? 'Sí' : 'No',
        usuario.activo ? 'Sí' : 'No',
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save("Usuarios.pdf");
  };

  return (
    <div className="w-full p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Lista de Usuarios</h2>
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
          <button
            onClick={onAddUser}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition"
          >
            + Añadir Usuario
          </button>
        </div>
      </div>

      {/* Vista en tabla para pantallas medianas y superiores */}
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden hidden sm:block">
        <table className="w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-blue-800 text-white uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Nro</th>
              <th className="py-3 px-6 text-left">Nombre</th>
              <th className="py-3 px-6 text-left">Nombre de Usuario</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Carrera</th>
              <th className="py-3 px-6 text-center">Administrador</th>
              <th className="py-3 px-6 text-center">Activo</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {usuarios.map((usuario, index) => (
              <tr key={usuario._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{index + 1}</td>
                <td className="py-3 px-6 text-left">{usuario.nombre}</td>
                <td className="py-3 px-6 text-left">{usuario.nombreUsuario}</td>
                <td className="py-3 px-6 text-left">{usuario.email}</td>
                <td className="py-3 px-6 text-left">{usuario.carrera}</td>
                <td className="py-3 px-6 text-center">
                  <span
                    className={`py-1 px-3 rounded-full text-xs ${
                      usuario.administrador ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                    }`}
                  >
                    {usuario.administrador ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  <span
                    className={`py-1 px-3 rounded-full text-xs ${
                      usuario.activo ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                    }`}
                  >
                    {usuario.activo ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="py-3 px-6 text-center flex justify-center space-x-2">
                  <button
                    onClick={() => onEditUser(usuario)}
                    className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteUser(usuario._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista en tarjetas para pantallas pequeñas */}
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden block sm:hidden">
        {usuarios.map((usuario, index) => (
          <div key={usuario._id} className="border-b border-gray-200 hover:bg-gray-100 p-4">
            <div>
              <span className="font-bold text-gray-800">
                {index + 1}. {usuario.nombre}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-gray-600">
                <strong>Nombre de Usuario:</strong> {usuario.nombreUsuario}
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> {usuario.email}
              </p>
              <p className="text-gray-600">
                <strong>Carrera:</strong> {usuario.carrera}
              </p>
              <p className="text-gray-600">
                <strong>Administrador:</strong>{' '}
                <span
                  className={`py-1 px-2 rounded-full text-xs ${
                    usuario.administrador ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                  }`}
                >
                  {usuario.administrador ? 'Sí' : 'No'}
                </span>
              </p>
              <p className="text-gray-600">
                <strong>Activo:</strong>{' '}
                <span
                  className={`py-1 px-2 rounded-full text-xs ${
                    usuario.activo ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                  }`}
                >
                  {usuario.activo ? 'Sí' : 'No'}
                </span>
              </p>
            </div>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => onEditUser(usuario)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDeleteUser(usuario._id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Usuarios;
