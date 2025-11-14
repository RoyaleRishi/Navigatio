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
  Clock,
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

export function TripOverview({
  preferences,
  hotel,
  restaurants,
  activities,
  onBack,
  onStartNew,
}: TripOverviewProps) {
  const totalCost = hotel.price + (restaurants.length * 75) + activities.reduce((sum, activity) => {
    const price = parseInt(activity.price.replace(/\D/g, '')) || 0;
    return sum + price;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    alert('Share functionality would open a modal to share via email or social media');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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

        {/* Trip Details Summary */}
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
                <span>{preferences.duration} nights</span>
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

        {/* Hotel Section */}
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
                  src={hotel.image}
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
                    <span className="text-xl">${hotel.price}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (${hotel.pricePerNight}/night)
                    </span>
                  </div>
                  <Button variant="outline" size="sm" asChild className="print:hidden">
                    <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer">
                      View Booking
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurants Section */}
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
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="mb-1">{restaurant.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {restaurant.cuisine}
                            </Badge>
                            <span>•</span>
                            <span>{restaurant.priceLevel}</span>
                            <span>•</span>
                            <MapPin className="w-3 h-3" />
                            <span>{restaurant.distance}</span>
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

        {/* Activities Section */}
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
                        src={activity.image}
                        alt={activity.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="mb-1">{activity.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {activity.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{activity.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {activity.price}
                        </div>
                      </div>
                      <Button variant="link" size="sm" className="p-0 h-auto print:hidden" asChild>
                        <a href={activity.bookingUrl} target="_blank" rel="noopener noreferrer">
                          Book Activity
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

        {/* Summary Footer */}
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