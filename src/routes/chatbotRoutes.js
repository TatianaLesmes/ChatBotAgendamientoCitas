const express = require('express');
const router = express.Router();

const chatbotController = require('../controllers/chatbotController');
const whatsappController = require('../controllers/whatsappController');

router.post('/chatbot', chatbotController.chatbotHandler);
router.post('/webhook', whatsappController.handleMessage);

module.exports = router;
