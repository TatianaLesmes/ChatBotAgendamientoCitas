const mongoose = require('mongoose');

const tipoCitaSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String
});

module.exports = mongoose.model('TipoCita', tipoCitaSchema);
