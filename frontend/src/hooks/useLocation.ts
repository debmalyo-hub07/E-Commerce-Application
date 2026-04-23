'use client';

import { useState, useEffect } from 'react';

interface LocationData {
  pincode: string | null;
  city: string | null;
  state: string | null;
  error: string | null;
  loading: boolean;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData>({
    pincode: null,
    city: null,
    state: null,
    error: null,
    loading: true,
  });

  const fetchLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding (Using a free API as fallback or generic placeholder)
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          
          setLocation({
            pincode: data.postcode || null,
            city: data.city || data.locality || null,
            state: data.principalSubdivision || null,
            error: null,
            loading: false,
          });
        } catch (err) {
          setLocation(prev => ({ ...prev, loading: false, error: 'Failed to fetch city data' }));
        }
      },
      (err) => {
        setLocation(prev => ({ ...prev, loading: false, error: 'Location access denied' }));
      }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return { ...location, refetch: fetchLocation };
};
