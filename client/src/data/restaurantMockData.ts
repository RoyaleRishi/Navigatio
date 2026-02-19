import { Restaurant } from '../types';

const restaurantImages = [
  'https://images.unsplash.com/photo-1759419038843-29749ac4cd2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwcmVzdGF1cmFudCUyMGludGVyaW9yfGVufDF8fHx8MTc2MzAyODEwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1757358957218-67e771ec07bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwZm9vZHxlbnwxfHx8fDE3NjMwMjIwNTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
];

export function generateRestaurantsWithPreferences(
  city: string,
  hotelLocation: string,
  dietaryPreferences: string
): Restaurant[] {
  const lowerPrefs = dietaryPreferences.toLowerCase();
  const isVegan = lowerPrefs.includes('vegan');
  const isVegetarian = lowerPrefs.includes('vegetarian') || isVegan;
  const isGlutenFree = lowerPrefs.includes('gluten') || lowerPrefs.includes('celiac');
  const isHalal = lowerPrefs.includes('halal');
  const isKosher = lowerPrefs.includes('kosher');
  const wantsClean = lowerPrefs.includes('clean') || lowerPrefs.includes('hygienic') || lowerPrefs.includes('sanitized');
  const nearHotel = lowerPrefs.includes('near hotel') || lowerPrefs.includes('close') || lowerPrefs.includes('walking distance');
  const isCasual = lowerPrefs.includes('casual') || lowerPrefs.includes('relaxed');
  const isFineDining = lowerPrefs.includes('fine dining') || lowerPrefs.includes('upscale') || lowerPrefs.includes('fancy');
  const wantsFast = lowerPrefs.includes('quick') || lowerPrefs.includes('fast');
  const isOrganic = lowerPrefs.includes('organic') || lowerPrefs.includes('farm to table') || lowerPrefs.includes('local');
  
  let restaurantTemplates = [
    {
      name: `Le Petit ${city}`,
      cuisine: 'French',
      description: 'Intimate bistro serving authentic French cuisine with seasonal ingredients.',
      priceLevel: '$$',
      dietary: ['vegetarian options', 'gluten-free options'],
    },
    {
      name: 'Sakura Garden',
      cuisine: 'Japanese',
      description: 'Contemporary Japanese restaurant featuring fresh sushi and traditional dishes.',
      priceLevel: '$$$',
      dietary: ['gluten-free options', 'vegetarian options'],
    },
    {
      name: `${city} Trattoria`,
      cuisine: 'Italian',
      description: 'Family-owned Italian restaurant with homemade pasta and wood-fired pizzas.',
      priceLevel: '$$',
      dietary: ['vegetarian options', 'vegan options'],
    },
    {
      name: 'The Steakhouse',
      cuisine: 'American',
      description: 'Classic steakhouse with premium cuts, craft cocktails, and elegant ambiance.',
      priceLevel: '$$$',
      dietary: ['gluten-free options'],
    },
    {
      name: 'Spice Market',
      cuisine: 'Asian Fusion',
      description: 'Modern Asian fusion with creative cocktails and shareable plates.',
      priceLevel: '$$',
      dietary: ['vegan options', 'vegetarian options', 'gluten-free options'],
    },
    {
      name: `${city} Seafood Co.`,
      cuisine: 'Seafood',
      description: 'Fresh seafood daily with waterfront views and extensive wine list.',
      priceLevel: '$$$',
      dietary: ['gluten-free options'],
    },
    {
      name: 'Green Leaf Cafe',
      cuisine: 'Vegan',
      description: 'Plant-based eatery with creative vegan dishes and organic ingredients.',
      priceLevel: '$',
      dietary: ['vegan', 'vegetarian', 'gluten-free options', 'organic'],
    },
    {
      name: 'Mediterranean Table',
      cuisine: 'Mediterranean',
      description: 'Fresh Mediterranean cuisine with healthy options and vibrant flavors.',
      priceLevel: '$$',
      dietary: ['halal', 'vegetarian options', 'vegan options', 'gluten-free options'],
    },
    {
      name: 'The Garden Kitchen',
      cuisine: 'Farm-to-Table',
      description: 'Seasonal farm-to-table dining with locally sourced organic ingredients.',
      priceLevel: '$$$',
      dietary: ['organic', 'vegetarian options', 'vegan options', 'gluten-free options'],
    },
  ];
  
  // Filter restaurants based on dietary preferences
  let filteredRestaurants = restaurantTemplates;
  
  if (isVegan) {
    filteredRestaurants = restaurantTemplates.filter(r => 
      r.dietary.some(d => d.includes('vegan'))
    );
  } else if (isVegetarian) {
    filteredRestaurants = restaurantTemplates.filter(r => 
      r.dietary.some(d => d.includes('vegan') || d.includes('vegetarian'))
    );
  } else if (isGlutenFree) {
    filteredRestaurants = restaurantTemplates.filter(r => 
      r.dietary.some(d => d.includes('gluten-free'))
    );
  } else if (isHalal) {
    filteredRestaurants = restaurantTemplates.filter(r => 
      r.dietary.some(d => d.includes('halal'))
    );
  } else if (isOrganic) {
    filteredRestaurants = restaurantTemplates.filter(r => 
      r.dietary.some(d => d.includes('organic') || d.includes('farm'))
    );
  }
  
  // Ensure we have at least 6 restaurants
  if (filteredRestaurants.length < 6) {
    filteredRestaurants = restaurantTemplates.slice(0, 6);
  }
  
  // Take the first 6
  filteredRestaurants = filteredRestaurants.slice(0, 6);
  
  return filteredRestaurants.map((template, index) => {
    let description = template.description;
    
    // Add context based on preferences
    if (wantsClean) {
      description += ' Known for exceptional cleanliness and hygiene standards.';
    }
    if (isFineDining && template.priceLevel === '$$$') {
      description += ' Perfect for a special occasion.';
    }
    if (wantsFast && template.priceLevel === '$') {
      description += ' Quick service without compromising quality.';
    }
    
    const distance = nearHotel 
      ? `${(Math.random() * 0.5 + 0.1).toFixed(1)} mi`
      : `${(Math.random() * 2 + 0.3).toFixed(1)} mi`;
    
    return {
      id: `restaurant-${index}`,
      name: template.name,
      cuisine: template.cuisine,
      description,
      priceLevel: template.priceLevel,
      rating: 4 + Math.random() * 0.9,
      distance,
      image: restaurantImages[index % restaurantImages.length],
      googlePlacesUrl: `https://www.google.com/maps/search/${encodeURIComponent(template.name + ' ' + city)}`,
    };
  });
}
