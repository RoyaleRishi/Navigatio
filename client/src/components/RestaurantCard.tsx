import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Restaurant } from '../types';
import { Star, MapPin, ExternalLink, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const displayedImages = restaurant.images && restaurant.images.length > 0 ? restaurant.images : [''];
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayedImages.length) % displayedImages.length);
  };

  // Calculate relevance score color
  const getRelevanceColor = (score: number) => {
    if (score >= 9) return 'text-green-600 bg-green-100';
    if (score >= 7) return 'text-blue-600 bg-blue-100';
    if (score >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40">
        {displayedImages.length > 1 ? (
          <div className="relative h-full">
            <ImageWithFallback
              src={displayedImages[currentImageIndex]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {displayedImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <ImageWithFallback
            src={displayedImages[0]}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {restaurant.rating > 0 && (
            <div className="bg-white px-2 py-1 rounded-full shadow-md text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                {restaurant.totalReviews > 0 && (
                  <span className="text-xs text-muted-foreground">({restaurant.totalReviews})</span>
                )}
              </div>
            </div>
          )}
          {restaurant.aiAnalysis && (
            <Badge className={`${getRelevanceColor(restaurant.aiAnalysis.relevanceScore)} border-0 text-xs`}>
              <Brain className="w-3 h-3 mr-1" />
              {restaurant.aiAnalysis.relevanceScore}/10
            </Badge>
          )}
        </div>
      </div>

      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg">{restaurant.name}</h3>
            {restaurant.priceLevel && (
              <Badge variant="secondary" className="flex-shrink-0">
                {restaurant.priceLevel || 'N/A'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{restaurant.distance?.text || 'Unknown distance'}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {restaurant.aiAnalysis && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2 mb-1">
              <Brain className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-900">AI Analysis</span>
                  <Badge variant="outline" className={`text-xs ${getRelevanceColor(restaurant.aiAnalysis.relevanceScore)}`}>
                    {restaurant.aiAnalysis.relevanceScore}/10
                  </Badge>
                </div>
                <p className="text-xs text-blue-800">{restaurant.aiAnalysis.summary}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{restaurant.address}</span>
          </div>
          {restaurant.description && (
            <p className="text-sm text-muted-foreground">{restaurant.description}</p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="default" className="w-full" asChild>
          <a href={restaurant.googlePlacesUrl} target="_blank" rel="noopener noreferrer">
            View on Google Maps
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
