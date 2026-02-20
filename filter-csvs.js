/**
 * Filter CSV files to keep only IATA airport codes used in routes.csv
 * Run: node filter-csvs.js
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;

// 1. Read routes and extract unique airport codes + airline codes
const routesLines = fs.readFileSync(path.join(root, 'routes.csv'), 'utf-8').split(/\r?\n/).filter(Boolean);
const header = routesLines[0];
const airportCodes = new Set();
const airlineCodes = new Set();

for (let i = 1; i < routesLines.length; i++) {
  const cols = routesLines[i].split(',').map(s => s.trim());
  if (cols.length >= 4) {
    airportCodes.add((cols[2] || '').toUpperCase());
    airportCodes.add((cols[3] || '').toUpperCase());
    airlineCodes.add((cols[1] || '').toUpperCase());
  }
}

console.log('Keeping airport codes:', [...airportCodes].sort().join(', '));
console.log('Keeping airline codes:', [...airlineCodes].sort().join(', '));

// 2. Filter airports.csv (no header, column 5 is IATA)
const airportsLines = fs.readFileSync(path.join(root, 'airports.csv'), 'utf-8').split(/\r?\n/).filter(Boolean);
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += c;
  }
  result.push(current);
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

const airportsFiltered = airportsLines.filter(line => {
  const cols = parseCSVLine(line);
  const iata = (cols[4] || '').trim().toUpperCase();
  return iata && airportCodes.has(iata);
});
fs.writeFileSync(path.join(root, 'airports.csv'), airportsFiltered.join('\n') + '\n', 'utf-8');
console.log('airports.csv: kept', airportsFiltered.length, 'of', airportsLines.length);

// 3. Filter routes.csv - keep only where both source and dest are in airportCodes
const routesFiltered = [header];
for (let i = 1; i < routesLines.length; i++) {
  const cols = routesLines[i].split(',').map(s => s.trim());
  if (cols.length >= 4) {
    const src = (cols[2] || '').toUpperCase();
    const dest = (cols[3] || '').toUpperCase();
    if (airportCodes.has(src) && airportCodes.has(dest)) {
      routesFiltered.push(routesLines[i]);
    }
  }
}
fs.writeFileSync(path.join(root, 'routes.csv'), routesFiltered.join('\n') + '\n', 'utf-8');
console.log('routes.csv: kept', routesFiltered.length - 1, 'of', routesLines.length - 1);

// 4. Filter airlines.csv - keep only airlines used in filtered routes
const airlinesLines = fs.readFileSync(path.join(root, 'airlines.csv'), 'utf-8').split(/\r?\n/).filter(Boolean);
const airlinesHeader = airlinesLines[0];
const airlinesFiltered = [airlinesHeader];
for (let i = 1; i < airlinesLines.length; i++) {
  const cols = parseCSVLine(airlinesLines[i]);
  const iata = (cols[2] || '').trim().toUpperCase();
  if (iata && airlineCodes.has(iata)) {
    airlinesFiltered.push(airlinesLines[i]);
  }
}
fs.writeFileSync(path.join(root, 'airlines.csv'), airlinesFiltered.join('\n') + '\n', 'utf-8');
console.log('airlines.csv: kept', airlinesFiltered.length - 1, 'of', airlinesLines.length - 1);

console.log('Done.');
