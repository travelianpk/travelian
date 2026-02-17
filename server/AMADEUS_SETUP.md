# Amadeus API Setup & Data Links

## Get Your API Credentials

1. **Register (free):** https://developers.amadeus.com/register  
2. **My Workspace / Create Project:** https://developers.amadeus.com/my-apps  
3. Create a new app → copy **API Key** and **API Secret**

---

## Add Credentials

**Option A – In code (quick test)**  
Edit `app.js` and replace:

```js
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || 'YOUR_API_KEY';
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || 'YOUR_API_SECRET';
```

with your real values:

```js
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || 'abc123xyz...';
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || 'secret456...';
```

**Option B – Using .env (recommended)**  
1. Copy `.env.example` to `.env`  
2. Put your credentials in `.env`:
   ```
   AMADEUS_CLIENT_ID=your-api-key
   AMADEUS_CLIENT_SECRET=your-api-secret
   ```

---

## API Endpoints (Run server: `npm start`)

Base URL: **http://localhost:5000**

| Purpose | Method | URL | Example |
|--------|--------|-----|---------|
| Health | GET | `/api/health` | http://localhost:5000/api/health |
| City/Airport search | GET | `/api/city-and-airport-search/:keyword` | http://localhost:5000/api/city-and-airport-search/lahore |
| Flight search | GET | `/api/flight-search` | See below |

### Flight search query parameters

- `originCode` – e.g. LHE, ISB, KHI  
- `destinationCode` – e.g. DXB, IST, LHR  
- `dateOfDeparture` – YYYY-MM-DD  
- `returnDate` (optional) – YYYY-MM-DD  
- `adults` (default 1)  
- `children` (optional)  
- `infants` (optional)  

### Example URLs (copy into browser when server is running)

**1. City search:**
```
http://localhost:5000/api/city-and-airport-search/lahore
http://localhost:5000/api/city-and-airport-search/dubai
```

**2. Flight search (Lahore → Dubai):**
```
http://localhost:5000/api/flight-search?originCode=LHE&destinationCode=DXB&dateOfDeparture=2025-03-15
```

**2b. Test environment routes** (use these if LHE–DXB returns no results – test API has limited routes):
```
http://localhost:5000/api/flight-search?originCode=MAD&destinationCode=BCN&dateOfDeparture=2025-03-15
http://localhost:5000/api/flight-search?originCode=LON&destinationCode=PAR&dateOfDeparture=2025-04-01
```

**3. Round trip:**
```
http://localhost:5000/api/flight-search?originCode=LHE&destinationCode=DXB&dateOfDeparture=2025-03-15&returnDate=2025-03-22
```

**4. With passengers:**
```
http://localhost:5000/api/flight-search?originCode=LHE&destinationCode=IST&dateOfDeparture=2025-04-01&adults=2&children=1
```

---

## Quick start

```bash
cd server
npm install
npm start
```

Then open: http://localhost:5000/api/health  

---

## Troubleshooting "Flight search failed"

**1. Use the debug page**  
Open `server/debug.html` in your browser (with the server running). Click the buttons to see the full API response for each endpoint.

**2. Test endpoints in order**
- `http://localhost:5000/api/health` — should return `{"status":"ok"}`
- `http://localhost:5000/api/test-token` — tests OAuth; if this fails, credentials are wrong
- `http://localhost:5000/api/test-amadeus` — tries both test & production; shows which works

**3. Check the server terminal**  
Errors are logged there. Look for `[Amadeus Auth FAILED]` or `[Flight Search FAILED]`.

**4. Switch environment**  
In `.env`, change `AMADEUS_HOSTNAME=test` to `AMADEUS_HOSTNAME=production` (or vice versa), then restart the server. Some keys only work in one environment.

**5. Use known test routes**  
If using the test environment, try MAD→BCN:  
`http://localhost:5000/api/flight-search?originCode=MAD&destinationCode=BCN&dateOfDeparture=2025-04-15`
