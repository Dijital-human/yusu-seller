/**
 * Location Picker Component / Yer Seçici Komponenti
 * This component provides location selection and address input
 * Bu komponent yer seçimi və ünvan daxil etmə təmin edir
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { 
  MapPin, 
  Navigation, 
  Search,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  }) => void;
  initialLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current location / Cari yeri əldə et
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser / Bu brauzer geolocation dəstəkləmir");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        // Reverse geocoding / Tərs geokodlama
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        setError("Unable to retrieve your location / Yerinizi əldə etmək mümkün deyil");
        setIsLoading(false);
      }
    );
  };

  // Reverse geocoding / Tərs geokodlama
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      // Using a free geocoding service / Pulsuz geokodlama xidməti istifadə edirik
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();

      if (data.city && data.countryName) {
        const fullAddress = `${data.localityInfo.administrative[0].name}, ${data.city}, ${data.countryName}`;
        setAddress(fullAddress);
        
        onLocationSelect({
          address: fullAddress,
          latitude,
          longitude,
          city: data.city,
          country: data.countryName,
        });
      }
    } catch (err) {
      setError("Failed to get address details / Ünvan təfərrüatlarını əldə etmək uğursuz");
    } finally {
      setIsLoading(false);
    }
  };

  // Search for addresses / Ünvan axtar
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Using a free geocoding service / Pulsuz geokodlama xidməti istifadə edirik
      const response = await fetch(
        `https://api.bigdatacloud.net/data/forward-geocode-client?query=${encodeURIComponent(query)}&limit=5&localityLanguage=en`
      );
      const data = await response.json();

      if (data.results) {
        setSuggestions(data.results);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Error searching addresses:", err);
    }
  };

  // Handle address selection / Ünvan seçimini idarə et
  const handleAddressSelect = (suggestion: any) => {
    const fullAddress = `${suggestion.locality}, ${suggestion.city}, ${suggestion.countryName}`;
    setAddress(fullAddress);
    setShowSuggestions(false);
    
    onLocationSelect({
      address: fullAddress,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      city: suggestion.city,
      country: suggestion.countryName,
    });
  };

  // Handle manual address input / Manual ünvan daxil etməni idarə et
  const handleManualAddress = () => {
    if (address.trim()) {
      // For manual addresses, we'll use default coordinates / Manual ünvanlar üçün default koordinatlar istifadə edəcəyik
      onLocationSelect({
        address: address.trim(),
        latitude: 40.4093, // Baku coordinates / Bakı koordinatları
        longitude: 49.8671,
        city: "Baku",
        country: "Azerbaijan",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span>Delivery Location / Çatdırılma Yeri</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Button / Cari Yer Düyməsi */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Use Current Location / Cari Yeri İstifadə Et
          </Button>
        </div>

        {/* Address Input / Ünvan Daxil Etmə */}
        <div className="space-y-2">
          <Label htmlFor="address">Delivery Address / Çatdırılma Ünvanı</Label>
          <div className="relative">
            <Input
              ref={inputRef}
              id="address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                searchAddresses(e.target.value);
              }}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              placeholder="Enter delivery address / Çatdırılma ünvanını daxil edin"
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Address Suggestions / Ünvan Təklifləri */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleAddressSelect(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{suggestion.locality}</p>
                      <p className="text-sm text-gray-500">
                        {suggestion.city}, {suggestion.countryName}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual Address Button / Manual Ünvan Düyməsi */}
        <Button
          onClick={handleManualAddress}
          disabled={!address.trim()}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirm Address / Ünvanı Təsdiqlə
        </Button>

        {/* Error Display / Xəta Göstəricisi */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Location Info / Yer Məlumatı */}
        {currentLocation && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-2 text-blue-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Location Detected / Yer Aşkar Edildi</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
