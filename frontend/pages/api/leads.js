import dummyLeads from '../../lib/dummyLeads';

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Return all leads sorted by newest first
    const sortedLeads = [...dummyLeads].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.status(200).json({ leads: sortedLeads });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
