function getBusinessConfig(businessId) {
  // For V1, we only have one demo business
  // In the future, this could query a database
  const configs = {
    'demo-plumbing': {
      name: 'Houston Premier Plumbing',
      serviceAreas: ['77005', '77030', '77098'],
      services: [
        'drain cleaning',
        'water heater repair',
        'leak detection',
        'toilet repair',
        'emergency plumbing'
      ],
      pricing: {
        'drain cleaning': '$150–$250',
        'water heater repair': '$200–$400',
        'leak detection': '$125–$200',
        'toilet repair': '$100–$175',
        'emergency plumbing': '$250–$500'
      },
      hours: {
        weekdays: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      policies: {
        tripFee: '$75 service call fee, waived if repair is completed',
        cancellation: 'Free cancellation up to 2 hours before appointment',
        emergency: '24/7 emergency service available with additional fees'
      }
    }
  };

  return configs[businessId] || configs['demo-plumbing'];
}

module.exports = { getBusinessConfig };
