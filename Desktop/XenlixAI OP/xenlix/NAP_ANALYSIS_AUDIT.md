# NAP Analysis & Local SEO Audit - XenlixAI

## Current Website NAP Status

### ✅ **Name Consistency**
- **Primary**: XenlixAI
- **Legal**: XenlixAI LLC
- **Status**: ✅ CONSISTENT across all pages

### ❌ **Address Information**
- **Current**: Dallas, TX, US (partial only)
- **Missing**: Complete street address
- **Schema Location**: `/src/app/layout.tsx` (organization schema)
- **Status**: ❌ INCOMPLETE - needs full address

### ❌ **Phone Number**
- **Current**: NOT FOUND
- **Schema**: No telephone field in organization schema
- **Contact Page**: No phone display
- **Status**: ❌ MISSING ENTIRELY

### ❌ **Business Hours**
- **Current**: NOT FOUND
- **Schema**: No openingHours field
- **Status**: ❌ MISSING ENTIRELY

### ❌ **Email Address**
- **Current**: NOT FOUND publicly
- **Contact**: Only contact form available
- **Status**: ❌ MISSING PUBLIC EMAIL

## Required Google Business Profile Research

### **Action Items for Manual Research:**

1. **Verify GBP Existence**
   - Search "XenlixAI" on Google Maps
   - Search "XenlixAI Dallas" on Google
   - Check if business listing exists

2. **If GBP Exists - Document Exact Data:**
   ```
   Business Name: ___________________
   Street Address: __________________
   City: Dallas
   State: TX
   ZIP Code: _______
   Phone: __________________________
   Website: https://www.xenlixai.com
   Business Hours:
   - Monday: ____________________
   - Tuesday: ___________________
   - Wednesday: _________________
   - Thursday: __________________
   - Friday: ____________________
   - Saturday: __________________
   - Sunday: ____________________
   Business Category: ______________
   ```

3. **If GBP Doesn't Exist - Establish Canonical NAP:**
   - Determine official business address
   - Establish primary phone number
   - Define business hours
   - Create consistent formatting standards

## Website Implementation Requirements

### **Current Organization Schema (layout.tsx)**
```json
{
  "@type": "Organization",
  "name": "XenlixAI",
  "legalName": "XenlixAI LLC",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Dallas",
    "addressRegion": "TX", 
    "addressCountry": "US"
    // MISSING: streetAddress, postalCode
  }
  // MISSING: telephone, email, openingHours
}
```

### **Required Schema Enhancements**
```json
{
  "@type": "LocalBusiness", // Changed from Organization
  "name": "XenlixAI",
  "legalName": "XenlixAI LLC",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[TO BE DETERMINED]",
    "addressLocality": "Dallas",
    "addressRegion": "TX",
    "postalCode": "[TO BE DETERMINED]",
    "addressCountry": "US"
  },
  "telephone": "[TO BE DETERMINED]",
  "email": "[TO BE DETERMINED]",
  "openingHours": [
    "[TO BE DETERMINED]"
  ],
  "sameAs": [
    "https://business.google.com/[GBP_URL]",
    "https://x.com/xenlixai",
    "https://www.linkedin.com/company/xenlixai"
  ]
}
```

## Pages Requiring NAP Implementation

### **1. Contact Page** (`/src/app/contact/page.tsx`)
- ❌ Currently: Only contact form
- ✅ Needs: Full NAP display with schema

### **2. Footer Component** (NOT FOUND)
- ❌ Currently: No footer with NAP
- ✅ Needs: Site-wide footer with consistent NAP

### **3. Dallas Location Page** (`/src/app/dallas/page.tsx`)
- ❌ Currently: Generic local business schema
- ✅ Needs: XenlixAI-specific NAP data

### **4. Root Layout** (`/src/app/layout.tsx`)
- ⚠️ Currently: Partial address in organization schema
- ✅ Needs: Complete LocalBusiness schema

## Local SEO Implementation Plan

### **Phase 1: NAP Establishment**
1. Research/confirm Google Business Profile data
2. Establish canonical NAP format
3. Document official business hours
4. Verify sameAs URLs (GBP, social profiles)

### **Phase 2: Website Implementation**
1. Update organization schema to LocalBusiness
2. Add complete NAP to contact page
3. Create site-wide footer with NAP
4. Update Dallas location page schema
5. Add structured data testing

### **Phase 3: Local Citations**
1. Ensure GBP is complete and verified
2. Add sameAs references to GBP in schema
3. Verify consistency across all local directories
4. Implement local business markup validation

## NAP Formatting Standards

### **Phone Number Format**
- **Schema**: "+1-XXX-XXX-XXXX" (E.164 format)
- **Display**: "(XXX) XXX-XXXX" (US format)
- **Links**: "tel:+1XXXXXXXXXX" (no spaces/dashes)

### **Address Format**
- **Schema**: Separate fields (streetAddress, city, state, zip)
- **Display**: "Street Address, City, State ZIP"
- **Consistency**: Exact match with GBP formatting

### **Hours Format**
- **Schema**: "Mo-Fr 09:00-17:00" (ISO format)
- **Display**: "Monday - Friday: 9:00 AM - 5:00 PM"
- **Time Zone**: Specify "CST" for Dallas location

## Next Steps

1. **Manual Research Required**:
   - Search for existing Google Business Profile
   - Gather official business registration data
   - Confirm operating hours and contact info

2. **Technical Implementation**:
   - Update schema markup with complete NAP
   - Add NAP display to contact page
   - Create consistent footer component
   - Test structured data validation

3. **Local SEO Optimization**:
   - Verify/create Google Business Profile
   - Ensure citation consistency
   - Add local business schema markup
   - Test social sharing with location data

## Success Metrics

- ✅ 100% NAP consistency across website and GBP
- ✅ Valid LocalBusiness schema markup
- ✅ Contact information visible on key pages
- ✅ Google Business Profile optimized and verified
- ✅ Local citations consistent across directories