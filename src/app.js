require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const chatbotRoutes = require('./routes/chatbotRoutes');


const app = express();


// Conectar a la base de datos
connectDB();

// Middlewares
app.use(bodyParser.json());

// Rutas
app.use('/api', chatbotRoutes);

// Servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
