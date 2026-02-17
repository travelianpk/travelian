/**
 * Compress raster images and convert large ones to WebP.
 * Skips SVGs and images in node_modules, server, and "United States*".
 * Run: node scripts/optimize-images.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = ['node_modules', 'server', 'United States of America – HR Pakistan_files', '.git'];
const MIN_SIZE_FOR_WEBP = 30 * 1024; // 30KB – create WebP for files larger than this
const EXTENSIONS = /\.(png|jpe?g|gif)$/i;

function getAllRasterImages(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.some(s => e.name.includes(s))) getAllRasterImages(full, list);
    } else if (EXTENSIONS.test(e.name)) {
      list.push(full);
    }
  }
  return list;
}

async function processImage(filePath) {
  const rel = path.relative(ROOT, filePath);
  const ext = path.extname(filePath).toLowerCase();
  const base = filePath.slice(0, -ext.length);
  const webpPath = base + '.webp';

  try {
    const stat = fs.statSync(filePath);
    const buf = fs.readFileSync(filePath);
    let pipeline = sharp(buf);
    const meta = await pipeline.metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;

    // Compress and overwrite original (for PNG/JPEG/GIF)
    if (ext === '.png') {
      await sharp(buf)
        .png({ quality: 85, compressionLevel: 9, effort: 10 })
        .toFile(filePath + '.tmp');
      fs.renameSync(filePath + '.tmp', filePath);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(buf)
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(filePath + '.tmp');
      fs.renameSync(filePath + '.tmp', filePath);
    } else if (ext === '.gif') {
      // GIF: only create WebP if large; avoid re-encoding animated GIFs
      const size = stat.size;
      if (size >= MIN_SIZE_FOR_WEBP) {
        await sharp(buf).webp({ quality: 82 }).toFile(webpPath);
        console.log('  WebP: ' + path.relative(ROOT, webpPath));
      }
      return;
    }

    const newStat = fs.statSync(filePath);
    console.log('  Compressed: ' + rel + ' ' + (stat.size / 1024).toFixed(1) + 'KB -> ' + (newStat.size / 1024).toFixed(1) + 'KB');

    // Create WebP for larger rasters (or if dimensions are large)
    if (stat.size >= MIN_SIZE_FOR_WEBP || (width > 800 || height > 600)) {
      await sharp(filePath)
        .webp({ quality: 82, effort: 6 })
        .toFile(webpPath);
      const wpStat = fs.statSync(webpPath);
      console.log('  WebP: ' + path.relative(ROOT, webpPath) + ' ' + (wpStat.size / 1024).toFixed(1) + 'KB');
    }
  } catch (err) {
    console.error('  Error ' + rel + ': ' + err.message);
  }
}

async function main() {
  const files = getAllRasterImages(ROOT);
  console.log('Found ' + files.length + ' raster images.');
  for (const f of files) {
    await processImage(f);
  }
  console.log('Done.');
}

main();
