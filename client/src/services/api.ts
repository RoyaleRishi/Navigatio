// API Configuration
// Base URL for the backend API, defaults to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Types matching API response format

// Parameters required for hotel search
export interface HotelSearchRequest {
  city: string;
  dateRange: {
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
  };
  priceRange: string;
  locationPreferences?: string;
  tripDescription?: string;
  excludedHotels?: string[]; // List of hotels to ignore (e.g. previously viewed)
}

// Standard API response structure for hotels
export interface HotelSearchResponse {
  success: boolean;
  data: {
    query: string;
    results: HotelResult[];
    totalResults: number;
  };
  error: {
    code: string;
    message: string;
  } | null;
}

// Data structure for a single hotel result
export interface HotelResult {
  name: string;
  images: string[];
  roomPrices: {
    available: boolean;
    pricePerNight: number | null;
    totalPrice: number | null;
    currency: string;
  };
  address: string;
  reviews: {
    rating: number;
    totalReviews: number;
    snippets: string[];
  };
  aiAnalysis: {
    relevanceScore: number; // 1-10 indicating how well it matches preferences
    summary: string; // AI generated explanation
  };
  placeId: string; // Unique identifier from Google Places/Backend
}

// Custom error class for API related issues
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Parameters for restaurant search
export interface RestaurantSearchRequest {
  address: string; // Base location to search around
  priceRange?: string;
  eatingPreferences?: string;
  foodRestrictions?: string[];
}

export interface RestaurantSearchResponse {
  success: boolean;
  data: {
    query: string;
    referenceAddress: string;
    results: RestaurantResult[];
    totalResults: number;
  };
  error: {
    code: string;
    message: string;
  } | null;
}

export interface RestaurantResult {
  name: string;
  images: string[];
  priceLevel: string;
  address: string;
  reviews: {
    rating: number;
    totalReviews: number;
    snippets: string[];
  };
  aiAnalysis: {
    relevanceScore: number;
    summary: string;
  };
  placeId: string;
  distance: {
    meters: number;
    text: string;
  };
}

// Parameters for activity/attraction search
export interface ActivitySearchRequest {
  address: string;
  priceRange?: string;
  maxDistance?: string;
  searchPrompt: string; // Open ended query for what to do
}

export interface ActivitySearchResponse {
  success: boolean;
  data: {
    query: string;
    referenceAddress: string;
    results: ActivityResult[];
    totalResults: number;
  };
  error: {
    code: string;
    message: string;
  } | null;
}

export interface ActivityResult {
  name: string;
  images: string[];
  priceInfo: string;
  address: string;
  reviews: {
    rating: number;
    totalReviews: number;
    snippets: string[];
  };
  aiAnalysis: {
    relevanceScore: number;
    summary: string;
  };
  placeId: string;
  distance: {
    meters: number;
    text: string;
  };
  activityType: string;
}

// Centralized service for all API calls
export const apiService = {
  // Search for hotels based on criteria
  async searchHotels(request: HotelSearchRequest): Promise<HotelSearchResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/hotels/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new ApiError(
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.message || 'An error occurred',
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'NETWORK_ERROR',
        'Failed to connect to the server. Please check your connection and try again.'
      );
    }
  },

  // Search for restaurants based on location and preferences
  async searchRestaurants(request: RestaurantSearchRequest): Promise<RestaurantSearchResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new ApiError(
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.message || 'An error occurred',
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'NETWORK_ERROR',
        'Failed to connect to the server. Please check your connection and try again.'
      );
    }
  },

  // Search for activities based on location and prompt
  async searchActivities(request: ActivitySearchRequest): Promise<ActivitySearchResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/activities/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new ApiError(
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.message || 'An error occurred',
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'NETWORK_ERROR',
        'Failed to connect to the server. Please check your connection and try again.'
      );
    }
  },
};

