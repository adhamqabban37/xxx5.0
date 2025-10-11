/**
 * Business Maps Components
 * Export all map-related components and utilities
 */

export { BusinessMap } from './BusinessMap';
export type { BusinessMapProps } from './BusinessMap';

export { default as LeafletBusinessMap } from './LeafletBusinessMap';
export { default as GoogleBusinessMap } from './GoogleBusinessMap';

export { BusinessMapWithAutocomplete } from './BusinessMapWithAutocomplete';
export type { BusinessMapWithAutocompleteProps } from './BusinessMapWithAutocomplete';

export { minimalMapStyle, defaultMapOptions } from './styles/mapStyles';

// Re-export common types for convenience
export type GoogleMapsLatLng = {
  lat: number;
  lng: number;
};

export type GoogleMapsAddress = {
  formatted_address: string;
  place_id?: string;
  types?: string[];
};
