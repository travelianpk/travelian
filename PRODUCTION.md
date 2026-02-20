# Production Deployment Guide

## Pre-Deployment Checklist

### ✅ SEO & Meta Tags
- [x] Enhanced meta tags (title, description, keywords)
- [x] Open Graph tags for social sharing
- [x] Twitter Card tags
- [x] Canonical URLs
- [x] Robots meta tags
- [x] Geo-location tags

### ✅ Files Created/Updated
- [x] `sitemap.xml` - Updated with correct URLs
- [x] `robots.txt` - Enhanced with proper directives
- [x] `manifest.json` - PWA manifest file
- [x] `.htaccess` - Apache server configuration
- [x] Removed dev cache headers from HTML files

### ✅ Server Configuration
- [x] Server routes updated to serve manifest.json
- [x] Production build script created (`build-config.js`)

## Deployment Steps

### 1. Run Production Build
```bash
npm run build:production
```

### 2. Verify Files
- Check that all HTML files have production-ready meta tags
- Verify `sitemap.xml` URLs are correct
- Ensure `robots.txt` is accessible
- Test `manifest.json` is served correctly

### 3. Server Setup

#### Apache (.htaccess)
- Copy `.htaccess` to web root
- Enable mod_rewrite, mod_headers, mod_expires, mod_deflate
- Configure SSL and uncomment HTTPS redirect

#### Nginx
Create similar configuration in your nginx config:
```nginx
# Compression
gzip on;
gzip_types text/html text/css application/javascript application/json image/svg+xml;

# Caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
```

### 4. Environment Variables
Set production environment variables:
```bash
NODE_ENV=production
PORT=5000
AMADEUS_CLIENT_ID=your_production_key
AMADEUS_CLIENT_SECRET=your_production_secret
AMADEUS_HOSTNAME=production
```

### 5. Start Production Server
```bash
npm run start:prod
```

## SEO Verification

### Google Search Console
1. Submit `sitemap.xml` to Google Search Console
2. Verify site ownership
3. Check for crawl errors

### Meta Tags Testing
- Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- Use [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- Use [Google Rich Results Test](https://search.google.com/test/rich-results)

### Performance Testing
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured (.htaccess or nginx)
- [ ] Environment variables secured (not in code)
- [ ] API keys stored securely
- [ ] Regular security updates
- [ ] Backup strategy in place

## Monitoring

- Set up error logging
- Monitor server performance
- Track SEO rankings
- Monitor API usage
- Set up uptime monitoring

## Post-Deployment

1. Test all pages load correctly
2. Verify images load properly
3. Test form submissions
4. Check mobile responsiveness
5. Verify social sharing previews
6. Test search functionality
7. Monitor error logs

## Rollback Plan

Keep previous version available for quick rollback if issues occur.
