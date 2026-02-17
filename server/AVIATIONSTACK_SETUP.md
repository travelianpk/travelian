# AviationStack API Setup

You have an AviationStack API Access Key. Add it to use **real-time flight data** in your flight search.

## 1. Add Your Access Key

**Option A – In `.env` (recommended)**

1. Copy `.env.example` to `.env` (if you haven't already)
2. Add or update:
   ```
   AVIATIONSTACK_ACCESS_KEY=your-actual-access-key-here
   ```

**Option B – Enable real API globally**

Add to `.env`:
```
USE_REAL_API=1
AVIATIONSTACK_ACCESS_KEY=your-actual-access-key-here
```

## 2. Restart the Server

```bash
cd server
npm start
```

## 3. How It Works

- When you search for flights, the server will **try AviationStack first** (if the key is set)
- AviationStack returns real flight schedules (airlines, times, routes)
- **Note:** AviationStack does not provide prices. The server adds estimated PKR prices for display
- If AviationStack fails or returns no data, it falls back to Amadeus (if configured) or demo data

## 4. Free Plan Limits

- **100 requests/month** on free tier
- **Real-time flights only** – free tier supports **today's date only**. Future dates require a paid plan.
- Rate limit: 1 request per minute on free plan

## 5. Test Your Setup

**Use today's date** (free tier only returns real flights for today):

```
http://localhost:5000/api/flight-search?originCode=LHE&destinationCode=DXB&dateOfDeparture=YYYY-MM-DD&useRealApi=1
```

Replace `YYYY-MM-DD` with today's date (e.g. `2025-01-31`). You should see real flight data from AviationStack when flights exist for that route today.
