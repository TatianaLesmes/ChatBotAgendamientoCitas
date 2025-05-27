const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  odontologo: { type: mongoose.Schema.Types.ObjectId, ref: 'Odontologo' },
  tipoCita: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoCita' },
  fecha: Date,
  hora: String,
  direccion: String,
  estado: { type: String, enum: ['Agendada', 'Confirmada','Cancelada', 'Completada'], default: 'Agendada' }
});

module.exports = mongoose.model('Cita', citaSchema);
