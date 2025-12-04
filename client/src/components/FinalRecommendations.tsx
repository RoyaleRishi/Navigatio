import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { RestaurantCard } from './RestaurantCard';
import { ActivityCard } from './ActivityCard';
import { Hotel, Restaurant, Activity, TripPreferences } from '../types';
import { apiService, ApiError } from '../services/api';
import { ArrowLeft, RefreshCw, Hotel as HotelIcon, UtensilsCrossed, MapPin, Save, AlertCircle, Loader2 } from 'lucide-react';

interface FinalRecommendationsProps {
  preferences: TripPreferences;
  hotel: Hotel;
  onBack: () => void;
  onSaveTrip: (restaurants: Restaurant[], activities: Activity[]) => void;
}

/**
 * Final Recommendations Component
 * Handles the generation of restaurant and activity recommendations
 * based on the selected hotel and user's specific preferences for dining/activities.
 */
export function FinalRecommendations({ preferences, hotel, onBack, onSaveTrip }: FinalRecommendationsProps) {
  // State for detailed preferences (dining, activities, dietary)
  const [restaurantPreferences, setRestaurantPreferences] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [activityPreferences, setActivityPreferences] = useState('');
  
  // State for recommendations
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core function to fetch recommendations from API
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Defer to next tick to allow UI to render loading state
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      // Parse dietary preferences into food restrictions array
      const foodRestrictions: string[] = [];
      if (dietaryPreferences) {
        // Split by common delimiters and filter out empty strings
        const restrictions = dietaryPreferences
          .split(/[,;]/)
          .map(r => r.trim())
          .filter(r => r.length > 0);
        foodRestrictions.push(...restrictions);
      }

      // Make both API calls in parallel for efficiency
      const [restaurantResponse, activityResponse] = await Promise.all([
        apiService.searchRestaurants({
          address: hotel.location, // Search around the selected hotel
          priceRange: preferences.priceRange,
          eatingPreferences: restaurantPreferences || undefined,
          foodRestrictions: foodRestrictions.length > 0 ? foodRestrictions : undefined,
        }),
        apiService.searchActivities({
          address: hotel.location, // Search around the selected hotel
          priceRange: preferences.priceRange,
          searchPrompt: activityPreferences || 'Popular tourist attractions and activities',
        }),
      ]);

      // Convert restaurant API response to internal Restaurant format
      const convertedRestaurants: Restaurant[] = restaurantResponse.data.results.map((result, index) => ({
        id: result.placeId || `restaurant-${index}`,
        name: result.name,
        rating: result.reviews.rating || 0,
        totalReviews: result.reviews.totalReviews || 0,
        priceLevel: result.priceLevel || '',
        images: result.images.length > 0 ? result.images : [''],
        description: result.aiAnalysis.summary,
        address: result.address,
        distance: result.distance,
        aiAnalysis: result.aiAnalysis,
        reviewSnippets: result.reviews.snippets || [],
        googlePlacesUrl: `https://www.google.com/maps/place/?q=place_id:${result.placeId}`,
      }));

      // Convert activity API response to internal Activity format
      const convertedActivities: Activity[] = activityResponse.data.results.map((result, index) => ({
        id: result.placeId || `activity-${index}`,
        name: result.name,
        rating: result.reviews.rating || 0,
        totalReviews: result.reviews.totalReviews || 0,
        priceInfo: result.priceInfo || 'Price varies',
        images: result.images.length > 0 ? result.images : [''],
        description: result.aiAnalysis.summary,
        address: result.address,
        distance: result.distance,
        aiAnalysis: result.aiAnalysis,
        activityType: result.activityType || 'attraction',
        reviewSnippets: result.reviews.snippets || [],
        bookingUrl: '', // Not provided by API
      }));

      setRestaurants(convertedRestaurants);
      setActivities(convertedActivities);
      setHasSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'An error occurred while searching for recommendations');
      } else {
        setError('Failed to load recommendations. Please try again.');
      }
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [hotel.location, preferences.priceRange, dietaryPreferences, restaurantPreferences, activityPreferences]);

  // Handlers
  const handleSubmit = () => {
    fetchRecommendations();
  };

  const handleRegenerate = () => {
    fetchRecommendations();
  };

  const handleSaveTrip = () => {
    onSaveTrip(restaurants, activities);
  };

  // If not yet submitted, show the preferences form
  if (!hasSubmitted) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotels
          </Button>

          <Card className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <HotelIcon className="w-6 h-6 text-green-600" />
                <CardTitle>Hotel Selected!</CardTitle>
              </div>
              <CardDescription>
                You've chosen {hotel.name} in {hotel.location}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customize Your Experience</CardTitle>
              <CardDescription>
                Tell us about your dining preferences and what activities you'd like to do
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Restaurant Preferences Section */}
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                  <Label htmlFor="restaurant-preferences" className="text-base font-semibold">
                    Restaurant Preferences
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurant-preferences">
                    What type of restaurants are you looking for?
                  </Label>
                  <Textarea
                    id="restaurant-preferences"
                    placeholder="e.g., Romantic fine dining, local authentic cuisine, Italian restaurants, casual dining, rooftop restaurants..."
                    value={restaurantPreferences}
                    onChange={(e) => setRestaurantPreferences(e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Describe your ideal restaurants for this trip
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dietary">
                    Dietary Restrictions (Optional)
                  </Label>
                  <Textarea
                    id="dietary"
                    placeholder="e.g., Vegan, Gluten-free, Halal, Kosher, Vegetarian, Nut allergy, Seafood only..."
                    value={dietaryPreferences}
                    onChange={(e) => setDietaryPreferences(e.target.value)}
                    rows={2}
                  />
                  <p className="text-sm text-muted-foreground">
                    Specify any dietary needs (separate multiple with commas)
                  </p>
                </div>
              </div>

              {/* Activity Preferences Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <Label htmlFor="activity-preferences" className="text-base font-semibold">
                    Activity Preferences
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-preferences">
                    What activities are you interested in?
                  </Label>
                  <Textarea
                    id="activity-preferences"
                    placeholder="e.g., Museums and art galleries, outdoor activities, parks, cultural experiences, nightlife, family-friendly attractions, historical sites..."
                    value={activityPreferences}
                    onChange={(e) => setActivityPreferences(e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Describe the types of activities and attractions you'd like to visit
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Get Recommendations'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotels
          </Button>

          <Card className="bg-white/80 backdrop-blur mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">
                    Your {preferences.city} Itinerary
                  </CardTitle>
                  <CardDescription>
                    Staying at {hotel.name}
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleRegenerate} 
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Searching...' : 'Regenerate All'}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-muted-foreground">Searching for restaurants and activities...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take a few moments...</p>
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

        {/* Results Section */}
        {!loading && !error && (
          <>
            {/* Hotel Information Card */}
            <Card className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <HotelIcon className="w-6 h-6 text-green-600" />
                  <CardTitle>Your Selected Hotel</CardTitle>
                </div>
                <CardDescription>
                  <strong>{hotel.name}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{hotel.location}</span>
                  </div>
                  {hotel.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Rating:</span>
                      <span>{hotel.rating.toFixed(1)} ({hotel.totalReviews} reviews)</span>
                    </div>
                  )}
                  {hotel.pricePerNight !== null && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Price:</span>
                      <span>{hotel.currency === 'USD' ? '$' : hotel.currency}{hotel.pricePerNight?.toLocaleString()}/night</span>
                    </div>
                  )}
                  {hotel.aiAnalysis && (
                    <div className="mt-2 p-2 bg-white rounded border border-green-200">
                      <p className="text-xs text-muted-foreground mb-1">AI Recommendation Score: {hotel.aiAnalysis.relevanceScore}/10</p>
                      <p className="text-xs">{hotel.aiAnalysis.summary}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Restaurants List */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-lg">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl">Recommended Restaurants</h2>
                  <p className="text-muted-foreground">
                    {restaurants.length > 0 
                      ? `${restaurants.length} restaurants found near your hotel`
                      : 'No restaurants found. Try adjusting your preferences.'}
                  </p>
                </div>
              </div>
              {restaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Restaurants Found</AlertTitle>
                  <AlertDescription>
                    We couldn't find restaurants matching your criteria. Try adjusting your preferences.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Activities List */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl">Things to Do</h2>
                  <p className="text-muted-foreground">
                    {activities.length > 0
                      ? `${activities.length} activities found near your hotel`
                      : 'No activities found. Try adjusting your search.'}
                  </p>
                </div>
              </div>
              {activities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Activities Found</AlertTitle>
                  <AlertDescription>
                    We couldn't find activities matching your criteria. Try adjusting your search preferences.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* Save Trip Button */}
        <div className="mt-12">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <Save className="w-12 h-12" />
                <div>
                  <h3 className="text-xl mb-2">Ready to finalize your trip?</h3>
                  <p className="text-white/90">
                    Save your itinerary to view a complete overview of your {preferences.city} adventure
                  </p>
                </div>
                <Button
                  onClick={handleSaveTrip}
                  size="lg"
                  className="bg-white text-green-600 hover:bg-white/90"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Trip & View Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}