import type { City } from "@/contexts/CityContext";

export interface ShowroomLocation {
  address: string;
  phone?: string;
}

export interface ShowroomBrand {
  id: string;
  name: string;
  url?: string;
  materialTypes: string[];
  isPartner?: boolean;
  locations: Partial<Record<City, ShowroomLocation>>;
}

// Returned from getShowroomsForMaterial - brand with resolved city location
export interface ShowroomResult {
  id: string;
  name: string;
  address: string;
  phone?: string;
  url?: string;
  isPartner?: boolean;
}

// Result with availability info
export interface ShowroomAvailability {
  available: ShowroomResult[];
  otherCities: City[];  // Cities where material IS available (but user isn't in)
}

export interface ProviderBrand {
  id: string;
  name: string;
  specialty: string;
  description?: string;
  phone?: string;
  website?: string;
  isPartner?: boolean;
  cities: City[];
}
