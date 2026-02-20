/**
 * Optimize banner images: resize to 1920x600 (cover), convert to WebP and compressed fallback
 * Target: ~200-300KB per image for fast loading
 */
const fs = require('fs');
const path = require('path');

const BANNER_WIDTH = 1920;
const BANNER_HEIGHT = 600;
const QUALITY_WEBP = 85;
const QUALITY_JPEG = 85;
const QUALITY_PNG = 80;

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');
const BANNERS = [
  { src: 'Homepagebanner.png', outWebp: 'Homepagebanner.webp', outFallback: 'Homepagebanner-opt.jpg' },
  { src: 'visit-visa banner.png', outWebp: 'visit-visa-banner-opt.webp', outFallback: 'visit-visa-banner-opt.jpg' },
  { src: 'studybanner.png', outWebp: 'studybanner.webp', outFallback: 'studybanner-opt.jpg' },
  { src: 'travel insurence ban.png', outWebp: 'travel-insurance-banner.webp', outFallback: 'travel-insurance-banner-opt.jpg' },
  { src: 'About Us Website Banner.jpg', outWebp: 'about-banner.webp', outFallback: 'about-banner-opt.jpg' },
  { src: 'CONTACT US BANNER.png', outWebp: 'contact-banner.webp', outFallback: 'contact-banner-opt.jpg' },
  { src: 'umrah_banner.png', outWebp: 'umrah-banner.webp', outFallback: 'umrah-banner-opt.jpg' },
  { src: 'hotel banner.png', outWebp: 'hotel-banner.webp', outFallback: 'hotel-banner-opt.jpg' },
  { src: 'booking hotel.png', outWebp: 'booking-hotel-banner.webp', outFallback: 'booking-hotel-banner-opt.jpg' },
];

async function optimize() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('Run: npm install sharp');
    process.exit(1);
  }

  const resizePipe = (src) =>
    sharp(src)
      .resize(BANNER_WIDTH, BANNER_HEIGHT, { fit: 'cover', position: 'center' })
      .rotate();

  for (const b of BANNERS) {
    const srcPath = path.join(IMAGES_DIR, b.src);
    if (!fs.existsSync(srcPath)) {
      console.warn('Skip (not found):', b.src);
      continue;
    }
    const ext = path.extname(b.src).toLowerCase();
    const webpPath = path.join(IMAGES_DIR, b.outWebp);
    const fallbackPath = path.join(IMAGES_DIR, b.outFallback);

    try {
      const buf = await resizePipe(srcPath).webp({ quality: QUALITY_WEBP }).toBuffer();
      fs.writeFileSync(webpPath, buf);
      console.log('Created:', b.outWebp, '(' + (buf.length / 1024).toFixed(1) + ' KB)');

      const fallbackExt = path.extname(b.outFallback).toLowerCase();
      if (fallbackExt === '.jpg' || fallbackExt === '.jpeg') {
        await resizePipe(srcPath).jpeg({ quality: QUALITY_JPEG }).toFile(fallbackPath);
      } else {
        await resizePipe(srcPath).png({ compressionLevel: 9 }).toFile(fallbackPath);
      }
      const stat = fs.statSync(fallbackPath);
      console.log('Created:', b.outFallback, '(' + (stat.size / 1024).toFixed(1) + ' KB)');
    } catch (err) {
      console.error('Error:', b.src, err.message);
    }
  }
  console.log('Done.');
}

optimize().catch(console.error);
