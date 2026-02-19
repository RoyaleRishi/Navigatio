export interface TripPreferences {
  city: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  tripType: string; // tripDescription
  priceRange: string;
  locationPreferences?: string;
}

export interface Hotel {
  id: string; // placeId from API
  name: string;
  rating: number;
  totalReviews: number;
  price: number | null; // totalPrice from API
  pricePerNight: number | null;
  currency: string;
  images: string[]; // Multiple images
  description: string; // AI analysis summary
  amenities: string[]; // Not provided by API, empty array
  location: string; // address from API
  bookingUrl: string; // Not provided by API, empty string
  aiAnalysis: {
    relevanceScore: number; // 1-10
    summary: string;
  };
  reviewSnippets: string[];
}

export interface Restaurant {
  id: string; // placeId from API
  name: string;
  rating: number;
  totalReviews: number;
  priceLevel: string;
  images: string[]; // Multiple images from API
  description: string; // AI analysis summary
  address: string;
  distance: {
    meters: number;
    text: string;
  };
  aiAnalysis: {
    relevanceScore: number; // 1-10
    summary: string;
  };
  reviewSnippets: string[];
  googlePlacesUrl: string; // Can be constructed from placeId
}

export interface Activity {
  id: string; // placeId from API
  name: string;
  rating: number;
  totalReviews: number;
  priceInfo: string;
  images: string[]; // Images from API
  description: string; // AI analysis summary
  address: string;
  distance: {
    meters: number;
    text: string;
  };
  aiAnalysis: {
    relevanceScore: number; // 1-10
    summary: string;
  };
  activityType: string;
  reviewSnippets: string[];
  bookingUrl: string; // Not provided by API, empty string
}