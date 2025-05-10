# Sistema de Selección Docente – Unidad Académica Cochabamba (EMI)

Este sistema ha sido desarrollado para gestionar de forma digital y automatizada el proceso de **selección docente** en la **Unidad Académica Cochabamba** de la **Escuela Militar de Ingeniería**, incorporando etapas de postulación, evaluación por méritos, exámenes de conocimientos y competencias, y la integración de **firma digital** mediante Jacobitus, con control de flujo a través de **Camunda Workflow**.

## 🛠️ Tecnologías utilizadas

- **Frontend:** React.js (Create React App)
- **Backend:** Node.js + Express
- **Base de Datos:** MongoDB (Atlas o local)
- **Workflow:** Camunda BPM con Zeebe Broker
- **Firma Digital:** Jacobitus Total (con token físico y validación ADSIB)
- **Despliegue:** Railway (opcionalmente VPS)

## 📦 Instalación rápida

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Por defecto, el sistema estará disponible en:  
🔗 `http://localhost:3000`

> Si está desplegado en producción, acceder mediante:  
🔗 [https://reactfront-production-e186.up.railway.app/](https://reactfront-production-e186.up.railway.app/)

## 🔒 Firma Digital

La firma digital está integrada con **Jacobitus Total**, y requiere el uso de un **token físico con PIN**. Esta funcionalidad es utilizada exclusivamente por el **Director Académico** para validar oficialmente los reportes generados por el sistema.

## 🧭 Estructura del Proyecto

```
/backend           → Servidor Node.js
/frontend          → Aplicación React.js
/.env              → Variables de entorno
README.md          → Documento actual
```

## 📤 Despliegue en Railway

- Repositorio conectado a Railway
- MongoDB como base de datos externa o mediante plugin
- Variables de entorno configuradas (.env)
- Camunda accesible desde la instancia backend

# Guía de Despliegue en VPS – Sistema de Selección Docente (EMI)

Este documento detalla los pasos básicos para desplegar el sistema de selección docente en un VPS utilizando Node.js, React, MongoDB y Camunda.

---

## 🚀 Pasos para el Despliegue en VPS (Ubuntu 22.04 o similar)

### 1. Conexión al VPS

Asegúrese de tener:
- Un VPS activo (Google Cloud, Contabo, DigitalOcean, etc.)
- IP pública y credenciales de acceso SSH

Conéctese al servidor:

```bash
ssh usuario@IP-del-servidor
```

---

### 2. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

---

### 3. Instalar Node.js y npm (v22.11.0)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

---

### 4. Instalar MongoDB (si no se usa Atlas)

```bash
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

---

### 5. Clonar repositorios del proyecto

```bash
git clone https://github.com/usuario/tu-backend.git
git clone https://github.com/usuario/tu-frontend.git
```

---

### 6. Configurar e instalar backend

```bash
cd tu-backend
npm install
```

Cree y configure el archivo `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/seleccion_docente_db
FRONTEND_URL=http://localhost:3000
```

---

### 7. Instalar dependencias del frontend

```bash
cd ../tu-frontend
npm install
```

---

### 8. Instalar y ejecutar Camunda Zeebe (con Docker)

Instalar Docker y Docker Compose:

```bash
sudo apt install -y docker.io docker-compose
```

Crear archivo `docker-compose.yml`:

```yaml
version: '3.7'
services:
  zeebe:
    image: camunda/zeebe:8.4.1
    ports:
      - "26500:26500"
      - "9600:9600"
```

Levantar servicio:

```bash
sudo docker-compose up -d
```

---

### 9. Ejecutar backend

```bash
cd tu-backend
node index.js
```

(O bien usar `pm2` para mantenerlo en ejecución).

---

### 10. Construir y ejecutar frontend

```bash
cd ../tu-frontend
npm run build
npm install -g serve
serve -s build
```

---

### 11. (Opcional) Configurar Nginx para dominio y HTTPS

(Agregar configuración según se requiera).

---

## ✅ ¡Despliegue completo!

El sistema estará activo en los puertos definidos o accesible desde el dominio configurado si se usa Nginx.


## 👤 Autor

**Rodrigo Harold Mendez Prado**  
Escuela Militar de Ingeniería – Unidad Académica Cochabamba  
Trabajo de Grado – Gestión 2025
