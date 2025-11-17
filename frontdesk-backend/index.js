const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { handleCustomerMessage } = require('./aiClient');
const { upsertLeadFromMessage, getLeadsForBusiness, getLeadStats } = require('./leadStore');

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
    const aiResult = await handleCustomerMessage({
      businessId: businessId || 'demo-plumbing',
      from: from || 'unknown',
      channel: channel || 'web',
      message
    });
    
    // Save or update the lead from this conversation
    const lead = upsertLeadFromMessage({
      businessId: businessId || 'demo-plumbing',
      channel: channel || 'web',
      from: from || 'unknown',
      message,
      aiResult
    });
    
    // Return AI result with lead summary
    res.status(200).json({
      ...aiResult,
      lead: {
        id: lead.id,
        status: lead.status,
        updatedAt: lead.updatedAt
      }
    });
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ 
      error: 'Failed to process message' 
    });
  }
});

// Get leads for a business
app.get('/api/leads', (req, res) => {
  const { businessId } = req.query;
  
  if (!businessId) {
    return res.status(400).json({ 
      error: 'businessId query parameter is required' 
    });
  }
  
  try {
    const leads = getLeadsForBusiness(businessId);
    const stats = getLeadStats(businessId);
    
    res.status(200).json({ 
      leads,
      stats,
      count: leads.length
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
