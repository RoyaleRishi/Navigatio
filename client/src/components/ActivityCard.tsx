import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Activity } from '../types';
import { Star, MapPin, ExternalLink, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const displayedImages = activity.images && activity.images.length > 0 ? activity.images : [''];
  
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

  // Google Maps URL from place ID
  const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${activity.id}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40">
        {displayedImages.length > 1 ? (
          <div className="relative h-full">
            <ImageWithFallback
              src={displayedImages[currentImageIndex]}
              alt={activity.name}
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
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-3 left-3">
          {activity.activityType && (
            <Badge className="bg-white text-black hover:bg-white capitalize">
              {activity.activityType}
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {activity.rating > 0 && (
            <div className="bg-white px-2 py-1 rounded-full shadow-md text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{activity.rating.toFixed(1)}</span>
                {activity.totalReviews > 0 && (
                  <span className="text-xs text-muted-foreground">({activity.totalReviews})</span>
                )}
              </div>
            </div>
          )}
          {activity.aiAnalysis && (
            <Badge className={`${getRelevanceColor(activity.aiAnalysis.relevanceScore)} border-0 text-xs`}>
              <Brain className="w-3 h-3 mr-1" />
              {activity.aiAnalysis.relevanceScore}/10
            </Badge>
          )}
        </div>
      </div>

      <CardHeader>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{activity.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{activity.distance?.text || 'Unknown distance'}</span>
            </div>
            {activity.priceInfo && activity.priceInfo !== 'Price varies' && (
              <>
                <span>•</span>
                <span>{activity.priceInfo}</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {activity.aiAnalysis && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2 mb-1">
              <Brain className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-900">AI Analysis</span>
                  <Badge variant="outline" className={`text-xs ${getRelevanceColor(activity.aiAnalysis.relevanceScore)}`}>
                    {activity.aiAnalysis.relevanceScore}/10
                  </Badge>
                </div>
                <p className="text-xs text-blue-800">{activity.aiAnalysis.summary}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {activity.address && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{activity.address}</span>
            </div>
          )}
          {activity.description && (
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="default" className="w-full" asChild>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            View on Google Maps
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
