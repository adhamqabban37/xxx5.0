'use client';

import React from 'react';
import { BusinessMapWithAutocomplete } from '../components/map/BusinessMapWithAutocomplete';

export function AutocompleteExampleClient() {
  return (
    <>
      <BusinessMapWithAutocomplete
        initialAddress="Dallas, TX"
        businessName="Search Result"
        zoom={13}
        height="320px"
        showControls={true}
        className="shadow-lg rounded-lg"
        onLocationChange={(location) => console.log('Location changed:', location)}
      />
      <p className="text-sm text-gray-600 mt-2">
        🔍 Try searching for businesses, addresses, or landmarks
      </p>
    </>
  );
}
