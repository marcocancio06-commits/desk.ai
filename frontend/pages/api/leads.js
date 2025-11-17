export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { businessId = 'demo-plumbing' } = req.query;
    
    try {
      // Fetch leads from backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/leads?businessId=${businessId}`);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Return leads sorted by newest first
      const sortedLeads = [...data.leads].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
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
