// server/integrations/activitiesAdapter.js
// Dedicated Adapter for Activities, Tours, Airport Transfers, and Travel Insurance

class ActivitiesAndAddonsAdapter {
  constructor() {
    this.provider = 'Viator/GetYourGuide & Ground Partner API';
    this.isMock = true;
  }

  // --- ACTIVITIES & EXPERIENCES (P0 Vertical) ---
  async searchActivities({ destination = 'Dubai', date = '2026-11-14', travelers = 2 }) {
    const activities = [
      {
        id: 'act_desert_safari',
        title: 'Premium Evening Desert Safari with BBQ Dinner & Dune Bashing',
        destination,
        duration: '6 hours',
        rating: 4.9,
        reviews_count: 3200,
        image_url: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=600&q=80',
        highlights: ['4x4 Dune bashing in high red dunes', 'Sunset photography stop', 'Camel riding experience', 'Buffet dinner with live BBQ & Tanoura dance'],
        inclusions: 'Hotel pickup & drop-off, dinner, non-alcoholic drinks, entertainment',
        cancellation: 'Free cancellation up to 24 hours in advance',
        net_rate: 38000,
        published_rate: 45000,
        currency: 'NGN',
        is_simulated: true,
        source: 'Activities Partner API (Simulated)'
      },
      {
        id: 'act_marina_yacht',
        title: 'Dubai Marina Luxury Yacht Cruise with Breakfast or BBQ',
        destination,
        duration: '2 hours',
        rating: 4.8,
        reviews_count: 1850,
        image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
        highlights: ['Cruise past Burj Al Arab and Atlantis', 'Spacious sun deck with music', 'Live cooking on board'],
        inclusions: 'Refreshments, life jackets, guide commentary',
        cancellation: 'Free cancellation up to 24 hours in advance',
        net_rate: 48000,
        published_rate: 58000,
        currency: 'NGN',
        is_simulated: true,
        source: 'Activities Partner API (Simulated)'
      },
      {
        id: 'act_burj_khalifa',
        title: 'At the Top Burj Khalifa (Levels 124 & 125) Fast-Track Entry',
        destination,
        duration: '1.5 hours',
        rating: 4.7,
        reviews_count: 5120,
        image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
        highlights: ['World’s fastest double-deck elevators', '360-degree panoramic city views', 'High-powered observation telescopes'],
        inclusions: 'Skip-the-box-office access, observation deck entry',
        cancellation: 'Non-refundable admission voucher',
        net_rate: 42000,
        published_rate: 49000,
        currency: 'NGN',
        is_simulated: true,
        source: 'Activities Partner API (Simulated)'
      }
    ];

    return {
      destination,
      date,
      resultsCount: activities.length,
      results: activities
    };
  }

  // --- AIRPORT TRANSFERS ---
  async getTransferOptions({ airport = 'DXB', hotelLocation = 'Downtown Dubai' }) {
    return [
      {
        id: 'trf_private_sedan',
        type: 'transfer',
        title: 'Private Executive Airport Transfer (Mercedes E-Class or Lexus)',
        route: `${airport} Airport → ${hotelLocation}`,
        capacity: 'Up to 3 passengers · 3 bags',
        meet_and_greet: true,
        net_rate: 32000,
        published_rate: 38000,
        currency: 'NGN',
        is_simulated: true
      },
      {
        id: 'trf_family_van',
        type: 'transfer',
        title: 'Private Family Van Airport Transfer (Toyota Alphard / Mercedes V-Class)',
        route: `${airport} Airport → ${hotelLocation}`,
        capacity: 'Up to 6 passengers · 6 bags',
        meet_and_greet: true,
        net_rate: 48000,
        published_rate: 56000,
        currency: 'NGN',
        is_simulated: true
      }
    ];
  }

  // --- TRAVEL INSURANCE ---
  getInsuranceOptions({ tripDurationDays = 7, destination = 'International' }) {
    return [
      {
        id: 'ins_comprehensive',
        type: 'insurance',
        title: 'Travel Case Comprehensive Travel Medical Insurance',
        provider: 'AXA Mansard / Leadway Partner Underwriting',
        coverage_amount: '€50,000 / $60,000 Medical Coverage',
        features: [
          'Schengen-compliant emergency medical expense (€30,000+)',
          'Trip cancellation and delay compensation',
          'Lost or delayed baggage protection up to $1,500',
          '24/7 International Emergency Medical Assistance'
        ],
        net_rate: 18000,
        published_rate: 22500,
        currency: 'NGN',
        is_simulated: true
      }
    ];
  }
}

module.exports = new ActivitiesAndAddonsAdapter();
