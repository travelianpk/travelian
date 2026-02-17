/**
 * Minify inline CSS and JS in all HTML files.
 * Run: node scripts/minify-html-assets.js
 */
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyJs } = require('terser');

const ROOT = path.join(__dirname, '..');
const HTML_FILES = [
  'index.html', 'about.html', 'contact-us.html', 'travel-insurance.html',
  'visit-visa.html', 'study-visa.html', 'umrah-packages.html', 'hotel-bookings.html'
];

async function minifyCss(css) {
  const out = new CleanCSS({ level: 2 }).minify(css);
  if (out.errors && out.errors.length) throw new Error(out.errors.join('; '));
  return out.styles;
}

async function minifyInlineScript(js) {
  try {
    const out = await minifyJs(js, { compress: true, mangle: false, format: { comments: false } });
    return out.code || js;
  } catch (e) {
    console.warn('Terser warning:', e.message);
    return js;
  }
}

async function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const name = path.basename(filePath);

  // Minify <style>...</style>
  const cleanCss = new CleanCSS({ level: 2 });
  html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, content) => {
    const trimmed = content.trim();
    if (!trimmed) return match;
    try {
      const out = cleanCss.minify(trimmed);
      if (out.errors && out.errors.length) return match;
      return '<style>' + out.styles + '</style>';
    } catch (e) {
      console.warn(name, 'CSS:', e.message);
      return match;
    }
  });

  // Minify inline <script> (no src)
  const scriptRegex = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  const parts = [];
  let lastIndex = 0;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    if (m[0].includes(' src=')) {
      lastIndex = m.index + m[0].length;
      continue;
    }
    const before = html.slice(lastIndex, m.index);
    const openTag = m[0].slice(0, m[0].indexOf('>') + 1);
    const content = m[1].trim();
    lastIndex = m.index + m[0].length;
    if (!content) {
      parts.push(before, m[0]);
      continue;
    }
    try {
      const minified = await minifyInlineScript(content);
      parts.push(before, openTag + minified + '</script>');
    } catch (e) {
      parts.push(before, m[0]);
    }
  }
  if (parts.length) {
    parts.push(html.slice(lastIndex));
    html = parts.join('');
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Minified:', name);
}

(async () => {
  for (const f of HTML_FILES) {
    const full = path.join(ROOT, f);
    if (fs.existsSync(full)) await processFile(full);
  }
  console.log('Done.');
})();
