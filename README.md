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
🔗 [https://selecciondocenteemi.up.railway.app](https://selecciondocenteemi.up.railway.app)

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

## 👤 Autor

**Rodrigo Harold Mendez Prado**  
Escuela Militar de Ingeniería – Unidad Académica Cochabamba  
Trabajo de Grado – Gestión 2025
