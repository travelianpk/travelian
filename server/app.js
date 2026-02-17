import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
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
const AIRPORTS = {
  departure: [
    { name: 'Lahore', code: 'LHE' },
    { name: 'Islamabad', code: 'ISB' },
    { name: 'Sialkot', code: 'SKT' },
    { name: 'Faisalabad', code: 'LYP' },
    { name: 'Karachi', code: 'KHI' },
    { name: 'Multan', code: 'MUX' },
    { name: 'Quetta', code: 'UET' },
    { name: 'Peshawar', code: 'PEW' },
  ],
  arrival: [
    { name: 'Dubai', code: 'DXB' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Athens', code: 'ATH' },
    { name: 'Paris', code: 'CDG' },
    { name: 'London', code: 'LHR' },
    { name: 'Doha', code: 'DOH' },
    { name: 'Abu Dhabi', code: 'AUH' },
    { name: 'Riyadh', code: 'RUH' },
    { name: 'Jeddah', code: 'JED' },
    { name: 'Mumbai', code: 'BOM' },
    { name: 'New York', code: 'JFK' },
    { name: 'Toronto', code: 'YYZ' },
    { name: 'Manchester', code: 'MAN' },
    { name: 'Birmingham', code: 'BHX' },
    { name: 'Kuala Lumpur', code: 'KUL' },
    { name: 'Singapore', code: 'SIN' },
  ],
};

app.get('/api/airports', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(AIRPORTS);
});

// Search airports by keyword – Amadeus API with static fallback
function searchFromStatic(keyword) {
  const k = (keyword || '').toLowerCase();
  const all = [...AIRPORTS.departure, ...AIRPORTS.arrival];
  return all.filter(a => a.name.toLowerCase().includes(k) || a.code.toLowerCase().includes(k));
}

app.get('/api/city-and-airport-search/:parameter', async (req, res) => {
  const keyword = (req.params.parameter || '').trim();
  const fallbackData = () => {
    try {
      return searchFromStatic(keyword).map(a => ({ name: a.name, iataCode: a.code }));
    } catch (_) {
      return [...AIRPORTS.departure, ...AIRPORTS.arrival].map(a => ({ name: a.name, iataCode: a.code }));
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
