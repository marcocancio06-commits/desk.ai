const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { handleCustomerMessage } = require('./aiClient');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Message handling endpoint
app.post('/api/message', async (req, res) => {
  const { businessId, from, channel, message } = req.body;
  
  if (!message) {
    return res.status(400).json({ 
      error: 'Message is required' 
    });
  }
  
  try {
    const result = await handleCustomerMessage({
      businessId: businessId || 'demo-plumbing',
      from: from || 'unknown',
      channel: channel || 'web',
      message
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ 
      error: 'Failed to process message' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
