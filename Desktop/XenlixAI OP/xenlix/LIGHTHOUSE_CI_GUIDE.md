# 🔍 Lighthouse CI Setup

This project includes Lighthouse CI integration for automated performance, SEO, and accessibility testing.

## ✅ What's Included

### 📦 Dependencies
- `@lhci/cli` - Lighthouse CI command line tool
- Configuration files: `lighthouserc.json` and `.lighthouserc.js`

### 📊 Performance Thresholds
- **Performance**: ≥90% (ERROR if below)
- **SEO**: ≥90% (ERROR if below) 
- **Accessibility**: ≥90% (WARNING if below)
- **Best Practices**: ≥90% (WARNING if below)

### 🚀 Core Web Vitals Limits
- **First Contentful Paint**: ≤2000ms (WARNING)
- **Largest Contentful Paint**: ≤4000ms (ERROR)
- **Cumulative Layout Shift**: ≤0.1 (ERROR)
- **Speed Index**: ≤3000ms (WARNING)
- **Time to Interactive**: ≤5000ms (WARNING)

## 🛠️ Available Scripts

### Local Testing
```bash
# Run complete Lighthouse CI audit
pnpm lhci

# Just collect performance data
pnpm lhci:collect

# Run assertions on collected data
pnpm lhci:assert

# Upload reports to filesystem
pnpm lhci:upload
```

### Alternative Testing
```bash
# Run existing Lighthouse audit (works with dev server)
pnpm audit:lighthouse

# Check Chrome installation
pnpm lighthouse:check

# Lighthouse version info
pnpm lighthouse:version
```

## 🤖 CI/CD Integration

### GitHub Actions
The project includes `.github/workflows/lighthouse-ci.yml` that:
- Runs on push/PR to main/develop branches
- Builds the application 
- Starts production server
- Executes Lighthouse CI audits
- Comments PR with performance scores
- Uploads reports as artifacts

### Report Storage
- **Local**: `./lhci_reports/` directory
- **CI**: GitHub Actions artifacts (30-day retention)

## 📋 Usage Guidelines

### Before Pushing Code
```bash
# 1. Start your development server
pnpm dev

# 2. Run Lighthouse audit in another terminal  
pnpm audit:lighthouse

# 3. Check reports in ./reports/ directory
# 4. Fix any performance issues before committing
```

### Performance Standards
- **Must Pass**: Performance ≥90%, SEO ≥90%
- **Should Pass**: Accessibility ≥90%, Best Practices ≥90%
- **Core Web Vitals**: All metrics within limits

### Troubleshooting

#### LHCI Build Errors
If `pnpm lhci` fails:
1. Use `pnpm audit:lighthouse` instead (works with dev server)
2. Check server is running on http://localhost:3000
3. Verify Chrome is installed: `pnpm lighthouse:check`

#### Low Scores
Common fixes for poor scores:
- **Performance**: Optimize images, reduce bundle size, lazy load components
- **SEO**: Add meta descriptions, proper heading structure, alt tags
- **Accessibility**: Add ARIA labels, ensure keyboard navigation, color contrast
- **Best Practices**: Enable HTTPS, remove console logs, update dependencies

#### CI/CD Issues
- Check GitHub Actions logs for detailed error messages
- Ensure all dependencies are in package.json
- Verify server starts properly in CI environment

## 🔧 Configuration Files

### `lighthouserc.json`
Main CI configuration with strict thresholds for automated testing.

### `.lighthouserc.js` 
Flexible configuration with environment variables for different scenarios.

## 📈 Report Analysis

### Reading Results
- **Green (90-100)**: Excellent performance
- **Orange (50-89)**: Needs improvement  
- **Red (0-49)**: Poor performance, requires attention

### Key Metrics Focus
1. **Performance Score**: Overall loading speed
2. **Core Web Vitals**: User experience metrics
3. **SEO Score**: Search engine optimization
4. **Accessibility**: Usability for all users

## 🎯 Goals

- Maintain 90%+ performance on all pages
- Achieve 90%+ SEO scores consistently  
- Ensure accessibility compliance
- Monitor performance regressions in CI/CD