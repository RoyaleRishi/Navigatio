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

export function HotelResults({ preferences, onHotelSelect, onBack }: HotelResultsProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Convert TripPreferences to API format and fetch hotels
  const fetchHotels = useCallback(async (excludeExisting: boolean = false, existingHotelNames: string[] = []) => {
    // Set loading state immediately
    if (excludeExisting) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setSelectedHotelId(null);
    }

    // Defer the actual fetch to next event loop tick to ensure UI renders first
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      const response = await apiService.searchHotels({
        city: preferences.city,
        dateRange: {
          checkIn: preferences.checkIn,
          checkOut: preferences.checkOut,
        },
        priceRange: preferences.priceRange,
        locationPreferences: preferences.locationPreferences,
        tripDescription: preferences.tripType,
        excludedHotels: excludeExisting ? existingHotelNames : [],
      });

      // Convert API response to Hotel format
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
        amenities: [], // API doesn't provide amenities
        location: result.address,
        bookingUrl: '', // API doesn't provide booking URL
        aiAnalysis: result.aiAnalysis,
        reviewSnippets: result.reviews.snippets || [],
      }));

      // Update hotels (append if loading more, replace if new search)
      startTransition(() => {
        if (excludeExisting) {
          setHotels(prev => [...prev, ...convertedHotels]);
          setLoadingMore(false);
        } else {
          setHotels(convertedHotels);
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

  useEffect(() => {
    // Only fetch on initial mount or when preferences change
    const fetchInitial = async () => {
      setLoading(true);
      setError(null);
      setSelectedHotelId(null);
      
      // Ensure React renders loading state first by deferring to next tick
      await new Promise(resolve => setTimeout(resolve, 0));
      
      await fetchHotels(false, []);
    };
    
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.city, preferences.checkIn, preferences.checkOut, preferences.priceRange, preferences.locationPreferences, preferences.tripType]); // Only depend on preferences

  const handleRetry = () => {
    fetchHotels(false, []);
  };

  const handleLoadMore = () => {
    const existingNames = hotels.map(h => h.name);
    fetchHotels(true, existingNames);
  };

  const handleViewDetails = (hotelId: string) => {
    setSelectedHotelId(selectedHotelId === hotelId ? null : hotelId);
  };

  const handleSelectHotel = (hotel: Hotel) => {
    onHotelSelect(hotel);
  };

  // Calculate number of nights
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

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-muted-foreground">Searching for hotels...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take a few moments...</p>
          </div>
        )}

        {loadingMore && (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-muted-foreground">Loading more hotels...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && hotels.length === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Hotels Found</AlertTitle>
            <AlertDescription>
              We couldn't find any hotels matching your criteria. Try adjusting your search parameters.
            </AlertDescription>
          </Alert>
        )}

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