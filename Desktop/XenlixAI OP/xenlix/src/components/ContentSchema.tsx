'use client';

import { usePathname } from 'next/navigation';
import { useContentSchema } from './ContentSchemaMapper';

export interface ContentSchemaProps {
  /** Override automatic schema detection */
  customSchemas?: any[];
  /** Base URL for the site */
  baseUrl?: string;
}

export default function ContentSchema({ 
  customSchemas,
  baseUrl = 'https://xenlix.ai' 
}: ContentSchemaProps) {
  const pathname = usePathname();
  const autoSchemas = useContentSchema(pathname);
  
  // Use custom schemas if provided, otherwise use auto-detected
  const schemas = customSchemas || autoSchemas;
  
  if (!schemas || schemas.length === 0) {
    return null;
  }
  
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`content-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
          }}
        />
      ))}
    </>
  );
}