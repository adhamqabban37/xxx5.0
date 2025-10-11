# Google Maps Integration - Package Installation

## Required Dependencies

Add to your `package.json`:

```bash
npm install @react-google-maps/api
# or
pnpm add @react-google-maps/api
# or
yarn add @react-google-maps/api
```

## Package.json Dependencies

```json
{
  "dependencies": {
    "@react-google-maps/api": "^2.19.2"
  }
}
```

## TypeScript Types (Optional)

For enhanced TypeScript support:

```bash
npm install --save-dev @types/google.maps
```

## Verification

After installation, verify the package is installed:

```bash
npm ls @react-google-maps/api
```

The component will import from:
```tsx
import { GoogleMap, LoadScript, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
```