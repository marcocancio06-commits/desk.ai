import { DEMO_BUSINESS, BACKEND_URL } from '../../config/demoConfig';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { businessId = DEMO_BUSINESS.id } = req.query;
    
    try {
      // Fetch leads from backend API
      const response = await fetch(`${BACKEND_URL}/api/demo/leads?businessId=${businessId}`);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Return leads sorted by newest first
      const sortedLeads = [...(data.leads || [])].sort((a, b) => 
        new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
      );
      
      res.status(200).json({ 
        leads: sortedLeads,
        stats: data.stats 
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ error: 'Failed to fetch leads from backend' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
