import { Hotel, Restaurant, Activity, TripPreferences } from '../types';

const hotelImages = [
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzYyOTc0OTUyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1682221568203-16f33b35e57d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwbG9iYnl8ZW58MXx8fHwxNzYzMDEwMzMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1694595437436-2ccf5a95591f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc2MzA2MTk2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
];

const restaurantImages = [
  'https://images.unsplash.com/photo-1759419038843-29749ac4cd2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwcmVzdGF1cmFudCUyMGludGVyaW9yfGVufDF8fHx8MTc2MzAyODEwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1757358957218-67e771ec07bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwZm9vZHxlbnwxfHx8fDE3NjMwMjIwNTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
];

const activityImages = [
  'https://images.unsplash.com/photo-1647946411130-b6b35df52974?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwdG91cmlzdCUyMGF0dHJhY3Rpb258ZW58MXx8fHwxNzYzMDYyNjEwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1562064729-6c3f058785fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNldW0lMjBleGhpYml0aW9ufGVufDF8fHx8MTc2MzAzNDk2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
];

function parsePriceRange(priceRange: string): { min: number, max: number } {
  switch (priceRange) {
    case 'budget':
      return { min: 80, max: 150 };
    case 'moderate':
      return { min: 150, max: 300 };
    case 'luxury':
      return { min: 300, max: 600 };
    default:
      return { min: 80, max: 150 };
  }
}

export function generateHotels(preferences: TripPreferences): Hotel[] {
  const { city, duration, priceRange, locationPreferences } = preferences;
  
  const range = parsePriceRange(priceRange);
  
  // Parse location preferences to adjust hotel locations
  const lowerPrefs = (locationPreferences || '').toLowerCase();
  const nearAirport = lowerPrefs.includes('airport');
  const nearRestaurants = lowerPrefs.includes('restaurant') || lowerPrefs.includes('dining') || lowerPrefs.includes('food');
  const nearTourist = lowerPrefs.includes('tourist') || lowerPrefs.includes('attraction') || lowerPrefs.includes('sightseeing');
  const downtown = lowerPrefs.includes('downtown') || lowerPrefs.includes('city center') || lowerPrefs.includes('central');
  
  const hotelTemplates = [
    {
      name: `The Grand ${city}`,
      description: 'Elegant historic hotel in the heart of downtown with stunning city views and world-class service.',
      amenities: ['Spa', 'Fitness Center', 'Rooftop Pool', 'Fine Dining', 'Concierge'],
      location: downtown || nearTourist ? 'City Center' : nearAirport ? 'Near Airport District' : nearRestaurants ? 'Culinary District' : 'City Center',
    },
    {
      name: `${city} Boutique Suites`,
      description: 'Modern boutique hotel featuring contemporary design, local art, and personalized service.',
      amenities: ['Free WiFi', 'Breakfast Included', 'Bar & Lounge', '24/7 Front Desk'],
      location: nearRestaurants ? 'Restaurant Row' : nearTourist ? 'Arts District' : nearAirport ? 'Airport Area' : 'Arts District',
    },
    {
      name: `Riverside ${city} Hotel`,
      description: 'Waterfront property with panoramic views, spacious rooms, and exceptional dining options.',
      amenities: ['River Views', 'Restaurant', 'Gym', 'Business Center', 'Valet Parking'],
      location: nearRestaurants ? 'Waterfront Dining Area' : nearTourist ? 'Waterfront Tourism Hub' : 'Waterfront',
    },
    {
      name: `${city} Plaza Hotel`,
      description: 'Contemporary hotel with sleek design, rooftop bar, and easy access to major attractions.',
      amenities: ['Rooftop Bar', 'Pool', 'Spa Services', 'Meeting Rooms'],
      location: downtown || nearTourist ? 'Downtown' : nearAirport ? 'Airport District' : nearRestaurants ? 'Entertainment District' : 'Downtown',
    },
  ];
  
  // Adjust descriptions based on preferences
  const adjustedTemplates = hotelTemplates.map(template => {
    let description = template.description;
    
    if (nearAirport && !template.location.toLowerCase().includes('airport')) {
      description += ' Convenient airport shuttle service available.';
    }
    if (nearRestaurants) {
      description += ' Walking distance to acclaimed restaurants and cafes.';
    }
    if (nearTourist) {
      description += ' Steps away from popular tourist attractions and landmarks.';
    }
    
    return { ...template, description };
  });
  
  return adjustedTemplates.map((template, index) => {
    const pricePerNight = Math.floor(Math.random() * (range.max - range.min) + range.min);
    return {
      id: `hotel-${index}`,
      ...template,
      rating: 4 + Math.random() * 0.9,
      pricePerNight,
      price: pricePerNight * duration,
      image: hotelImages[index % hotelImages.length],
      bookingUrl: `https://www.booking.com/search?city=${encodeURIComponent(city)}`,
    };
  });
}

export function generateRestaurants(preferences: TripPreferences, hotelLocation: string): Restaurant[] {
  const { city } = preferences;
  
  const restaurantTemplates = [
    {
      name: `Le Petit ${city}`,
      cuisine: 'French',
      description: 'Intimate bistro serving authentic French cuisine with seasonal ingredients.',
      priceLevel: '$$',
    },
    {
      name: 'Sakura Garden',
      cuisine: 'Japanese',
      description: 'Contemporary Japanese restaurant featuring fresh sushi and traditional dishes.',
      priceLevel: '$$$',
    },
    {
      name: `${city} Trattoria`,
      cuisine: 'Italian',
      description: 'Family-owned Italian restaurant with homemade pasta and wood-fired pizzas.',
      priceLevel: '$$',
    },
    {
      name: 'The Steakhouse',
      cuisine: 'American',
      description: 'Classic steakhouse with premium cuts, craft cocktails, and elegant ambiance.',
      priceLevel: '$$$',
    },
    {
      name: 'Spice Market',
      cuisine: 'Asian Fusion',
      description: 'Modern Asian fusion with creative cocktails and shareable plates.',
      priceLevel: '$$',
    },
    {
      name: `${city} Seafood Co.`,
      cuisine: 'Seafood',
      description: 'Fresh seafood daily with waterfront views and extensive wine list.',
      priceLevel: '$$$',
    },
  ];
  
  return restaurantTemplates.map((template, index) => ({
    id: `restaurant-${index}`,
    ...template,
    rating: 4 + Math.random() * 0.9,
    distance: `${(Math.random() * 2 + 0.3).toFixed(1)} mi`,
    image: restaurantImages[index % restaurantImages.length],
    googlePlacesUrl: `https://www.google.com/maps/search/${encodeURIComponent(template.name + ' ' + city)}`,
  }));
}

export function generateActivities(preferences: TripPreferences, hotelLocation: string): Activity[] {
  const { city } = preferences;
  
  const activityTemplates = [
    {
      name: `${city} Museum of Art`,
      category: 'Culture',
      description: 'World-renowned art museum featuring classical and contemporary collections.',
      price: '$25',
      duration: '2-3 hours',
    },
    {
      name: 'Historic Walking Tour',
      category: 'Sightseeing',
      description: 'Guided tour through historic landmarks and hidden gems of the city.',
      price: '$35',
      duration: '3 hours',
    },
    {
      name: `${city} Food Market`,
      category: 'Food & Drink',
      description: 'Vibrant local market with artisan foods, fresh produce, and street food vendors.',
      price: 'Free',
      duration: '1-2 hours',
    },
    {
      name: 'Sunset Harbor Cruise',
      category: 'Outdoor',
      description: 'Scenic cruise with stunning sunset views and complimentary drinks.',
      price: '$45',
      duration: '2 hours',
    },
    {
      name: 'Cooking Class Experience',
      category: 'Culinary',
      description: 'Hands-on cooking class learning local cuisine from expert chefs.',
      price: '$80',
      duration: '3 hours',
    },
    {
      name: `${city} Observation Deck`,
      category: 'Attraction',
      description: '360-degree panoramic views from the tallest building in the city.',
      price: '$30',
      duration: '1 hour',
    },
  ];
  
  return activityTemplates.map((template, index) => ({
    id: `activity-${index}`,
    ...template,
    rating: 4 + Math.random() * 0.9,
    image: activityImages[index % activityImages.length],
    bookingUrl: `https://www.google.com/search?q=${encodeURIComponent(template.name + ' ' + city + ' booking')}`,
  }));
}