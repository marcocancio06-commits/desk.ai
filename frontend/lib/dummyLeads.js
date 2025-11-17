// Dummy lead data for dashboard development
// This will be replaced with real data from the backend later

const dummyLeads = [
  {
    id: 'lead-001',
    name: 'Sarah Johnson',
    phone: '+1-555-234-5678',
    issue: 'Leaking water heater in basement',
    status: 'ready_to_book',
    createdAt: new Date('2024-11-17T09:30:00').toISOString(),
    zipCode: '77005',
    preferredTime: 'tomorrow morning',
    urgency: 'high'
  },
  {
    id: 'lead-002',
    name: 'Michael Chen',
    phone: '+1-555-876-5432',
    issue: 'Clogged kitchen drain',
    status: 'booked',
    createdAt: new Date('2024-11-17T08:15:00').toISOString(),
    zipCode: '77030',
    preferredTime: 'today afternoon',
    urgency: 'normal'
  },
  {
    id: 'lead-003',
    name: 'Emily Rodriguez',
    phone: '+1-555-345-6789',
    issue: 'Toilet won\'t flush properly',
    status: 'new',
    createdAt: new Date('2024-11-17T10:45:00').toISOString(),
    zipCode: '77098',
    preferredTime: null,
    urgency: null
  },
  {
    id: 'lead-004',
    name: 'David Thompson',
    phone: '+1-555-987-6543',
    issue: 'Emergency - burst pipe in garage',
    status: 'collecting_info',
    createdAt: new Date('2024-11-17T07:20:00').toISOString(),
    zipCode: '77005',
    preferredTime: 'ASAP',
    urgency: 'emergency'
  },
  {
    id: 'lead-005',
    name: 'Lisa Martinez',
    phone: '+1-555-456-7890',
    issue: 'Need water heater replacement quote',
    status: 'collecting_info',
    createdAt: new Date('2024-11-16T16:30:00').toISOString(),
    zipCode: '77030',
    preferredTime: 'this week',
    urgency: 'low'
  },
  {
    id: 'lead-006',
    name: 'Robert Williams',
    phone: '+1-555-567-8901',
    issue: 'Faucet dripping in master bathroom',
    status: 'ready_to_book',
    createdAt: new Date('2024-11-16T14:15:00').toISOString(),
    zipCode: '77098',
    preferredTime: 'Friday morning',
    urgency: 'normal'
  },
  {
    id: 'lead-007',
    name: 'Jennifer Davis',
    phone: '+1-555-678-9012',
    issue: 'Low water pressure throughout house',
    status: 'closed',
    createdAt: new Date('2024-11-15T11:00:00').toISOString(),
    zipCode: '77005',
    preferredTime: 'Monday afternoon',
    urgency: 'normal'
  },
  {
    id: 'lead-008',
    name: 'James Anderson',
    phone: '+1-555-789-0123',
    issue: 'Garbage disposal not working',
    status: 'booked',
    createdAt: new Date('2024-11-16T09:45:00').toISOString(),
    zipCode: '77030',
    preferredTime: 'Wednesday',
    urgency: 'normal'
  },
  {
    id: 'lead-009',
    name: 'Patricia Taylor',
    phone: '+1-555-890-1234',
    issue: 'Need leak detection service',
    status: 'new',
    createdAt: new Date('2024-11-17T11:20:00').toISOString(),
    zipCode: '77098',
    preferredTime: null,
    urgency: null
  },
  {
    id: 'lead-010',
    name: 'Christopher Brown',
    phone: '+1-555-901-2345',
    issue: 'Shower drain slow, need cleaning',
    status: 'ready_to_book',
    createdAt: new Date('2024-11-16T13:30:00').toISOString(),
    zipCode: '77005',
    preferredTime: 'tomorrow',
    urgency: 'low'
  }
];

export default dummyLeads;
