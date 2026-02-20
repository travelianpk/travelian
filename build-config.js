/**
 * Production Build Configuration
 * Run this script to prepare the project for production deployment
 */

const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

// List of HTML files to process
const htmlFiles = [
  'index.html',
  'src/pages/about.html',
  'src/pages/contact-us.html',
  'src/pages/hotel-bookings.html',
  'src/pages/study-visa.html',
  'src/pages/travel-insurance.html',
  'src/pages/umrah-packages.html',
  'src/pages/visit-visa.html',
  'src/pages/flight-results.html',
];

function removeDevCacheHeaders(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const updated = content
    .replace(/<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" \/>/g, '')
    .replace(/<meta http-equiv="Pragma" content="no-cache" \/>/g, '')
    .replace(/<meta http-equiv="Expires" content="0" \/>/g, '');
  
  if (content !== updated) {
    fs.writeFileSync(filePath, updated, 'utf-8');
    console.log(`✓ Removed dev cache headers from ${filePath}`);
  }
}

function addProductionCacheHeaders(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Add production cache headers after viewport meta tag
  if (!content.includes('Cache-Control') && content.includes('viewport')) {
    const updated = content.replace(
      /(<meta name="viewport"[^>]*>)/,
      '$1\n  <meta http-equiv="Cache-Control" content="public, max-age=31536000, immutable" />'
    );
    fs.writeFileSync(filePath, updated, 'utf-8');
    console.log(`✓ Added production cache headers to ${filePath}`);
  }
}

console.log('🚀 Preparing project for production build...\n');

// Process all HTML files
htmlFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    removeDevCacheHeaders(filePath);
    // Note: Production cache headers are typically set by the web server/CDN
    // Uncomment the next line if you want to add them to HTML files
    // addProductionCacheHeaders(filePath);
  } else {
    console.log(`⚠ File not found: ${file}`);
  }
});

console.log('\n✅ Production build preparation complete!');
console.log('\n📋 Next steps:');
console.log('   1. Test all pages in production mode');
console.log('   2. Verify SEO meta tags are correct');
console.log('   3. Check sitemap.xml and robots.txt');
console.log('   4. Enable compression and caching on your web server');
console.log('   5. Set up HTTPS and security headers');
