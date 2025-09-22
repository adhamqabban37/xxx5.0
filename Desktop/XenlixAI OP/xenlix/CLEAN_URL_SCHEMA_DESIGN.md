# 🎯 Clean URL Schema Design

## 📋 **Standardized Route Patterns**

### **1. Results Pages (Path-Based)**
```
🎯 GOAL: Consistent, clean, human-readable result URLs

Current Mixed Patterns:
❌ /aeo/results?id=123 (query-based)
❌ /seo/results?id=456 (query-based, BROKEN)
✅ /aeo-results/[auditId] (path-based, working)

New Unified Schema:
✅ /aeo/results/[id] → /aeo/results/abc123
✅ /seo/results/[id] → /seo/results/def456
✅ /audit/results/[id] → /audit/results/ghi789 (future-proof)
```

### **2. Dynamic Content Pages (Keep Current ✅)**
```
✅ /[city] → /dallas, /new-york
✅ /case-studies/[slug] → /case-studies/auto-detailing-dallas
✅ /tools/[tool] → /tools/json-ld
✅ /calculators/[type] → /calculators/roi
```

### **3. API Routes (Keep Current ✅)**
```
✅ /api/analyze-content?url=... (appropriate for APIs)
✅ /api/local-seo?city=... (functional parameters)
✅ /api/auth/[...nextauth] (NextAuth pattern)
```

---

## 🔧 **Route Structure Design**

### **A. SEO Results Route (CRITICAL - Missing)**
```typescript
📁 /src/app/seo/results/[id]/page.tsx
📁 /src/app/seo/results/[id]/route.ts (optional API)

URL Pattern: /seo/results/def456
Parameters: { id: 'def456' }
```

### **B. AEO Results Route (Standardization)**
```typescript
📁 /src/app/aeo/results/[id]/page.tsx (NEW)
📁 /src/app/aeo-results/[auditId]/page.tsx (MIGRATE CONTENT)

URL Pattern: /aeo/results/abc123
Parameters: { id: 'abc123' }
```

### **C. Summary Pages (Consistency)**
```typescript
✅ /src/app/aeo/summary/page.tsx (keep)
✅ /src/app/seo/summary/page.tsx (create if needed)

URL Pattern: /aeo/summary, /seo/summary
```

---

## 🚦 **Redirect Strategy**

### **301 Permanent Redirects**
```nginx
# Query-based to path-based migration
/aeo/results?id=abc123 → 301 → /aeo/results/abc123
/seo/results?id=def456 → 301 → /seo/results/def456

# Legacy route consolidation  
/aeo-results/abc123 → 301 → /aeo/results/abc123
```

### **Middleware Implementation**
```typescript
// middleware.ts enhancement
if (pathname.startsWith('/aeo/results') && searchParams.has('id')) {
  return NextResponse.redirect(`/aeo/results/${searchParams.get('id')}`)
}

if (pathname.startsWith('/seo/results') && searchParams.has('id')) {
  return NextResponse.redirect(`/seo/results/${searchParams.get('id')}`)
}
```

---

## 📂 **File Structure Changes**

### **New Route Files Required**
```
📁 src/app/seo/results/[id]/
  ├── page.tsx (main results page)
  ├── loading.tsx (loading state)
  └── error.tsx (error boundary)

📁 src/app/aeo/results/[id]/
  ├── page.tsx (migrated content)
  ├── loading.tsx (loading state)
  └── error.tsx (error boundary)
```

### **Content Migration Plan**
```
1. Copy /aeo-results/[auditId]/page.tsx → /aeo/results/[id]/page.tsx
2. Update parameter name: auditId → id
3. Create new /seo/results/[id]/page.tsx based on AEO pattern
4. Add redirect from old /aeo-results/ to new /aeo/results/
```

---

## 🔗 **Internal Link Updates**

### **Router.push() Changes Required**
```typescript
// In /seo/audit/page.tsx
Before: router.push(`/seo/results?id=${result.auditId}`);
After:  router.push(`/seo/results/${result.auditId}`);

// In AEO components  
Before: router.push(`/aeo/results?id=${analysisId}`);
After:  router.push(`/aeo/results/${analysisId}`);
```

### **Link Components**
```typescript
// Update all <Link> components
Before: <Link href={`/aeo/results?id=${id}`}>
After:  <Link href={`/aeo/results/${id}`}>
```

---

## 🎨 **URL Formatting Standards**

### **ID Format Requirements**
```
✅ Alphanumeric: abc123, def456
✅ UUID format: 550e8400-e29b-41d4-a716-446655440000  
✅ Short codes: XeN7k9, AeO2m8
❌ Special characters: @, #, %, spaces
```

### **Trailing Slash Policy**
```
✅ Consistent: /aeo/results/123 (no trailing slash)
✅ Root exception: / (homepage keeps slash)
❌ Inconsistent: /aeo/results/123/ (avoid)
```

### **Case Sensitivity**
```
✅ Lowercase: /seo/results/abc123
✅ Kebab-case: /case-studies/auto-detailing
❌ CamelCase: /seoResults/ABC123
❌ Mixed: /SEO/Results/Abc123
```

---

## ✅ **Implementation Checklist**

### **Phase 1: Critical Fixes**
- [ ] Create `/seo/results/[id]/page.tsx` (fixes 404s)
- [ ] Add redirect middleware for query→path migration
- [ ] Update SEO audit router.push() call

### **Phase 2: Standardization**  
- [ ] Create `/aeo/results/[id]/page.tsx`
- [ ] Migrate content from `/aeo-results/[auditId]`
- [ ] Add 301 redirects for legacy routes

### **Phase 3: Polish**
- [ ] Update all internal navigation links
- [ ] Add loading and error states
- [ ] Test canonical URL generation

---

## 🎯 **Expected Outcomes**

### **User Experience**
- ✅ **Bookmarkable URLs**: /seo/results/def456 
- ✅ **Shareable links**: Clean, professional appearance
- ✅ **No 404 errors**: All audit flows work properly

### **SEO Benefits**
- ✅ **Better crawlability**: Path-based structure preferred
- ✅ **URL consistency**: Reduces duplicate content issues  
- ✅ **Clean canonicals**: Match rendered URL patterns

### **Developer Experience**
- ✅ **Predictable routing**: Consistent patterns across app
- ✅ **Type safety**: Proper parameter validation
- ✅ **Maintainable**: Clear file organization

---

**READY FOR IMPLEMENTATION** → Next: Create missing route files and fix critical 404 issues