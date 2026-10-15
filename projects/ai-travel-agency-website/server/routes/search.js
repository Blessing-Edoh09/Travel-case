// server/routes/search.js
const express = require('express');
const router = express.Router();
const sabreAdapter = require('../integrations/sabreAdapter');
const activitiesAdapter = require('../integrations/activitiesAdapter');
const pricingEngine = require('../services/pricingEngine');
const { authenticateToken } = require('./auth');
const { db } = require('../db');

// GET /api/v1/search/flights
router.get('/flights', authenticateToken, async (req, res) => {
  try {
    const {
      origin = 'LOS',
      destination = 'DXB',
      departDate = '2026-11-12',
      returnDate = '2026-11-20',
      tripType = 'round_trip',
      passengers = 1,
      cabinClass = 'economy'
    } = req.query;

    const flightData = await sabreAdapter.searchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      tripType,
      passengers: parseInt(passengers) || 1,
      cabinClass
    });

    const isAgent = Boolean(req.user && req.user.role === 'agent');
    let agentDefaults = {};
    if (isAgent) {
      const profile = db.prepare('SELECT default_markups FROM agent_profiles WHERE user_id = ?').get(req.user.id);
      if (profile) {
        try { agentDefaults = JSON.parse(profile.default_markups); } catch (e) {}
      }
    }

    // Process pricing for each flight option
    const processedResults = flightData.results.map(flight => {
      const pricing = pricingEngine.computePricing({
        netRate: flight.net_rate,
        vertical: 'flights',
        isAgent,
        agentDefaults
      });

      const processed = { ...flight };
      if (isAgent) {
        processed.net_rate = pricing.net_rate;
        processed.markup_pct = pricing.markup_pct;
        processed.client_price = pricing.client_price;
        processed.margin = pricing.margin;
        processed.cap = pricing.cap;
        processed.price = pricing.net_rate; // Agent sees their net cost as primary
        processed.rate_label = 'Net rate';
      } else {
        delete processed.net_rate;
        processed.price = pricing.client_price;
        processed.rate_label = 'Total per person';
      }
      return processed;
    });

    return res.json({
      ...flightData,
      is_agent_view: isAgent,
      results: processedResults
    });
  } catch (error) {
    console.error('Error searching flights:', error);
    return res.status(500).json({ error: error.message || 'Error executing flight search' });
  }
});

// GET /api/v1/search/hotels
router.get('/hotels', authenticateToken, async (req, res) => {
  try {
    const {
      destination = 'Dubai',
      checkIn = '2026-11-12',
      checkOut = '2026-11-19',
      guests = 2,
      rooms = 1
    } = req.query;

    const hotelData = await sabreAdapter.searchHotels({
      destination,
      checkIn,
      checkOut,
      guests: parseInt(guests) || 2,
      rooms: parseInt(rooms) || 1
    });

    const isAgent = Boolean(req.user && req.user.role === 'agent');
    let agentDefaults = {};
    if (isAgent) {
      const profile = db.prepare('SELECT default_markups FROM agent_profiles WHERE user_id = ?').get(req.user.id);
      if (profile) {
        try { agentDefaults = JSON.parse(profile.default_markups); } catch (e) {}
      }
    }

    const processedResults = hotelData.results.map(hotel => {
      const pricing = pricingEngine.computePricing({
        netRate: hotel.net_rate_total,
        vertical: 'hotels',
        isAgent,
        agentDefaults
      });

      const processed = { ...hotel };
      if (isAgent) {
        processed.net_rate = pricing.net_rate;
        processed.client_price = pricing.client_price;
        processed.margin = pricing.margin;
        processed.markup_pct = pricing.markup_pct;
        processed.cap = pricing.cap;
        processed.price = pricing.net_rate;
        processed.rate_label = 'Net rate';
      } else {
        delete processed.net_rate_per_night;
        delete processed.net_rate_total;
        processed.price = pricing.client_price;
        processed.rate_label = 'Total for stay';
      }
      return processed;
    });

    return res.json({
      ...hotelData,
      is_agent_view: isAgent,
      results: processedResults
    });
  } catch (error) {
    console.error('Error searching hotels:', error);
    return res.status(500).json({ error: error.message || 'Error executing hotel search' });
  }
});

// GET /api/v1/search/cars
router.get('/cars', authenticateToken, async (req, res) => {
  try {
    const {
      location = 'DXB Airport',
      pickupDate = '2026-11-12',
      dropoffDate = '2026-11-19'
    } = req.query;

    const carData = await sabreAdapter.searchCars({ location, pickupDate, dropoffDate });
    const isAgent = req.user && req.user.role === 'agent';

    const processedResults = carData.results.map(car => {
      const pricing = pricingEngine.computePricing({
        netRate: car.net_rate_total,
        vertical: 'cars',
        isAgent
      });

      const processed = { ...car };
      if (isAgent) {
        processed.net_rate = pricing.net_rate;
        processed.client_price = pricing.client_price;
        processed.margin = pricing.margin;
        processed.price = pricing.net_rate;
        processed.rate_label = 'Net rate';
      } else {
        delete processed.net_rate_per_day;
        delete processed.net_rate_total;
        processed.price = pricing.client_price;
        processed.rate_label = 'Total for rental';
      }
      return processed;
    });

    return res.json({
      ...carData,
      is_agent_view: isAgent,
      results: processedResults
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error executing car rental search' });
  }
});

// GET /api/v1/search/activities
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    const { destination = 'Dubai', date = '2026-11-14' } = req.query;
    const actData = await activitiesAdapter.searchActivities({ destination, date });
    const isAgent = req.user && req.user.role === 'agent';

    const processedResults = actData.results.map(act => {
      const pricing = pricingEngine.computePricing({
        netRate: act.net_rate,
        vertical: 'activities',
        isAgent
      });

      const processed = { ...act };
      if (isAgent) {
        processed.net_rate = pricing.net_rate;
        processed.client_price = pricing.client_price;
        processed.margin = pricing.margin;
        processed.price = pricing.net_rate;
        processed.rate_label = 'Net rate';
      } else {
        delete processed.net_rate;
        processed.price = pricing.client_price;
        processed.rate_label = 'Price per person';
      }
      return processed;
    });

    return res.json({
      ...actData,
      is_agent_view: isAgent,
      results: processedResults
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error searching activities' });
  }
});

// GET /api/v1/search/multi - Executes flight, hotel, and car searches in parallel!
router.get('/multi', authenticateToken, async (req, res) => {
  try {
    const { destination = 'DXB', origin = 'LOS', date = '2026-11-12' } = req.query;

    const [flightsRes, hotelsRes, carsRes, activitiesRes] = await Promise.all([
      sabreAdapter.searchFlights({ origin, destination, departDate: date }),
      sabreAdapter.searchHotels({ destination: destination === 'DXB' ? 'Dubai' : destination }),
      sabreAdapter.searchCars({ location: `${destination} Airport` }),
      activitiesAdapter.searchActivities({ destination: destination === 'DXB' ? 'Dubai' : destination })
    ]);

    return res.json({
      flights: flightsRes.results,
      hotels: hotelsRes.results,
      cars: carsRes.results,
      activities: activitiesRes.results,
      adapters: {
        sabre: sabreAdapter.getAdapterStatus(),
        activities: activitiesAdapter.provider
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Multi-vertical search failed' });
  }
});

module.exports = router;
