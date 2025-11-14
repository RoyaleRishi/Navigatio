export interface TripPreferences {
  city: string;
  duration: number;
  tripType: string;
  priceRange: string;
  locationPreferences?: string;
}

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  price: number;
  pricePerNight: number;
  image: string;
  description: string;
  amenities: string[];
  location: string;
  bookingUrl: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceLevel: string;
  image: string;
  description: string;
  distance: string;
  googlePlacesUrl: string;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  rating: number;
  price: string;
  image: string;
  description: string;
  duration: string;
  bookingUrl: string;
}