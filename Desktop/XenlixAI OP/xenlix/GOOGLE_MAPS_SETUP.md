# Google Maps API Setup Guide

## Issue: "This content is blocked" Error

You're seeing this error because the Google Maps API key is not properly configured. Here's how to fix it:

## Step 1: Get a Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create a new project or select an existing one
3. **Enable APIs**: Go to "APIs & Services" > "Library"
   - Enable **Maps Embed API**
   - Enable **Maps JavaScript API** (optional, for advanced features)
4. **Create API Key**: Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

## Step 2: Configure API Key Restrictions (Recommended)

1. **Click on your API key** in the credentials list
2. **Set Application Restrictions**:
   - Choose "HTTP referrers (web sites)"
   - Add these referrers:
     ```
     http://localhost:3000/*
     https://yourdomain.com/*
     ```
3. **Set API Restrictions**:
   - Choose "Restrict key"
   - Select only the APIs you enabled:
     - Maps Embed API
     - Maps JavaScript API (if enabled)

## Step 3: Update Environment Variables

Replace the placeholder in your `.env.local` file:

```bash
# Before (placeholder):
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# After (your actual key):
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyC-dK6wTo87GZvgupxqzqmsXPlw123456789"
```

## Step 4: Restart Development Server

After updating the environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Troubleshooting

### Common Issues:

1. **"This site can't be reached" or blocked content**:
   - Check API key is correctly set in `.env.local`
   - Ensure Maps Embed API is enabled in Google Cloud Console
   - Verify referrer restrictions allow your domain/localhost

2. **"For development purposes only" watermark**:
   - This appears when using fallback mode
   - Configure proper API key to remove it

3. **Quota exceeded errors**:
   - Check your Google Cloud Console for usage limits
   - Maps Embed API has generous free tier limits

### Testing Your Setup:

1. Check if environment variable is loaded:
   ```javascript
   console.log('Maps API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
   ```

2. Test direct embed URL:
   ```
   https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=Space+Needle,Seattle+WA
   ```

## Free Tier Limits

Google Maps API free tier includes:
- **Maps Embed API**: Unlimited requests
- **Maps JavaScript API**: 28,000+ loads per month
- **Geocoding API**: 40,000 requests per month

## Security Best Practices

1. **Always restrict your API keys** to specific domains/IPs
2. **Use separate keys** for different environments (dev/staging/prod)
3. **Monitor usage** in Google Cloud Console
4. **Never commit API keys** to public repositories

## Alternative: Free Fallback Mode

If you prefer not to set up Google Maps API, the component will automatically fall back to the free Google Maps embed mode, which has limited functionality but doesn't require an API key.