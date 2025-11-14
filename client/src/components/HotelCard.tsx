import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Hotel } from '../types';
import { Star, MapPin, ExternalLink, ChevronDown, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HotelCardProps {
  hotel: Hotel;
  isExpanded: boolean;
  onViewDetails: () => void;
  onSelect: () => void;
}

export function HotelCard({ hotel, isExpanded, onViewDetails, onSelect }: HotelCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const displayedImages = hotel.images && hotel.images.length > 0 ? hotel.images : [''];
  
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
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative h-48">
        {displayedImages.length > 1 ? (
          <div className="relative h-full">
            <ImageWithFallback
              src={displayedImages[currentImageIndex]}
              alt={hotel.name}
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
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {hotel.rating > 0 && (
            <div className="bg-white px-3 py-1 rounded-full shadow-lg">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
                {hotel.totalReviews > 0 && (
                  <span className="text-xs text-muted-foreground">({hotel.totalReviews})</span>
                )}
              </div>
            </div>
          )}
          {hotel.aiAnalysis && (
            <Badge className={`${getRelevanceColor(hotel.aiAnalysis.relevanceScore)} border-0`}>
              <Brain className="w-3 h-3 mr-1" />
              {hotel.aiAnalysis.relevanceScore}/10
            </Badge>
          )}
        </div>
      </div>

      <CardHeader>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{hotel.name}</h3>
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{hotel.location}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {hotel.aiAnalysis && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-blue-900">AI Analysis</span>
                  <Badge variant="outline" className={`text-xs ${getRelevanceColor(hotel.aiAnalysis.relevanceScore)}`}>
                    Relevance: {hotel.aiAnalysis.relevanceScore}/10
                  </Badge>
                </div>
                <p className="text-sm text-blue-800">{hotel.aiAnalysis.summary}</p>
              </div>
            </div>
          </div>
        )}

        {hotel.description && (
          <p className="text-muted-foreground mb-4 text-sm">{hotel.description}</p>
        )}
        
        {isExpanded && (
          <div className="space-y-3 border-t pt-4">
            {hotel.reviewSnippets && hotel.reviewSnippets.length > 0 && (
              <div>
                <p className="mb-2 font-semibold text-sm">Recent Reviews:</p>
                <div className="space-y-2">
                  {hotel.reviewSnippets.slice(0, 2).map((snippet, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                      "{snippet}"
                    </p>
                  ))}
                </div>
              </div>
            )}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div>
                <p className="mb-2 font-semibold text-sm">Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-baseline gap-2">
          {hotel.price !== null ? (
            <>
              <span className="text-2xl font-bold">
                {hotel.currency === 'USD' ? '$' : hotel.currency}{hotel.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-sm">total</span>
              {hotel.pricePerNight !== null && (
                <span className="text-sm text-muted-foreground ml-auto">
                  {hotel.currency === 'USD' ? '$' : hotel.currency}{hotel.pricePerNight.toLocaleString()}/night
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Price not available</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button onClick={onViewDetails} variant="outline" className="flex-1">
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                View Details
              </>
            )}
          </Button>
          <Button onClick={onSelect} className="flex-1">
            Select This Hotel
          </Button>
        </div>
        {hotel.bookingUrl && (
          <Button variant="link" className="w-full" asChild>
            <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer">
              View on Booking.com
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
