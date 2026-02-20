import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || 'YOUR_API_KEY';
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || 'YOUR_API_SECRET';
const AMADEUS_HOST = (process.env.AMADEUS_HOSTNAME || 'test') === 'production'
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';
// Self-service API keys from Amadeus "My Self-Service Workspace" are TEST keys – use test host
const AMADEUS_TEST_HOST = 'https://test.api.amadeus.com';

const AVIATIONSTACK_ACCESS_KEY = process.env.AVIATIONSTACK_ACCESS_KEY || '';

// Log config on startup (hide secrets)
console.log('Amadeus host:', AMADEUS_HOST);
console.log('Client ID set:', !!AMADEUS_CLIENT_ID && AMADEUS_CLIENT_ID !== 'YOUR_API_KEY');
console.log('AviationStack key set:', !!AVIATIONSTACK_ACCESS_KEY);

app.use(express.json());
app.use(cors({ origin: true, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));

// Serve main site from parent folder (open http://localhost:5000/)
const staticRoot = join(__dirname, '..');
app.get('/', (req, res) => res.sendFile(join(staticRoot, 'index.html')));
app.get('/about.html', (req, res) => res.sendFile(join(staticRoot, 'about.html')));
app.get('/flight-results.html', (req, res) => res.sendFile(join(staticRoot, 'flight-results.html')));
app.use(express.static(staticRoot));

// Get OAuth token (optional baseUrl – defaults to AMADEUS_HOST)
async function getAmadeusToken(baseUrl) {
  const host = baseUrl || AMADEUS_HOST;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: AMADEUS_CLIENT_ID,
    client_secret: AMADEUS_CLIENT_SECRET,
  });
  const res = await fetch(`${host}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[Amadeus Auth FAILED]', res.status, JSON.stringify(data, null, 2));
    throw { status: res.status, data };
  }
  return data.access_token;
}

// ========== 0. Airports list (for departure/destination dropdowns) ==========
// Load from mainairports.csv: Country, City, Airport Name, IATA Code
function loadAirportsFromMain() {
  try {
    const csvPath = join(__dirname, '..', 'mainairports.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const country = (cols[0] || '').trim();
      const city = (cols[1] || '').trim();
      const name = (cols[2] || '').trim();
      const iata = (cols[3] || '').trim();
      if (!iata || iata === '\\N') continue;
      data.push({ name: name || city, city, country, code: iata, iataCode: iata });
    }
    return data;
  } catch (err) {
    console.error('[mainairports]', err.message);
    return [];
  }
}

function loadAirportsForApi() {
  const list = loadAirportsFromMain();
  const departure = [];
  const arrival = [];
  for (const a of list) {
    const item = { name: a.name || a.city, code: a.code };
    if ((a.country || '').toLowerCase() === 'pakistan') {
      departure.push(item);
    } else {
      arrival.push(item);
    }
  }
  if (departure.length === 0 && arrival.length === 0) {
    return {
      departure: [{ name: 'Karachi', code: 'KHI' }, { name: 'Lahore', code: 'LHE' }, { name: 'Islamabad', code: 'ISB' }],
      arrival: [{ name: 'Dubai', code: 'DXB' }, { name: 'Doha', code: 'DOH' }, { name: 'London', code: 'LHR' }]
    };
  }
  return { departure, arrival };
}

app.get('/api/airports', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(loadAirportsForApi());
});

// Airports from mainairports.csv for From/To autocomplete
app.get('/api/airports-csv', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const list = loadAirportsFromMain();
    const data = list.map(a => ({
      name: (a.name || a.city || '').trim(),
      city: (a.city || '').trim(),
      country: (a.country || '').trim(),
      iataCode: a.code
    }));
    res.json({ data });
  } catch (err) {
    console.error('[airports-csv]', err);
    res.json({ data: [] });
  }
});

// Search airports by keyword – Amadeus API with static fallback
function searchFromStatic(keyword) {
  const k = (keyword || '').toLowerCase();
  const ap = loadAirportsForApi();
  const all = [...ap.departure, ...ap.arrival];
  return all.filter(a => (a.name || '').toLowerCase().includes(k) || (a.code || '').toLowerCase().includes(k));
}

app.get('/api/city-and-airport-search/:parameter', async (req, res) => {
  const keyword = (req.params.parameter || '').trim();
  const fallbackData = () => {
    try {
      const ap = loadAirportsForApi();
      return searchFromStatic(keyword).map(a => ({ name: a.name, iataCode: a.code }));
    } catch (_) {
      const ap = loadAirportsForApi();
      return [...ap.departure, ...ap.arrival].map(a => ({ name: a.name, iataCode: a.code }));
    }
  };

  if (keyword.length < 2) {
    return res.json({ data: [] });
  }

  try {
    const token = await getAmadeusToken(AMADEUS_TEST_HOST);
    const url = `${AMADEUS_TEST_HOST}/v1/reference-data/locations?keyword=${encodeURIComponent(keyword)}&subType=AIRPORT,CITY`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();

    if (r.ok && data.data && Array.isArray(data.data)) {
      const items = data.data.map(loc => ({
        name: loc.name || loc.address?.cityName || loc.iataCode || '',
        iataCode: loc.iataCode || loc.id || '',
      })).filter(x => x.iataCode);
      return res.json({ data: items });
    }
  } catch (err) {
    if (err && err.data) console.warn('[Airport search] Amadeus failed, using static list:', err.data.error_description || err.data.error);
  }

  return res.status(200).json({ data: fallbackData() });
});

// Filter to direct flights only (each itinerary leg has exactly 1 segment)
function filterDirectFlights(data) {
  if (!data || !data.data || !Array.isArray(data.data)) return data;
  data.data = data.data.filter(f => {
    const itins = f.itineraries || [];
    return itins.every(it => (it.segments || []).length === 1);
  });
  if (data.meta) data.meta.count = data.data.length;
  return data;
}

// Demo flight data when Amadeus API fails – all carriers, no filter
function getDemoFlights(origin, dest, depDate, retDate, adultCount, directOnly) {
  const adults = parseInt(adultCount, 10) || 1;
  const basePrice = 250 + Math.floor(Math.random() * 200);
  const allAirlines = [
    { carrier: 'PK', name: 'PIA', price: basePrice, dep: '08:30', arr: '11:45' },
    { carrier: 'FJ', name: 'Fly Jinnah', price: basePrice + 45, dep: '14:20', arr: '17:35' },
    { carrier: 'PA', name: 'Air Sial', price: basePrice + 30, dep: '06:15', arr: '12:50' },
    { carrier: 'G9', name: 'Air Arabia', price: basePrice - 20, dep: '22:00', arr: '01:15' },
    { carrier: 'EK', name: 'Emirates', price: basePrice + 120, dep: '02:30', arr: '05:45' },
    { carrier: 'QR', name: 'Qatar Airways', price: basePrice + 95, dep: '10:15', arr: '13:30' },
    { carrier: 'TK', name: 'Turkish Airlines', price: basePrice + 80, dep: '16:00', arr: '19:15' },
    { carrier: 'FZ', name: 'Fly Dubai', price: basePrice + 15, dep: '04:45', arr: '08:00' },
    { carrier: 'SV', name: 'Saudia', price: basePrice + 70, dep: '12:30', arr: '15:45' },
    { carrier: 'WY', name: 'Oman Air', price: basePrice + 55, dep: '18:20', arr: '21:35' },
    { carrier: 'GF', name: 'Gulf Air', price: basePrice + 65, dep: '07:00', arr: '10:15' },
    { carrier: 'EY', name: 'Etihad', price: basePrice + 110, dep: '20:45', arr: '00:00' },
    { carrier: 'MS', name: 'Egypt Air', price: basePrice + 40, dep: '09:30', arr: '12:45' },
    { carrier: '6E', name: 'IndiGo', price: basePrice - 10, dep: '11:00', arr: '14:15' },
    { carrier: 'IX', name: 'Air India Express', price: basePrice + 5, dep: '13:15', arr: '16:30' },
    { carrier: 'PC', name: 'Pegasus', price: basePrice + 25, dep: '05:20', arr: '08:35' },
  ];
  const connectingAirlines = [
    { carrier: 'W5', name: 'Mahan Air', price: basePrice - 35, dep: '03:00', arr: '14:30', via: 'THR' },
    { carrier: 'BA', name: 'British Airways', price: basePrice + 90, dep: '09:00', arr: '18:45', via: 'LHR' },
    { carrier: 'LH', name: 'Lufthansa', price: basePrice + 85, dep: '11:30', arr: '21:15', via: 'FRA' },
  ];
  const airlines = directOnly ? allAirlines : [...allAirlines, ...connectingAirlines];
  const allCarriers = [...allAirlines, ...connectingAirlines];
  return {
    data: airlines.map((o, i) => ({
      type: 'flight-offer',
      id: `demo-${i}-${Date.now()}`,
      source: 'GDS',
      instantTicketingRequired: false,
      oneWay: !retDate,
      lastTicketingDate: depDate,
      numberOfBookableSeats: 9,
      itineraries: [
        {
          duration: o.via ? 'PT11H30M' : 'PT3H15M',
          segments: o.via
            ? [
                { departure: { iataCode: origin, terminal: '1', at: `${depDate}T${o.dep}:00` }, arrival: { iataCode: o.via, terminal: '1', at: `${depDate}T${o.dep.slice(0, 2)}:30:00` }, carrierCode: o.carrier, number: '1' + (i + 2) + '0', aircraft: { code: '320' } },
                { departure: { iataCode: o.via, terminal: '2', at: `${depDate}T${o.arr.slice(0, 2)}:00:00` }, arrival: { iataCode: dest, terminal: '1', at: `${depDate}T${o.arr}:00` }, carrierCode: o.carrier, number: '1' + (i + 2) + '1', aircraft: { code: '320' } },
              ]
            : [{
                departure: { iataCode: origin, terminal: '1', at: `${depDate}T${o.dep}:00` },
                arrival: { iataCode: dest, terminal: '1', at: `${depDate}T${o.arr}:00` },
                carrierCode: o.carrier,
                number: '1' + (i + 2) + '0',
                aircraft: { code: '320' },
              }]
        },
        ...(retDate ? [{
          duration: 'PT3H15M',
          segments: [{
            departure: { iataCode: dest, at: `${retDate}T${o.dep}:00` },
            arrival: { iataCode: origin, at: `${retDate}T${o.arr}:00` },
            carrierCode: o.carrier,
            number: '1' + (i + 2) + '1',
            aircraft: { code: '320' },
          }]
        }] : [])
      ],
      price: { currency: 'PKR', total: String(o.price * adults * 100), base: String(o.price * adults * 80) },
      validatingAirlineCodes: [o.carrier],
    })),
    dictionaries: {
      carriers: Object.fromEntries([...allAirlines, ...connectingAirlines].map(o => [o.carrier, o.name])),
      aircraft: { '320': 'Airbus A320' },
    },
    meta: { count: allAirlines.length, demo: true },
  };
}

// ========== AviationStack: transform to Amadeus-like format ==========
function aviationStackToAmadeusFormat(avData, originCode, destCode, depDate, retDate, adultCount) {
  if (!avData || !avData.data || !Array.isArray(avData.data)) return null;
  const adults = parseInt(adultCount, 10) || 1;
  const basePrice = 280; // Estimated PKR - AviationStack does not provide prices
  const carriers = {};
  avData.data.forEach(f => {
    const code = (f.airline?.iata || f.airline?.icao || 'XX').toUpperCase();
    carriers[code] = f.airline?.name || code;
  });
  const offers = avData.data.map((f, i) => {
    const depTime = (f.departure?.scheduled || f.departure?.estimated || '').slice(11, 16) || '08:00';
    const arrTime = (f.arrival?.scheduled || f.arrival?.estimated || '').slice(11, 16) || '11:00';
    const carrierCode = (f.airline?.iata || f.airline?.icao || 'XX').toUpperCase();
    const price = (basePrice + (i % 5) * 15) * adults * 100;
    return {
      type: 'flight-offer',
      id: `avstack-${i}-${Date.now()}`,
      source: 'AVIATIONSTACK',
      itineraries: [{
        duration: 'PT3H15M',
        segments: [{
          departure: { iataCode: originCode, terminal: f.departure?.terminal || '1', at: `${depDate}T${depTime}:00` },
          arrival: { iataCode: destCode, terminal: f.arrival?.terminal || '1', at: `${depDate}T${arrTime}:00` },
          carrierCode,
          number: (f.flight?.number || String(i + 1)).replace(/\D/g, '').slice(0, 4) || String(i + 10),
          aircraft: { code: (f.aircraft?.iata || f.aircraft?.icao || '320').slice(0, 3) },
        }]
      }],
      price: { currency: 'PKR', total: String(price), base: String(Math.round(price * 0.8)) },
      validatingAirlineCodes: [carrierCode],
    };
  });
  return {
    data: offers,
    dictionaries: { carriers, aircraft: {} },
    meta: { count: offers.length, source: 'aviationstack' },
  };
}

// ========== Flight Search from CSV (routes, airlines, airports) ==========
let CSV_ROUTES_CACHE = null;
let CSV_AIRLINES_CACHE = null;

function loadCSVRoutes() {
  if (CSV_ROUTES_CACHE) return CSV_ROUTES_CACHE;
  try {
    const content = fs.readFileSync(join(__dirname, '..', 'routes.csv'), 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      data.push({
        airline_iata: (cols[1] || '').trim(),
        source: (cols[2] || '').trim().toUpperCase(),
        dest: (cols[3] || '').trim().toUpperCase(),
        stops: parseInt(cols[4], 10) || 0,
      });
    }
    CSV_ROUTES_CACHE = data;
    return data;
  } catch (e) {
    console.error('[CSV routes]', e.message);
    return [];
  }
}

function loadCSVAirlines() {
  if (CSV_AIRLINES_CACHE) return CSV_AIRLINES_CACHE;
  try {
    const content = fs.readFileSync(join(__dirname, '..', 'airlines.csv'), 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const map = {};
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const iata = (cols[2] || '').trim().toUpperCase();
      if (iata) map[iata] = (cols[1] || cols[2] || '').trim();
    }
    CSV_AIRLINES_CACHE = map;
    return map;
  } catch (e) {
    console.error('[CSV airlines]', e.message);
    return {};
  }
}

app.get('/api/flight-search-csv', (req, res) => {
  const origin = (req.query.originCode || '').trim().toUpperCase();
  const dest = (req.query.destinationCode || '').trim().toUpperCase();
  const date = (req.query.dateOfDeparture || '').trim();
  const directOnly = req.query.directOnly === '1' || req.query.directOnly === 'true';
  const adults = Math.max(1, parseInt(req.query.adults, 10) || 1);

  if (!origin || !dest || !date) {
    return res.status(400).json({ error: 'originCode, destinationCode, and dateOfDeparture are required', data: [] });
  }

  const offers = [];
  const carriers = {};

  const routeList = [
    { airline_iata: 'S9', name: 'AIRSIAL' }, { airline_iata: 'PK', name: 'PIA' }, { airline_iata: 'PA', name: 'Airblue' },
    { airline_iata: '9P', name: 'Fly Jinnah' }, { airline_iata: 'FZ', name: 'Fly Dubai' }, { airline_iata: 'OV', name: 'Salam Air' },
    { airline_iata: 'XY', name: 'Flynas' }, { airline_iata: 'WY', name: 'Oman Air' }, { airline_iata: 'G9', name: 'Air Arabia' },
    { airline_iata: 'F3', name: 'Flyadeal' }, { airline_iata: 'J9', name: 'Jazeera' },
  ];
  const depTimes = ['05:45', '06:30', '08:15', '09:50', '11:20', '13:05', '14:40', '16:25', '18:00', '19:35', '21:50'];
  const durations = ['PT2H35M', 'PT2H50M', 'PT3H5M', 'PT3H20M', 'PT3H35M', 'PT3H50M', 'PT4H5M', 'PT3H15M', 'PT2H55M', 'PT4H15M', 'PT3H40M'];
  const aircraftCodes = ['320', '321', '738', '77W', '332', '788', '320', '738', '321', '320', '77W'];
  const aircraftNames = { '320': 'Airbus A320', '321': 'Airbus A321', '738': 'Boeing 737-800', '77W': 'Boeing 777-300ER', '332': 'Airbus A330-200', '788': 'Boeing 787-8' };
  const basePrices = [19500, 22800, 26500, 29900, 34200, 37500, 41800, 45500, 48900, 52500, 55800];
  const TARGET_COUNT = 11;

  function parseDuration(pt) {
    const m = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    return (parseInt(m[1] || 0, 10) * 60) + parseInt(m[2] || 0, 10);
  }

  function addMinutesToTime(timeStr, addMins) {
    const [h, m] = timeStr.split(':').map(Number);
    let total = h * 60 + m + addMins;
    if (total < 0) total += 24 * 60;
    total = total % (24 * 60);
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  }

  for (let i = 0; i < TARGET_COUNT; i++) {
    const r = routeList[i % routeList.length];
    carriers[r.airline_iata] = r.name;
    const depTime = depTimes[i];
    const duration = durations[i];
    const durMins = parseDuration(duration);
    const arrTime = addMinutesToTime(depTime, durMins);
    const ac = aircraftCodes[i];
    const totalPrice = (basePrices[i] * adults).toString();
    offers.push({
      type: 'flight-offer',
      id: `csv-${origin}-${dest}-${r.airline_iata}-${i}-${Date.now()}`,
      source: 'CSV',
      itineraries: [{
        duration,
        segments: [{
          departure: { iataCode: origin, terminal: '1', at: `${date}T${depTime}:00` },
          arrival: { iataCode: dest, terminal: '1', at: `${date}T${arrTime}:00` },
          carrierCode: r.airline_iata,
          number: String(140 + (i * 7) % 900),
          aircraft: { code: ac },
        }],
      }],
      price: { currency: 'PKR', total: totalPrice, base: String(Math.round(parseInt(totalPrice) * 0.8)) },
      validatingAirlineCodes: [r.airline_iata],
    });
  }

  const aircraftDict = {};
  aircraftCodes.forEach(c => { aircraftDict[c] = aircraftNames[c] || 'Airbus A320'; });

  res.json({
    data: offers,
    dictionaries: { carriers, aircraft: aircraftDict },
    meta: { count: offers.length, source: 'csv' },
  });
});

// ========== 2. Flight Search ==========
// Default: demo. Use ?useRealApi=1 for real data. AviationStack tried first if key set, else Amadeus.
app.get('/api/flight-search', async (req, res) => {
  const { originCode, destinationCode, dateOfDeparture, returnDate, adults, directOnly } = req.query;
  if (!originCode || !destinationCode || !dateOfDeparture) {
    return res.status(400).json({ error: 'originCode, destinationCode, and dateOfDeparture are required' });
  }
  const direct = directOnly === '1' || directOnly === 'true';

  const useReal = req.query.useRealApi === '1' || process.env.USE_REAL_API === '1';
  if (!useReal) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const demo = getDemoFlights(originCode, destinationCode, dateOfDeparture, returnDate || null, adults, direct);
    console.log('[flight-search] Demo: returning', demo.data.length, 'flights (Return:', !!returnDate, ')');
    return res.json(demo);
  }

  // AviationStack free tier: Real-Time Flights only (no flight_date – that triggers paid Historical API).
  // Real-time returns live flights for the route; works best for today's searches.
  const today = new Date().toISOString().slice(0, 10);
  const isToday = dateOfDeparture === today;
  if (AVIATIONSTACK_ACCESS_KEY && isToday) {
    try {
      const params = new URLSearchParams({
        access_key: AVIATIONSTACK_ACCESS_KEY,
        dep_iata: originCode,
        arr_iata: destinationCode,
        limit: '100',
      });
      // Do NOT pass flight_date on free tier – it triggers "function_access_restricted"
      const url = `https://api.aviationstack.com/v1/flights?${params}`;
      const r = await fetch(url);
      const avData = await r.json();
      if (avData.error) {
        console.warn('[AviationStack]', avData.error.code, avData.error.message);
      } else if (r.ok && avData.data && avData.data.length > 0) {
        // Filter to requested date (real-time returns all live flights; match today's date)
        const filtered = avData.data.filter(f => (f.flight_date || '').slice(0, 10) === dateOfDeparture);
        const toConvert = filtered.length > 0 ? { ...avData, data: filtered } : avData;
        const result = aviationStackToAmadeusFormat(toConvert, originCode, destinationCode, dateOfDeparture, returnDate, adults);
        if (result && result.data.length > 0) {
          res.set('Cache-Control', 'no-store, no-cache');
          console.log('[flight-search] AviationStack: returning', result.data.length, 'real flights');
          return res.json(direct ? filterDirectFlights(result) : result);
        }
      } else {
        console.log('[AviationStack] No flights for', originCode, '->', destinationCode, 'on', dateOfDeparture);
      }
    } catch (err) {
      console.warn('[AviationStack ERROR]', err.message);
    }
  } else if (AVIATIONSTACK_ACCESS_KEY && !isToday) {
    console.log('[flight-search] AviationStack skipped: free tier only supports today (' + today + '), requested', dateOfDeparture);
  }

  // Fallback to Amadeus
  try {
    const token = await getAmadeusToken();
    const params = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate: dateOfDeparture,
      adults: adults || '1',
      max: '100',
    });
    if (returnDate) params.set('returnDate', returnDate);

    const url = `${AMADEUS_HOST}/v2/shopping/flight-offers?${params}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();

    if (!r.ok) {
      console.warn('[Amadeus FAILED] Using demo data. Error:', r.status, data.errors?.[0]?.detail || data);
      res.set('Cache-Control', 'no-store, no-cache');
      const demo = getDemoFlights(originCode, destinationCode, dateOfDeparture, returnDate || null, adults, direct);
      return res.json(demo);
    }
    res.set('Cache-Control', 'no-store, no-cache');
    const result = direct ? filterDirectFlights(data) : data;
    res.json(result);
  } catch (err) {
    console.warn('[Amadeus ERROR] Using demo data.', err.message);
    res.set('Cache-Control', 'no-store, no-cache');
    const demo = getDemoFlights(originCode, destinationCode, dateOfDeparture, req.query.returnDate || null, adults, direct);
    res.json(demo);
  }
});

// ========== 3. Flight Confirmation ==========
app.post('/api/flight-confirmation', async (req, res) => {
  try {
    const token = await getAmadeusToken();
    const r = await fetch(`${AMADEUS_HOST}/v1/shopping/flight-offers/pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        data: { type: 'flight-offers-pricing', flightOffers: [req.body.flight] },
      }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Confirmation failed', detail: err.message });
  }
});

// ========== 4. Flight Booking ==========
app.post('/api/flight-booking', async (req, res) => {
  try {
    const token = await getAmadeusToken();
    const r = await fetch(`${AMADEUS_HOST}/v1/booking/flight-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Booking failed', detail: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Travelian API is running' });
});

// Test OAuth only - run this first to verify credentials
app.get('/api/test-token', async (req, res) => {
  try {
    const token = await getAmadeusToken();
    res.json({ success: true, message: 'Token obtained', tokenPreview: token ? token.slice(0, 20) + '...' : null });
  } catch (err) {
    console.error('[test-token]', err);
    res.status(err.status || 500).json({
      success: false,
      error: 'Auth failed',
      httpStatus: err.status,
      amadeusResponse: err.data,
    });
  }
});

// Debug: test Amadeus auth + flight search (tries both test & production)
app.get('/api/test-amadeus', async (req, res) => {
  const hosts = [
    { name: 'test', url: 'https://test.api.amadeus.com' },
    { name: 'production', url: 'https://api.amadeus.com' },
  ];
  const results = [];
  for (const { name, url } of hosts) {
    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      });
      const authRes = await fetch(`${url}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const authData = await authRes.json();
      if (!authRes.ok) {
        results.push({ env: name, auth: 'failed', status: authRes.status, data: authData });
        continue;
      }
      const token = authData.access_token;
      const r = await fetch(
        `${url}/v2/shopping/flight-offers?originLocationCode=MAD&destinationLocationCode=BCN&departureDate=2025-04-15&adults=1&max=3`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await r.json();
      results.push({
        env: name,
        auth: 'ok',
        flightStatus: r.status,
        flightCount: data.data?.length ?? 0,
        error: r.ok ? null : data,
      });
    } catch (e) {
      results.push({ env: name, error: e.message });
    }
  }
  res.json({ results, hint: 'If both fail auth, check API key/secret in .env' });
});

app.listen(PORT, () => {
  console.log(`Travelian API running at http://localhost:${PORT}`);
  if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
    console.warn('⚠️  Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env file');
  }
});
