// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Types matching API response format
export interface HotelSearchRequest {
  city: string;
  dateRange: {
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
  };
  priceRange: string;
  locationPreferences?: string;
  tripDescription?: string;
  excludedHotels?: string[];
}

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
    relevanceScore: number; // 1-10
    summary: string;
  };
  placeId: string;
}

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

export const apiService = {
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
};

