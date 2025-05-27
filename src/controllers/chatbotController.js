const Usuario = require('../models/Usuario');
const Odontologo = require('../models/Odontologo');
const TipoCita = require('../models/TipoCita');
const Cita = require('../models/Cita');
const Agenda = require('../models/agenda');

const sessions = {};

function preguntasValidacion(usuario) {
  return [
    {
      pregunta: '¿En qué mes naciste?',
      respuesta: usuario.fecha_nacimiento.toLocaleDateString('es-ES', { month: 'long' }).toLowerCase()
    },
    {
      pregunta: '¿Cuál es tu correo electrónico?',
      respuesta: usuario.correo.toLowerCase()
    },
    {
      pregunta: '¿Cuál es tu edad?',
      respuesta: String(new Date().getFullYear() - new Date(usuario.fecha_nacimiento).getFullYear())
    }
  ];
}



exports.chatbotHandler = async (req, res) => {
  console.log('req:', req.method, 'res:', typeof res.status);
  try {
    const { sessionId, mensaje } = req.body;
    const text = mensaje.trim().toLowerCase();

    if (!sessions[sessionId]) {
      sessions[sessionId] = { step: 0, data: {} };
    }

    const session = sessions[sessionId];

    switch (session.step) {
      case 0:
        if (text.includes('hola') || text.includes('buenos') || text.includes('buenas')) {
          session.step = 1;
          return res.json({
            respuesta: '👋 ¡Bienvenido al servicio de citas odontológicas! Vamos a comenzar. ¿Podrías confirmar si tu número de teléfono es el mismo que usas para agendar citas? (sí/no)'
          });
        } else {
          return res.json({ respuesta: 'Por favor, saluda para iniciar el proceso de agendamiento.' });
        }

      case 1:
        if (text === 'sí' || text === 'si') {
          // Extraer el número sin el código de país
          const numeroTelefonoCompleto = sessionId.split('@')[0]; // 573138212542
          const numeroSinCodigo = numeroTelefonoCompleto.slice(2); // 3138212542

          const usuario = await Usuario.findOne({ telefono: numeroSinCodigo });

          if (!usuario) {
            session.step = 1;
            return res.json({
              respuesta: 'No encontramos un usuario con tu número de teléfono. Por favor regístrate o usa otro número.'
            });
          }

          session.data.usuario = usuario;
          session.step = 2;
          return res.json({
            respuesta: `Gracias ${usuario.nombre}. ¿La cita es para ti? (sí/no)`
          });
        } else if (text === 'no') {
          session.step = 0;
          return res.json({
            respuesta: 'Actualmente solo podemos agendar citas para el número registrado. Lo sentimos.'
          });
        } else {
          return res.json({ respuesta: 'Por favor responde con "sí" o "no".' });
        }

      case 2:
        if (text === 'sí' || text === 'si') {
          const tiposCita = await TipoCita.find();
          if (!tiposCita.length) {
            session.step = 0;
            return res.json({ respuesta: 'No hay tipos de cita disponibles actualmente.' });
          }
          session.data.tiposCita = tiposCita;
          session.step = 3;
          const opciones = tiposCita.map((tc, i) => `${i + 1}. ${tc.nombre}`).join('\n');
          return res.json({ respuesta: `Por favor selecciona el tipo de cita:\n${opciones}` });
        } else if (text === 'no') {
          session.step = 0;
          return res.json({ respuesta: 'Por ahora solo podemos agendar citas para el titular del número. Intenta más tarde.' });
        } else {
          return res.json({ respuesta: 'Por favor responde con "sí" o "no".' });
        }

      case 3:
        const opcion = parseInt(text);
        if (isNaN(opcion) || opcion < 1 || opcion > session.data.tiposCita.length) {
          return res.json({ respuesta: 'Selecciona una opción válida del menú.' });
        }
        session.data.tipoCita = session.data.tiposCita[opcion - 1];
        session.data.preguntas = preguntasValidacion(session.data.usuario);
        session.data.preguntaActual = 0;
        session.data.fallos = 0;
        session.step = 4;
        return res.json({ respuesta: `Para confirmar tu identidad, responde: ${session.data.preguntas[0].pregunta}` });

      case 4:
        const actual = session.data.preguntas[session.data.preguntaActual];
        if (text.includes(actual.respuesta.toLowerCase())) {
          session.data.preguntaActual++;
          if (session.data.preguntaActual >= 2) {
            const odontologos = await Odontologo.find({ especialidad: session.data.tipoCita.nombre });
            if (!odontologos.length) {
              session.step = 0;
              return res.json({ respuesta: 'No hay odontólogos disponibles para este tipo de cita.' });
            }
            session.data.odontologos = odontologos;
            session.step = 5;
            const listaOdonto = odontologos.map((o, i) => `${i + 1}. Dr(a). ${o.nombre}`).join('\n');
            return res.json({ respuesta: `Identidad confirmada. Selecciona el odontólogo:\n${listaOdonto}` });
          } else {
            return res.json({ respuesta: `Correcto. Ahora responde: ${session.data.preguntas[session.data.preguntaActual].pregunta}` });
          }
        } else {
          session.data.fallos++;
          if (session.data.fallos >= 2) {
            session.step = 0;
            return res.json({ respuesta: 'No pudimos confirmar tu identidad. Por favor inicia de nuevo.' });
          } else {
            return res.json({ respuesta: `Respuesta incorrecta. Intenta nuevamente: ${actual.pregunta}` });
          }
        }

      case 5:
        const idx = parseInt(text);
        if (isNaN(idx) || idx < 1 || idx > session.data.odontologos.length) {
          return res.json({ respuesta: 'Selecciona un odontólogo válido.' });
        }
        session.data.odontologo = session.data.odontologos[idx - 1];
        
        console.log('🔎 Buscando agendas para odontólogo:', session.data.odontologo._id);

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Asegura que es desde el inicio del día

        const agendas = await Agenda.find({ 
        odontologo: session.data.odontologo._id, 
        disponible: true,
        fecha: { $gte: today }
      });
        console.log('✅ Agendas encontradas:', agendas);
        if (!agendas.length) {
          session.step = 0;
          return res.json({ respuesta: 'No hay fechas disponibles con este odontólogo.' });
        }
        session.data.agendas = agendas;
        session.step = 6;
        const opcionesFecha = agendas.map((a, i) => `${i + 1}. ${a.fecha.toISOString().slice(0, 10)}`).join('\n');
        return res.json({ respuesta: `Selecciona una fecha:\n${opcionesFecha}` });

      case 6:
        const index = parseInt(text);
        if (isNaN(index) || index < 1 || index > session.data.agendas.length) {
          return res.json({ respuesta: 'Selecciona una fecha válida.' });
        }
        session.data.agenda = session.data.agendas[index - 1];
        session.step = 7;
        return res.json({
          respuesta: `¿Confirmas tu cita para el ${session.data.agenda.fecha.toISOString().slice(0, 10)} con el Dr(a). ${session.data.odontologo.nombre}? (sí/no)`
        });

      case 7:
        if (text === 'sí' || text === 'si') {
        try {
          const cita = new Cita({
            usuario: session.data.usuario._id,
            odontologo: session.data.odontologo._id,
            tipoCita: session.data.tipoCita._id,
            fecha: session.data.agenda.fecha,
            estado: 'Agendada'
          });
          await cita.save();
          await Agenda.findByIdAndUpdate(session.data.agenda._id, { disponible: false });
          session.step = 0;
          return res.json({ respuesta: '🎉 Cita agendada exitosamente. ¡Gracias por usar nuestro servicio!' });
       } catch (error) {
      console.error('Error guardando cita:', error);
      return res.status(500).json({ respuesta: '⚠️ No se pudo agendar la cita, intenta de nuevo.' });
    }
        } else if (text === 'no') {
          session.step = 0;
          return res.json({ respuesta: 'Cita cancelada. Puedes comenzar de nuevo cuando lo desees.' });
        } else {
          return res.json({ respuesta: 'Por favor responde con "sí" o "no".' });
        }

      default:
        session.step = 0;
        return res.json({ respuesta: 'No entendí tu mensaje. Por favor saluda para iniciar.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ respuesta: '⚠️ Error interno del servidor.' });
  }
};



