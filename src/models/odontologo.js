const mongoose = require('mongoose');

const odontologoSchema = new mongoose.Schema({
  nombre: String,
  especialidad: String,
  correo: String,
  telefono: String
});

module.exports = mongoose.model('Odontologo', odontologoSchema);
