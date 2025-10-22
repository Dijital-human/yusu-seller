/**
 * Location Hook / Yer Hook-u
 * This hook provides location-related functionality
 * Bu hook yer ilə əlaqəli funksionallıq təmin edir
 */

import { useState, useEffect } from "react";

interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

interface LocationError {
  code: number;
  message: string;
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current location / Cari yeri əldə et
  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: 0,
          message: "Geolocation is not supported by this browser / Bu brauzer geolocation dəstəkləmir",
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocoding to get address / Ünvan əldə etmək üçün tərs geokodlama
            const addressData = await reverseGeocode(latitude, longitude);
            
            const locationData: Location = {
              latitude,
              longitude,
              address: addressData.address,
              city: addressData.city,
              country: addressData.country,
            };

            setLocation(locationData);
            setIsLoading(false);
            resolve(locationData);
          } catch (err) {
            const errorData: LocationError = {
              code: 2,
              message: "Failed to get address details / Ünvan təfərrüatlarını əldə etmək uğursuz",
            };
            setError(errorData);
            setIsLoading(false);
            reject(errorData);
          }
        },
        (error) => {
          const errorData: LocationError = {
            code: error.code,
            message: getErrorMessage(error.code),
          };
          setError(errorData);
          setIsLoading(false);
          reject(errorData);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes / 5 dəqiqə
        }
      );
    });
  };

  // Reverse geocoding / Tərs geokodlama
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();

      if (data.city && data.countryName) {
        return {
          address: `${data.localityInfo.administrative[0].name}, ${data.city}, ${data.countryName}`,
          city: data.city,
          country: data.countryName,
        };
      } else {
        throw new Error("Invalid geocoding response / Yanlış geokodlama cavabı");
      }
    } catch (err) {
      throw new Error("Geocoding service unavailable / Geokodlama xidməti əlçatan deyil");
    }
  };

  // Search for addresses / Ünvan axtar
  const searchAddresses = async (query: string, limit: number = 5) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/forward-geocode-client?query=${encodeURIComponent(query)}&limit=${limit}&localityLanguage=en`
      );
      const data = await response.json();

      return data.results || [];
    } catch (err) {
      console.error("Error searching addresses:", err);
      return [];
    }
  };

  // Calculate distance between two points / İki nöqtə arasındakı məsafəni hesabla
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers / Yerin radiusu kilometrlə
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers / Məsafə kilometrlə
  };

  // Check if location is within delivery area / Yerin çatdırılma sahəsində olub-olmadığını yoxla
  const isWithinDeliveryArea = (
    userLat: number,
    userLon: number,
    deliveryAreas: Array<{
      latitude: number;
      longitude: number;
      radius: number; // in kilometers / kilometrlə
    }>
  ): boolean => {
    return deliveryAreas.some(area => {
      const distance = calculateDistance(userLat, userLon, area.latitude, area.longitude);
      return distance <= area.radius;
    });
  };

  // Get error message / Xəta mesajını əldə et
  const getErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return "Permission denied / İcazə rədd edildi";
      case 2:
        return "Position unavailable / Yer əlçatan deyil";
      case 3:
        return "Request timeout / Sorğu vaxtı bitdi";
      default:
        return "Unknown error / Naməlum xəta";
    }
  };

  // Clear location / Yeri təmizlə
  const clearLocation = () => {
    setLocation(null);
    setError(null);
  };

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    searchAddresses,
    calculateDistance,
    isWithinDeliveryArea,
    clearLocation,
  };
}
