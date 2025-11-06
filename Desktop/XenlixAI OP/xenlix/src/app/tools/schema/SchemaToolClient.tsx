'use client';

import React from 'react';
import { SameAsProfileIntegrator } from '@/components/SameAsProfileIntegrator';

type BusinessData = {
  name?: string;
  website?: string;
  description?: string;
  phone?: string;
  address?: string;
};

interface SchemaToolClientProps {
  initialBusinessData?: BusinessData;
}

export default function SchemaToolClient({ initialBusinessData }: SchemaToolClientProps) {
  return (
    <SameAsProfileIntegrator
      businessData={initialBusinessData}
      onSchemasGenerated={(schemas: unknown[], output: string) => {
        // Handle client-side only behaviors here
        // For now, we just log to the console
        console.log('Generated Schemas:', schemas, output);
      }}
    />
  );
}
