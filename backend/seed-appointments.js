require('dotenv').config();
const { supabase } = require('./supabaseClient');

async function seedAppointments() {
  console.log('🌱 Seeding test appointments...');
  
  try {
    // Get current date for scheduling
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const getDate = (daysOffset) => {
      const date = new Date(now);
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    };
    
    // Delete existing test appointments and leads to avoid duplicates
    console.log('🧹 Cleaning up old test data...');
    await supabase
      .from('appointments')
      .delete()
      .eq('business_id', 'demo-business-001');
    
    await supabase
      .from('leads')
      .delete()
      .eq('business_id', 'demo-business-001')
      .like('phone', '+1-555-01%');
    
    // Create test leads and appointments together
    const testCases = [
      // TODAY - Emergency (red)
      {
        phone: '+1-555-0101',
        issue: 'Burst pipe flooding basement - URGENT',
        urgency: 'emergency',
        zip: '90210',
        notes: 'Customer said water is 2 inches deep',
        date: today,
        time: '09:00'
      },
      {
        phone: '+1-555-0102',
        issue: 'No heat in winter - furnace broken',
        urgency: 'emergency',
        zip: '90211',
        notes: 'Family with small children, needs immediate help',
        date: today,
        time: '14:30'
      },
      
      // TOMORROW - High priority (orange)
      {
        phone: '+1-555-0103',
        issue: 'Kitchen sink won\'t drain - backing up',
        urgency: 'high',
        zip: '90212',
        notes: 'Tenant complained, landlord wants it fixed',
        date: getDate(1),
        time: '10:00'
      },
      {
        phone: '+1-555-0104',
        issue: 'Water heater making loud banging noises',
        urgency: 'high',
        zip: '90213',
        notes: 'May need replacement if too old',
        date: getDate(1),
        time: '13:00'
      },
      {
        phone: '+1-555-0105',
        issue: 'Toilet running constantly, water bill spike',
        urgency: 'high',
        zip: '90214',
        notes: 'Has already tried jiggling the handle',
        date: getDate(2),
        time: '09:30'
      },
      
      // FUTURE - Normal priority (green)
      {
        phone: '+1-555-0106',
        issue: 'Install new bathroom faucet',
        urgency: 'normal',
        zip: '90215',
        notes: 'Customer bought faucet from Home Depot',
        date: getDate(3),
        time: '11:00'
      },
      {
        phone: '+1-555-0107',
        issue: 'Annual water heater maintenance',
        urgency: 'normal',
        zip: '90216',
        notes: 'Regular customer, schedule preferred',
        date: getDate(4),
        time: '10:00'
      },
      {
        phone: '+1-555-0108',
        issue: 'Replace old garbage disposal',
        urgency: 'normal',
        zip: '90217',
        notes: 'Current disposal is 15 years old',
        date: getDate(5),
        time: '14:00'
      },
      {
        phone: '+1-555-0109',
        issue: 'Slow draining shower',
        urgency: 'normal',
        zip: '90218',
        notes: 'Hair clog suspected',
        date: getDate(6),
        time: '15:30'
      },
      {
        phone: '+1-555-0110',
        issue: 'Install dishwasher in new kitchen',
        urgency: 'normal',
        zip: '90219',
        notes: 'Kitchen remodel, dishwasher ready to install',
        date: getDate(7),
        time: '09:00'
      }
    ];
    
    console.log('📝 Creating test leads and appointments...');
    let createdCount = 0;
    
    for (const testCase of testCases) {
      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          business_id: 'demo-business-001',
          phone: testCase.phone,
          channel: 'phone',
          issue_summary: testCase.issue,
          urgency: testCase.urgency,
          zip_code: testCase.zip,
          internal_notes: testCase.notes,
          status: 'scheduled',
          conversation_state: 'completed'
        })
        .select()
        .single();
      
      if (leadError) {
        console.error(`❌ Error creating lead for ${testCase.phone}:`, leadError);
        continue;
      }
      
      // Create appointment
      const { error: aptError } = await supabase
        .from('appointments')
        .insert({
          business_id: 'demo-business-001',
          lead_id: lead.id,
          scheduled_date: testCase.date,
          scheduled_time: testCase.time,
          status: 'pending',
          notes: testCase.notes
        });
      
      if (aptError) {
        console.error(`❌ Error creating appointment for ${testCase.phone}:`, aptError);
      } else {
        createdCount++;
      }
    }
    
    console.log(`✅ Successfully created ${createdCount} test appointments!`);
    
    // Get summary
    const { data: allApts } = await supabase
      .from('appointments')
      .select(`
        *,
        leads (
          urgency
        )
      `)
      .eq('business_id', 'demo-business-001');
    
    if (allApts) {
      console.log('\nAppointment breakdown:');
      console.log('  🔴 Emergency:', allApts.filter(a => a.leads?.urgency === 'emergency').length);
      console.log('  🟠 High priority:', allApts.filter(a => a.leads?.urgency === 'high').length);
      console.log('  🟢 Normal:', allApts.filter(a => a.leads?.urgency === 'normal').length);
      console.log('\n  📅 Today:', allApts.filter(a => a.scheduled_date === today).length);
      console.log('  📆 Future:', allApts.filter(a => new Date(a.scheduled_date) > new Date(today)).length);
    }
    
  } catch (error) {
    console.error('❌ Failed to seed appointments:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedAppointments();
