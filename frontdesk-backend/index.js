const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { handleCustomerMessage, generateDailySummary } = require('./aiClient');
const { upsertLeadFromMessage, getLeadsForBusiness, getLeadStats, getMetricsForPeriods, getAppointments, updateLeadFields } = require('./leadStore');

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

// Get daily summary with metrics and AI-generated insights
app.get('/api/summary', async (req, res) => {
  const { businessId } = req.query;
  
  // Default to demo-plumbing if not provided
  const targetBusinessId = businessId || 'demo-plumbing';
  
  try {
    // Get metrics for today and last 7 days
    const metrics = getMetricsForPeriods(targetBusinessId);
    
    // Get appointments (qualified or scheduled leads)
    const appointments = getAppointments(targetBusinessId);
    
    // Generate AI summary
    const aiSummary = await generateDailySummary({
      businessId: targetBusinessId,
      metrics,
      appointments
    });
    
    // Calculate date range
    const today = new Date();
    const last7DaysStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Return complete summary
    res.status(200).json({
      businessId: targetBusinessId,
      dateRange: {
        today: today.toISOString().split('T')[0],
        last7DaysStart: last7DaysStart.toISOString().split('T')[0]
      },
      metrics,
      appointments,
      aiSummary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary' 
    });
  }
});

// Update a lead's fields (status, urgency, scheduledTime, ownerNotes)
// TODO: Add authentication to verify business owner permissions
app.patch('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const { businessId, status, urgency, scheduledTime, ownerNotes } = req.body;
  
  // Validate required fields
  if (!businessId) {
    return res.status(400).json({ 
      error: 'businessId is required in request body' 
    });
  }
  
  if (!id) {
    return res.status(400).json({ 
      error: 'Lead ID is required in URL path' 
    });
  }
  
  try {
    // Update the lead with provided fields
    const updatedLead = updateLeadFields({
      leadId: id,
      businessId,
      status,
      urgency,
      scheduledTime,
      ownerNotes
    });
    
    // Check if lead was found
    if (!updatedLead) {
      return res.status(404).json({ 
        error: 'Lead not found or does not belong to this business' 
      });
    }
    
    // Return the updated lead
    res.status(200).json({ 
      lead: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ 
      error: 'Failed to update lead' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
