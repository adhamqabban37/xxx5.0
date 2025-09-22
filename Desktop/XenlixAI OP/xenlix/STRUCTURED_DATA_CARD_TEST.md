# How to Test StructuredDataCard

## Testing Steps

### 1. Open Analytics Dashboard
- Navigate to `/app/analytics?url=<your-site>` (e.g., `/app/analytics?url=example.com`)
- Ensure you're signed in with premium access

### 2. Verify Core Functionality
- **Score Display**: Confirm schema score (0-100) appears with correct color coding:
  - ≥80: Green (Excellent)
  - ≥50: Yellow (Good) 
  - <50: Red (Needs Work)
- **Detected Types**: Check if schema types are shown as badges
- **Issues List**: Verify issues/recommendations are displayed, or "No issues detected" appears
- **Recommended JSON-LD**: Ensure collapsible JSON panel works (Show/Hide)

### 3. Test Actions
- **Copy Button**: Click "Copy JSON" and verify clipboard has the schema
- **Download Button**: Click "Download schema.json" and confirm file downloads
- **Mark as Implemented**: Click to mark as completed (shows toast notification)
- **Refresh**: Click to re-fetch data (button disables while loading)

### 4. Test Error Handling
- **Network Error**: Disable network/break internet to see error state with Retry button
- **Invalid URL**: Use malformed URL to test error handling
- **No Crash**: Ensure page never crashes, always shows friendly error messages

## Expected Behavior

✅ **Loading State**: Shows skeleton with proper min-heights (no layout shift)
✅ **Success State**: Displays score, types, issues, and recommended JSON-LD
✅ **Error State**: Shows friendly message with Retry button
✅ **Accessibility**: All buttons have aria-labels, focus-visible rings work
✅ **No Dependencies**: Uses only existing libraries (no new npm packages)
✅ **Responsive**: Works on mobile and desktop
✅ **No CLS**: Fixed skeleton heights prevent layout shifts