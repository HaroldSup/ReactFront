// login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../images/logo.png';
import backgroundImage from '../images/EMI.jpg';

function Login() {
  // Renombramos la variable "email" a "nombreUsuario" para mayor coherencia
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const baseURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_urlbacklocalhost
      : process.env.REACT_APP_urlback;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${baseURL}/auth/login`, {
        nombreUsuario,
        password,
      });
      // Guardamos token e información del usuario en localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setError('');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error de conexión');
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="relative">
        <div className="absolute bg-yellow-400 w-80 h-96 transform -rotate-6 -translate-x-4 -translate-y-4 rounded-2xl shadow-lg"></div>
        <div className="absolute bg-blue-700 w-80 h-96 transform -rotate-3 rounded-2xl shadow-lg"></div>

        <div className="relative w-full max-w-md p-8 bg-white bg-opacity-90 rounded-2xl shadow-2xl backdrop-blur-lg transform transition-transform duration-500 hover:scale-105 z-10">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo EMI" className="w-24 h-auto animate-bounce" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-blue-800 mb-6 tracking-wide">
            INICIAR SESIÓN
          </h2>
          {error && (
            <p className="text-red-500 font-semibold text-center mb-4 animate-shake">
              {error}
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-left">
              <label htmlFor="nombreUsuario" className="block text-sm font-medium text-gray-600">
                Nombre de Usuario:
              </label>
              <input
                id="nombreUsuario"
                type="text"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Ingrese su nombre de usuario"
                required
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition duration-200"
              />
            </div>
            <div className="text-left">
              <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                Contraseña:
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                required
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition duration-200"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 mt-6 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-gradient-to-r hover:from-green-700 hover:to-green-600 transition duration-300 transform hover:-translate-y-1"
            >
              Ingresar
            </button>
          </form>
          <button
            onClick={() => navigate('/registro-postulacion')}
            className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-gradient-to-r hover:from-blue-700 hover:to-blue-600 transition duration-300 transform hover:-translate-y-1"
          >
            Postulación Docente
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
