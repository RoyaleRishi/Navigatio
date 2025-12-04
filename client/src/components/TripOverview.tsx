import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Hotel, Restaurant, Activity, TripPreferences } from '../types';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Hotel as HotelIcon,
  UtensilsCrossed,
  Compass,
  Download,
  Share2,
  Star,
  DollarSign,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface TripOverviewProps {
  preferences: TripPreferences;
  hotel: Hotel;
  restaurants: Restaurant[];
  activities: Activity[];
  onBack: () => void;
  onStartNew: () => void;
}

/**
 * Trip Overview Component
 * Displays the final itinerary summary including the selected hotel,
 * saved restaurants, and saved activities.
 * Allows users to print/download or start a new trip.
 */
export function TripOverview({
  preferences,
  hotel,
  restaurants,
  activities,
  onBack,
  onStartNew,
}: TripOverviewProps) {
  // Helper: Calculate duration of the trip in days based on check-in/out dates
  const calculateDuration = () => {
    if (preferences.checkIn && preferences.checkOut) {
      const checkIn = new Date(preferences.checkIn);
      const checkOut = new Date(preferences.checkOut);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const duration = calculateDuration();

  // Helper: Estimate total cost of the trip
  const hotelCost = hotel.price || 0;
  const restaurantEstimate = restaurants.length * 75; // Rough estimate: $75 per restaurant visit
  const activityEstimate = activities.reduce((sum, activity) => {
    // Try to extract numeric price from price string (e.g., "$50"), otherwise default to $25
    if (activity.priceInfo && activity.priceInfo !== 'Price varies') {
      const priceMatch = activity.priceInfo.match(/\$?(\d+)/);
      if (priceMatch) {
        return sum + parseInt(priceMatch[1]);
      }
    }
    return sum + 25; // Default fallback per activity
  }, 0);
  
  const totalCost = hotelCost + restaurantEstimate + activityEstimate;

  // Handler: Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Handler: Placeholder for sharing functionality
  const handleShare = () => {
    alert('Share functionality would open a modal to share via email or social media');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Section with Actions */}
        <div className="mb-8 print:mb-4">
          <Button variant="ghost" onClick={onBack} className="mb-4 print:hidden">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-12 h-12" />
                <div>
                  <h1 className="text-3xl mb-1">Your Trip is Ready!</h1>
                  <p className="text-white/90">
                    Here's your complete itinerary for {preferences.city}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  onClick={handlePrint}
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 print:hidden"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print / Download
                </Button>
                <Button
                  onClick={handleShare}
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 print:hidden"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Trip
                </Button>
                <Button
                  onClick={onStartNew}
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 print:hidden"
                >
                  Plan Another Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trip Details Summary (Dates, Budget, Cost) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Destination</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{preferences.city}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <span>{duration} {duration === 1 ? 'night' : 'nights'}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget</p>
                <Badge variant="secondary">
                  {preferences.priceRange}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Est. Total Cost</p>
                <span className="text-lg">${totalCost.toLocaleString()}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trip Type</p>
              <p>{preferences.tripType}</p>
            </div>
            {preferences.locationPreferences && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location Preferences</p>
                  <p>{preferences.locationPreferences}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Selected Hotel Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HotelIcon className="w-5 h-5" />
              Your Hotel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-48 h-32 flex-shrink-0">
                <ImageWithFallback
                  src={hotel.images && hotel.images.length > 0 ? hotel.images[0] : ''}
                  alt={hotel.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl mb-1">{hotel.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      {hotel.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{hotel.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{hotel.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {hotel.amenities.slice(0, 5).map((amenity) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {hotel.price !== null ? (
                      <>
                        <span className="text-xl">
                          {hotel.currency === 'USD' ? '$' : hotel.currency}{hotel.price.toLocaleString()}
                        </span>
                        {hotel.pricePerNight !== null && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({hotel.currency === 'USD' ? '$' : hotel.currency}{hotel.pricePerNight.toLocaleString()}/night)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Price not available</span>
                    )}
                  </div>
                  {hotel.bookingUrl && (
                    <Button variant="outline" size="sm" asChild className="print:hidden">
                      <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer">
                        View Booking
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurants List Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              Restaurants ({restaurants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {restaurants.map((restaurant, index) => (
                <div key={restaurant.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-32 h-24 flex-shrink-0">
                      <ImageWithFallback
                        src={restaurant.images && restaurant.images.length > 0 ? restaurant.images[0] : ''}
                        alt={restaurant.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="mb-1">{restaurant.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {restaurant.priceLevel && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {restaurant.priceLevel}
                                </Badge>
                                <span>•</span>
                              </>
                            )}
                            <MapPin className="w-3 h-3" />
                            <span>{restaurant.distance?.text || 'Unknown distance'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{restaurant.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {restaurant.description}
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto print:hidden" asChild>
                        <a
                          href={restaurant.googlePlacesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on Google Maps
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activities List Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="w-5 h-5" />
              Activities & Things to Do ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-32 h-24 flex-shrink-0">
                      <ImageWithFallback
                        src={activity.images && activity.images.length > 0 ? activity.images[0] : ''}
                        alt={activity.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="mb-1">{activity.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {activity.activityType && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {activity.activityType}
                              </Badge>
                            )}
                            {activity.distance && (
                              <>
                                <span>•</span>
                                <MapPin className="w-3 h-3" />
                                <span>{activity.distance.text}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {activity.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{activity.rating.toFixed(1)}</span>
                            {activity.totalReviews > 0 && (
                              <span className="text-xs text-muted-foreground">({activity.totalReviews})</span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {activity.priceInfo && activity.priceInfo !== 'Price varies' && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {activity.priceInfo}
                          </div>
                        )}
                      </div>
                      {activity.bookingUrl && (
                        <Button variant="link" size="sm" className="p-0 h-auto print:hidden" asChild>
                          <a href={activity.bookingUrl} target="_blank" rel="noopener noreferrer">
                            Book Activity
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {!activity.bookingUrl && (
                        <Button variant="link" size="sm" className="p-0 h-auto print:hidden" asChild>
                          <a href={`https://www.google.com/maps/place/?q=place_id:${activity.id}`} target="_blank" rel="noopener noreferrer">
                            View on Google Maps
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl mb-2">Have an amazing trip to {preferences.city}!</h3>
              <p className="text-muted-foreground mb-4">
                Your itinerary includes {restaurants.length} restaurants and {activities.length}{' '}
                activities
              </p>
              <div className="flex flex-wrap gap-3 justify-center print:hidden">
                <Button onClick={handlePrint} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Save as PDF
                </Button>
                <Button onClick={onStartNew}>Plan Another Trip</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}