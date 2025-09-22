# NAP Comparison Sheet - XenlixAI Local SEO

## Executive Summary
**Status**: ❌ CRITICAL - Website lacks complete NAP information required for local SEO  
**Priority**: HIGH - Immediate action required for local search visibility  
**Impact**: Missing NAP data prevents local ranking and citation building  

---

## NAP Comparison Matrix

| Element | Current Website | Required/GBP Standard | Status | Action Required |
|---------|----------------|----------------------|---------|-----------------|
| **Business Name** | ✅ XenlixAI / XenlixAI LLC | [TO BE VERIFIED] | ✅ CONSISTENT | Verify exact match with GBP |
| **Street Address** | ❌ MISSING | [TO BE DETERMINED] | ❌ CRITICAL | Add complete street address |
| **City** | ✅ Dallas | Dallas | ✅ CONSISTENT | Maintain consistency |
| **State** | ✅ TX | TX | ✅ CONSISTENT | Maintain consistency |
| **ZIP Code** | ❌ MISSING | [TO BE DETERMINED] | ❌ CRITICAL | Add postal code |
| **Country** | ✅ US | US | ✅ CONSISTENT | Maintain consistency |
| **Phone Number** | ❌ MISSING ENTIRELY | [TO BE DETERMINED] | ❌ CRITICAL | Add primary phone number |
| **Email Address** | ❌ MISSING PUBLICLY | [TO BE DETERMINED] | ❌ HIGH | Add contact email |
| **Business Hours** | ❌ MISSING ENTIRELY | [TO BE DETERMINED] | ❌ HIGH | Add operating hours |
| **Website URL** | ✅ https://www.xenlixai.com | https://www.xenlixai.com | ✅ CONSISTENT | Maintain consistency |

---

## Implementation Priority Matrix

### 🔴 **CRITICAL (Immediate Action Required)**
1. **Complete Street Address**
   - Current: Only "Dallas, TX, US"
   - Required: Full street address with ZIP
   - Impact: Required for local search ranking

2. **Primary Phone Number**
   - Current: None found
   - Required: Local Dallas phone number
   - Impact: Essential for local business credibility

### 🟡 **HIGH (Within 48 Hours)**
3. **Business Hours**
   - Current: None specified
   - Required: Complete operating schedule
   - Impact: Affects local search and user experience

4. **Public Email Address**
   - Current: Hidden behind contact form
   - Required: Public contact email
   - Impact: Improves accessibility and citations

### 🟢 **MEDIUM (Within 1 Week)**
5. **GBP Verification & Optimization**
   - Research existing Google Business Profile
   - Claim/verify if not owned
   - Optimize with complete information

---

## Data Collection Template

### **Manual Research Required**
```
STEP 1: Google Business Profile Research
□ Search "XenlixAI" on Google Maps
□ Search "XenlixAI Dallas" on Google
□ Check if business listing exists
□ Document current GBP data if found

STEP 2: Business Registration Verification
□ Confirm legal business name
□ Verify registered business address
□ Confirm primary phone number
□ Document operating hours

STEP 3: Competitive Analysis
□ Research similar Dallas AI/marketing companies
□ Document NAP formatting standards
□ Identify local citation opportunities
```

### **Canonical NAP Template (To Be Filled)**
```
Business Name: XenlixAI
Legal Name: XenlixAI LLC
Street Address: ________________________________
City: Dallas
State: Texas
ZIP Code: _______________
Phone: (____)___-____
Email: info@xenlixai.com (suggested)
Website: https://www.xenlixai.com

Business Hours:
Monday: _______________________
Tuesday: ______________________
Wednesday: ____________________
Thursday: _____________________
Friday: _______________________
Saturday: _____________________
Sunday: _______________________

Business Category: Marketing Agency / AI Marketing Services
```

---

## Current Website Locations Audit

### **1. Root Layout (`/src/app/layout.tsx`)**
```json
// CURRENT SCHEMA
{
  "@type": "Organization",
  "address": {
    "addressLocality": "Dallas",
    "addressRegion": "TX",
    "addressCountry": "US"
    // MISSING: streetAddress, postalCode
  }
  // MISSING: telephone, email, openingHours
}
```

**Status**: ❌ Incomplete - Missing critical NAP elements

### **2. Contact Page (`/src/app/contact/page.tsx`)**
- **NAP Display**: ❌ None found
- **Contact Form**: ✅ Present
- **Local Info**: ❌ No address/phone shown

**Status**: ❌ Missing NAP display

### **3. Dallas Location Page (`/src/app/dallas/page.tsx`)**
```json
// CURRENT SCHEMA
"name": "XenlixAI Dallas",
"address": {
  "city": "Dallas",
  "state": "TX"
  // MISSING: streetAddress, postalCode
}
```

**Status**: ❌ Incomplete local business data

### **4. Footer Component**
- **Status**: ❌ NO FOOTER FOUND
- **NAP Display**: ❌ Not implemented
- **Impact**: Missing site-wide NAP visibility

---

## Implementation Checklist

### **Phase 1: Data Gathering (Manual)**
- [ ] Research existing Google Business Profile
- [ ] Confirm business registration details
- [ ] Establish canonical phone number
- [ ] Determine operating hours
- [ ] Verify business category/description

### **Phase 2: Schema Updates**
- [ ] Convert Organization schema to LocalBusiness
- [ ] Add complete address with ZIP code
- [ ] Add telephone number in E.164 format
- [ ] Add email contact point
- [ ] Add openingHours specification
- [ ] Add sameAs references to GBP

### **Phase 3: Website Implementation**
- [ ] Add NAP display to contact page
- [ ] Create site-wide footer with NAP
- [ ] Update Dallas location page schema
- [ ] Add structured data testing
- [ ] Implement click-to-call functionality

### **Phase 4: Local SEO Optimization**
- [ ] Verify/optimize Google Business Profile
- [ ] Add GBP URL to sameAs array
- [ ] Test structured data with Google's tools
- [ ] Monitor local search visibility
- [ ] Build consistent local citations

---

## Expected Outcomes

### **Before Implementation**
- ❌ No local search visibility
- ❌ Missing from local directories
- ❌ Incomplete business information
- ❌ Poor local SEO signals

### **After Implementation**
- ✅ Complete NAP consistency
- ✅ Enhanced local search ranking
- ✅ Valid LocalBusiness schema
- ✅ Improved user trust/credibility
- ✅ Foundation for citation building

---

## Next Action Items

1. **IMMEDIATE**: Gather business registration data and establish canonical NAP
2. **24 HOURS**: Implement basic NAP display on contact page
3. **48 HOURS**: Update all schema markup with complete data
4. **1 WEEK**: Create comprehensive footer and test all implementations
5. **ONGOING**: Monitor local search performance and citation opportunities

**Contact Required**: Business owner/admin to provide official NAP data for implementation.