export * from "./types";
export { showroomBrands } from "./showrooms";
export { providerBrands } from "./providers";
export { materialTypeToSpecialty, getSpecialtyForMaterial } from "./material-mapping";

import type { City } from "@/contexts/CityContext";
import type { ShowroomAvailability, ProviderBrand } from "./types";
import { showroomBrands } from "./showrooms";
import { providerBrands } from "./providers";
import { getSpecialtyForMaterial } from "./material-mapping";

/**
 * Get showrooms for a material by explicit showroomIds only.
 * No fallback to materialType - only shows partner showrooms you've linked.
 * Returns available showrooms in user's city, plus other cities where available.
 */
export function getShowroomsForMaterial(
  city: City,
  showroomIds?: string[]
): ShowroomAvailability {
  // No showrooms linked = Coming soon
  if (!showroomIds || showroomIds.length === 0) {
    return { available: [], otherCities: [] };
  }

  // Get matching brands by ID
  const matchingBrands = showroomBrands.filter((b) => showroomIds.includes(b.id));

  // Brands available in user's city
  const available = matchingBrands
    .filter((b) => b.locations[city])
    .map((b) => ({
      id: b.id,
      name: b.name,
      address: b.locations[city]!.address,
      phone: b.locations[city]!.phone,
      url: b.url,
      isPartner: b.isPartner,
    }));

  // If none available in current city, find which cities have them
  let otherCities: City[] = [];
  if (available.length === 0 && matchingBrands.length > 0) {
    const allCities = new Set<City>();
    matchingBrands.forEach((b) => {
      Object.keys(b.locations).forEach((c) => allCities.add(c as City));
    });
    otherCities = Array.from(allCities);
  }

  return { available, otherCities };
}

/**
 * Get providers that can install a specific material type in a city
 */
export function getProvidersForMaterial(
  city: City,
  materialType: string | undefined
): ProviderBrand[] {
  const specialty = getSpecialtyForMaterial(materialType);
  if (!specialty) return [];

  // Return providers that match specialty AND operate in user's city
  return providerBrands.filter(
    (p) => p.specialty === specialty && p.cities.includes(city)
  );
}
