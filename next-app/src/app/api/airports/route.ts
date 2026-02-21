import { readFile } from "node:fs/promises";
import path from "node:path";

type Airport = {
  name: string;
  city: string;
  iataCode: string;
  code: string;
  country?: string;
};

const CSV_PATH = path.resolve(process.cwd(), "..", "mainairports.csv");

function fallback() {
  return {
    departure: [
      { name: "Karachi", city: "Karachi", iataCode: "KHI", code: "KHI", country: "Pakistan" },
      { name: "Lahore", city: "Lahore", iataCode: "LHE", code: "LHE", country: "Pakistan" },
      { name: "Islamabad", city: "Islamabad", iataCode: "ISB", code: "ISB", country: "Pakistan" },
    ],
    arrival: [
      { name: "Dubai", city: "Dubai", iataCode: "DXB", code: "DXB", country: "UAE" },
      { name: "Abu Dhabi", city: "Abu Dhabi", iataCode: "AUH", code: "AUH", country: "UAE" },
      { name: "Doha", city: "Doha", iataCode: "DOH", code: "DOH", country: "Qatar" },
      { name: "London", city: "London", iataCode: "LHR", code: "LHR", country: "United Kingdom" },
    ],
  };
}

function parseCsv(csv: string): Airport[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const country = (cols[0] || "").trim();
    const city = (cols[1] || "").trim();
    const airportName = (cols[2] || "").trim();
    const iata = (cols[3] || "").trim().toUpperCase();
    return {
      name: airportName || city,
      city,
      iataCode: iata,
      code: iata,
      country,
    };
  }).filter((a) => a.code);
}

export async function GET() {
  try {
    const csv = await readFile(CSV_PATH, "utf8");
    const all = parseCsv(csv);
    const departure = all.filter((a) => a.country === "Pakistan");
    const arrival = all.filter((a) => a.country !== "Pakistan");
    return Response.json({ departure, arrival }, { status: 200 });
  } catch {
    return Response.json(fallback(), { status: 200 });
  }
}
