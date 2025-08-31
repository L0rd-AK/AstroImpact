const axios = require('axios');

// Helper function to get user's location from IP (for demo purposes)
const getUserLocation = async (ip) => {
  try {
    // In a real app, you'd use a proper IP geolocation service
    // For demo, return Dhaka, Bangladesh as default
    return {
      latitude: 23.8103,
      longitude: 90.4125,
      city: 'Dhaka',
      country: 'Bangladesh'
    };
  } catch (error) {
    console.error('Failed to get user location:', error);
    return {
      latitude: 23.8103,
      longitude: 90.4125,
      city: 'Dhaka',
      country: 'Bangladesh'
    };
  }
};

// Format numbers for display
const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return 'N/A';
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  
  return num.toFixed(decimals);
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Validate coordinates
const isValidCoordinate = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Generate random ID
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Calculate severity score for simulation results
const calculateSeverityScore = (results) => {
  if (!results) return 0;
  
  const factors = [
    Math.log10(results.craterDiameter || 1),
    Math.log10(results.populationEffects?.estimatedCasualties || 1),
    Math.log10(results.economicImpact?.estimatedDamage || 1),
    Math.log10(results.blastRadius?.heavyDamage || 1)
  ];
  
  const average = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  return Math.max(0, Math.min(100, Math.round(average * 10)));
};

module.exports = {
  getUserLocation,
  formatNumber,
  calculateDistance,
  isValidCoordinate,
  generateId,
  sanitizeInput,
  calculateSeverityScore
};
