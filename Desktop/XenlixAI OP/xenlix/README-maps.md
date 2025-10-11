# Google Maps Integration - Setup Guide

## Overview

This guide covers setting up the production-ready `BusinessMap` component with Google Maps JavaScript API integration, geocoding capabilities, and graceful error handling.

## Prerequisites

- Next.js 14/15 with App Router
- React 18+
- TypeScript
- Google Cloud Platform account

## Quick Setup

### 1. Install Dependencies

```bash
npm install @react-google-maps/api
# or
pnpm add @react-google-maps/api
# or 
yarn add @react-google-maps/api
```

### 2. Google Cloud Configuration

#### Create Project & Enable APIs

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** or select existing one
3. **Navigate to "APIs & Services" → "Library"**
4. **Enable these APIs:**
   - ✅ **Maps JavaScript API** (required for interactive maps)
   - ✅ **Geocoding API** (required for address → coordinates conversion)
   - ✅ **Places API** (optional, for autocomplete features)

#### Create API Key

1. **Go to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "API Key"**
3. **Copy the generated key** (format: `AIzaSy...`)

#### Secure Your API Key (IMPORTANT!)

1. **Click on your API key** in the credentials list
2. **Set Application restrictions:**
   - Choose **"HTTP referrers (web sites)"**
   - Add these referrers:
     ```
     http://localhost:3000/*
     http://localhost:3001/*
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     ```

3. **Set API restrictions:**
   - Choose **"Restrict key"**
   - Select only the APIs you enabled:
     - Maps JavaScript API
     - Geocoding API
     - Places API (if using autocomplete)

### 3. Environment Configuration

Add to your `.env.local` file:

```bash
# Google Maps API Key (browser-exposed, restrict by HTTP referrers)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-your-actual-api-key-here
```

**⚠️ Security Note:** This key is browser-exposed (NEXT_PUBLIC_*). Always restrict it by HTTP referrers in Google Cloud Console.

### 4. Restart Development Server

```bash
npm run dev
# or
pnpm dev
```

## Usage Examples

### Basic Usage

```tsx
import { BusinessMap } from '@/app/components/map/BusinessMap';

// Example 1: Exact coordinates (preferred)
<BusinessMap 
  lat={32.7767} 
  lng={-96.7970} 
  zoom={15} 
  height="380px" 
  showControls={true} 
/>

// Example 2: Address geocoding
<BusinessMap 
  address="123 Main Street, Dallas, TX 75201"
  businessName="My Business"
  zoom={14}
/>

// Example 3: Minimal setup
<BusinessMap address="Dallas, TX" />
```

### Advanced Usage

```tsx
<BusinessMap
  lat={32.7767}
  lng={-96.7970}
  businessName="Headquarters"
  zoom={16}
  height="400px"
  showControls={true}
  className="shadow-lg rounded-lg"
/>
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lat` | `number?` | - | Latitude (takes priority over address) |
| `lng` | `number?` | - | Longitude (takes priority over address) |
| `address` | `string?` | - | Address to geocode if lat/lng not provided |
| `businessName` | `string?` | - | Name shown in marker tooltip |
| `zoom` | `number?` | `14` | Map zoom level (1-20) |
| `height` | `string?` | `'320px'` | CSS height value |
| `showControls` | `boolean?` | `false` | Show zoom/fullscreen controls |
| `className` | `string?` | `''` | Additional CSS classes |

## Features

### ✅ Smart Geocoding
- Automatically converts addresses to coordinates
- Results cached in sessionStorage (avoids repeat API calls)
- Debounced geocoding (300ms) for address changes

### ✅ Graceful Error Handling
- **No API key:** Shows configuration notice with fallback link
- **Invalid address:** Clear error message with retry options
- **Network errors:** Handles OVER_QUERY_LIMIT, ZERO_RESULTS, etc.
- **Loading states:** Shimmer animation while geocoding

### ✅ Accessibility & Fallbacks
- `<noscript>` fallback for users without JavaScript
- Keyboard navigation support
- Screen reader friendly error messages
- Semantic HTML structure

### ✅ Production Features
- TypeScript support with full type safety
- Optimized re-renders with React hooks
- Minimal bundle size (only loads required Google Maps libraries)
- Clean console (no unhandled promise rejections)

## Troubleshooting

### "This page can't load Google Maps correctly"

**Symptoms:** Gray map with error message
**Causes:**
- Invalid or missing API key
- API key not browser-accessible (missing `NEXT_PUBLIC_` prefix)
- Referrer restrictions blocking localhost/domain

**Solutions:**
1. Verify API key is correct in `.env.local`
2. Ensure key starts with `NEXT_PUBLIC_`
3. Check referrer restrictions in Google Cloud Console
4. Restart development server after changing environment variables

### "For development purposes only" watermark

**Symptoms:** Watermark appears on map
**Cause:** Using unrestricted API key or billing not enabled

**Solutions:**
1. Enable billing in Google Cloud Console
2. Properly configure API key restrictions
3. Ensure Maps JavaScript API is enabled

### Geocoding Errors

**"Address not found"**
- Check address format (include city, state/province, country)
- Try more specific addresses
- Verify Geocoding API is enabled

**"Too many requests"**
- Hitting Geocoding API quota limits
- Implement proper caching (component does this automatically)
- Check usage in Google Cloud Console

### Network/Loading Issues

**Map doesn't load**
- Check browser network tab for 403/404 errors
- Verify all required APIs are enabled
- Check API key has correct permissions

**Slow geocoding**
- Results cached automatically after first geocode
- Consider providing lat/lng directly for better performance

## Quota & Pricing

### Free Tier (Monthly)
- **Maps JavaScript API:** 28,000+ map loads
- **Geocoding API:** 40,000 requests
- **Places API:** 17,000 requests

### Best Practices
- Cache geocoding results (✅ automatically handled)
- Use exact coordinates when possible (skips geocoding)
- Monitor usage in Google Cloud Console
- Set up billing alerts

## Security Checklist

- ✅ API key restricted by HTTP referrers
- ✅ Only required APIs enabled
- ✅ Environment variables properly configured
- ✅ No API keys in client-side code/repositories
- ✅ Monitoring enabled for unusual usage

## Development vs Production

### Development
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...dev-key...

# Referrer restrictions
http://localhost:3000/*
http://localhost:3001/*
```

### Production
```bash
# .env.production
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...prod-key...

# Referrer restrictions  
https://yourdomain.com/*
https://*.yourdomain.com/*
```

## Support

### Component Issues
- Check browser console for error messages
- Verify all props are correctly typed
- Ensure Google Maps APIs are properly enabled

### API Issues  
- Monitor Google Cloud Console for quota/billing issues
- Check API key restrictions and permissions
- Review error logs for specific geocoding failures

### Performance Issues
- Use exact coordinates instead of addresses when possible
- Monitor network requests for excessive geocoding calls
- Consider implementing custom caching strategies for large datasets

---

## Quick Reference

**Component Import:**
```tsx
import { BusinessMap } from '@/app/components/map/BusinessMap';
```

**Environment Variable:**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
```

**Required Google Cloud APIs:**
- Maps JavaScript API ✅
- Geocoding API ✅  
- Places API (optional) ✅