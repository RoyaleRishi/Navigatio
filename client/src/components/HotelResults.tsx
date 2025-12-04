import { useState, useEffect, useCallback, useTransition } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { HotelCard } from './HotelCard';
import { Hotel, TripPreferences } from '../types';
import { apiService, ApiError } from '../services/api';
import { ArrowLeft, RefreshCw, Sparkles, AlertCircle, Loader2, Plus } from 'lucide-react';

interface HotelResultsProps {
  preferences: TripPreferences;
  onHotelSelect: (hotel: Hotel) => void;
  onBack: () => void;
}

/**
 * Hotel Results Component
 * Displays a list of hotels matching the user's search criteria.
 * Handles fetching data from the API, pagination (load more), and error states.
 */
export function HotelResults({ preferences, onHotelSelect, onBack }: HotelResultsProps) {
  // State for storing list of hotels
  const [hotels, setHotels] = useState<Hotel[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true); // Initial load
  const [loadingMore, setLoadingMore] = useState(false); // Loading additional results
  const [error, setError] = useState<string | null>(null);
  
  // Tracks which hotel card is expanded to show more details
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  
  // useTransition for smoother state updates
  const [isPending, startTransition] = useTransition();

  // Core function to fetch hotel data
  const fetchHotels = useCallback(async (excludeExisting: boolean = false, existingHotelNames: string[] = []) => {
    // Update appropriate loading state
    if (excludeExisting) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setSelectedHotelId(null);
    }

    // Defer the actual fetch to next event loop tick to ensure UI renders loading state first
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      // Call the API service
      const response = await apiService.searchHotels({
        city: preferences.city,
        dateRange: {
          checkIn: preferences.checkIn,
          checkOut: preferences.checkOut,
        },
        priceRange: preferences.priceRange,
        locationPreferences: preferences.locationPreferences,
        tripDescription: preferences.tripType,
        excludedHotels: excludeExisting ? existingHotelNames : [], // Avoid duplicates when loading more
      });

      // Map API response to internal Hotel type
      const convertedHotels: Hotel[] = response.data.results.map((result, index) => ({
        id: result.placeId || `hotel-${index}`,
        name: result.name,
        rating: result.reviews.rating || 0,
        totalReviews: result.reviews.totalReviews || 0,
        price: result.roomPrices.totalPrice,
        pricePerNight: result.roomPrices.pricePerNight,
        currency: result.roomPrices.currency || 'USD',
        images: result.images.length > 0 ? result.images : [''],
        description: result.aiAnalysis.summary,
        amenities: [], // API currently doesn't return amenities list
        location: result.address,
        bookingUrl: '', // API currently doesn't return direct booking links
        aiAnalysis: result.aiAnalysis,
        reviewSnippets: result.reviews.snippets || [],
      }));

      // Update state with new data
      startTransition(() => {
        if (excludeExisting) {
          setHotels(prev => [...prev, ...convertedHotels]); // Append for load more
          setLoadingMore(false);
        } else {
          setHotels(convertedHotels); // Replace for fresh search
          setLoading(false);
        }
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'An error occurred while searching for hotels');
      } else {
        setError('Failed to search for hotels. Please try again.');
      }
      console.error('Error fetching hotels:', err);
      setLoading(false);
      setLoadingMore(false);
    }
  }, [preferences.city, preferences.checkIn, preferences.checkOut, preferences.priceRange, preferences.locationPreferences, preferences.tripType, startTransition]);

  // Effect: Trigger initial fetch on mount or when preferences change
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      setError(null);
      setSelectedHotelId(null);
      
      // Ensure React renders loading state first
      await new Promise(resolve => setTimeout(resolve, 0));
      
      await fetchHotels(false, []);
    };
    
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.city, preferences.checkIn, preferences.checkOut, preferences.priceRange, preferences.locationPreferences, preferences.tripType]);

  // Handlers
  const handleRetry = () => {
    fetchHotels(false, []);
  };

  const handleLoadMore = () => {
    const existingNames = hotels.map(h => h.name);
    fetchHotels(true, existingNames);
  };

  const handleViewDetails = (hotelId: string) => {
    // Toggle expansion: close if already open, otherwise open selected
    setSelectedHotelId(selectedHotelId === hotelId ? null : hotelId);
  };

  const handleSelectHotel = (hotel: Hotel) => {
    onHotelSelect(hotel);
  };

  // Helper: Calculate duration in nights
  const getNights = () => {
    const checkInDate = new Date(preferences.checkIn);
    const checkOutDate = new Date(preferences.checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">
                    Hotels in {preferences.city}
                  </CardTitle>
                  <CardDescription>
                    {getNights()} nights • {preferences.checkIn} to {preferences.checkOut}
                    {preferences.locationPreferences && (
                      <> • {preferences.locationPreferences}</>
                    )}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  {preferences.priceRange}
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex gap-2">
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                className="flex-1 sm:flex-none"
                disabled={loading || loadingMore}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Searching...' : 'Search Again'}
              </Button>
              {hotels.length > 0 && !loading && (
                <Button 
                  onClick={handleLoadMore} 
                  variant="outline" 
                  className="flex-1 sm:flex-none"
                  disabled={loadingMore}
                >
                  <Plus className={`w-4 h-4 mr-2 ${loadingMore ? 'animate-spin' : ''}`} />
                  {loadingMore ? 'Loading...' : 'Load More'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-muted-foreground">Searching for hotels...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take a few moments...</p>
          </div>
        )}

        {/* Loading More State */}
        {loadingMore && (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-muted-foreground">Loading more hotels...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && hotels.length === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Hotels Found</AlertTitle>
            <AlertDescription>
              We couldn't find any hotels matching your criteria. Try adjusting your search parameters.
            </AlertDescription>
          </Alert>
        )}

        {/* Results Grid */}
        {!loading && hotels.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  isExpanded={selectedHotelId === hotel.id}
                  onViewDetails={() => handleViewDetails(hotel.id)}
                  onSelect={() => handleSelectHotel(hotel)}
                />
              ))}
            </div>

            {!loadingMore && (
              <div className="mt-8 text-center">
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                  <CardContent className="pt-6">
                    <Sparkles className="w-8 h-8 mx-auto mb-2" />
                    <p>
                      Choose a hotel to continue to restaurant and activity recommendations
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}