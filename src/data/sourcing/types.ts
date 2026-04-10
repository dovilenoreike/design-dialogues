import type { City } from "@/contexts/CityContext";
import type { MaterialRole } from "@/types/material-types";

export interface ShowroomLocation {
  address?: string;
  phone?: string;
  email?: string;
}

export interface ShowroomBrand {
  id: string;
  name: string;
  url?: string;
  surfaceCategories: MaterialRole[];
  isPartner?: boolean;
  isDelivery?: boolean;
  locations: Partial<Record<City, ShowroomLocation>>;
}

// Returned from getShowroomsForMaterial - brand with resolved city location
export interface ShowroomResult {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  url?: string;
  isPartner?: boolean;
  isDelivery?: boolean;
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
  email?: string;
  website?: string;
  isPartner?: boolean;
  cities: City[];
}
