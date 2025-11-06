'use client';

import React from 'react';
import BusinessProfileImporter from '../../(components)/BusinessProfileImporter';
import type { NormalizedBusinessProfile } from '@/lib/business-profile-parser';

export default function BusinessImportClient() {
  return (
    <BusinessProfileImporter
      onProfileImported={(profile: NormalizedBusinessProfile) => {
        // Client-side handling only; no server function props
        console.log('Profile imported:', profile);
      }}
    />
  );
}
