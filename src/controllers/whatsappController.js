const axios = require('axios');
const chatbotController = require('./chatbotController');

exports.handleMessage = async (req, res) => {
    console.log('📩 Webhook recibido:', JSON.stringify(req.body, null, 2));
  try {
    const messageData = req.body;

    const from = messageData.data?.from;
    const mensaje = messageData.data?.body;

    if (!from || !mensaje) {
        console.log("❌ No se encontró 'from' o 'mensaje' en los datos");
      return res.sendStatus(400);
    }

    // Simulamos una petición interna al chatbotController
    const fakeReq = { body: { sessionId: from, mensaje } };
    const fakeRes = {
      json: ({ respuesta }) => {
         console.log(`💬 Respuesta a enviar: "${respuesta}"`);
        // Enviamos la respuesta a WhatsApp usando UltraMsg
        axios.post(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`, {
          token: process.env.ULTRAMSG_TOKEN,
          to:  from.replace('@c.us', ''),
          body: respuesta
        })
        .then(() => console.log(`✅ Mensaje enviado a ${from}`))
        .catch(err => console.error('❌ Error al enviar mensaje:', err));
      }
    };

    await chatbotController.chatbotHandler(fakeReq, fakeRes);
    res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error en el webhook:', error);
    res.sendStatus(500);
  }
};
