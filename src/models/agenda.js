const mongoose = require('mongoose');

const agendaSchema = new mongoose.Schema({
  odontologo: { type: mongoose.Schema.Types.ObjectId, ref: 'Odontologo' },
  fecha: { type: Date, required: true },
  hora_inicio: String,
  hora_fin: String,
  disponible: { type: Boolean, default: true }
});

module.exports = mongoose.model('Agenda', agendaSchema);
