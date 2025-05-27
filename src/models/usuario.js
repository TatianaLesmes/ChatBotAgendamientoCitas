const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  documento_identidad: String,
  fecha_nacimiento: Date,
  correo: String,
  telefono: String,
  direccion: String,
  genero: { type: String, enum: ['Masculino', 'Femenino', 'Otro'] },
  lugar_nacimiento: String
});


module.exports = mongoose.model('Usuario', usuarioSchema);
