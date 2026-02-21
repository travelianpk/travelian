import { notFound } from "next/navigation";
import LegacyPageFrame from "@/app/_components/LegacyPageFrame";

const PAGE_MAP: Record<string, { file: string; title: string }> = {
  "about": { file: "about", title: "About Us" },
  "contact-us": { file: "contact-us", title: "Contact Us" },
  "hotel-bookings": { file: "hotel-bookings", title: "Hotel Bookings" },
  "study-visa": { file: "study-visa", title: "Study Visa" },
  "travel-insurance": { file: "travel-insurance", title: "Travel Insurance" },
  "umrah-packages": { file: "umrah-packages", title: "Umrah Packages" },
  "visit-visa": { file: "visit-visa", title: "Visit Visa" },
  "flight-results": { file: "flight-results", title: "Flight Results" },
};

export default async function LegacyRoutePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PAGE_MAP[slug];
  if (!page) {
    notFound();
  }
  return (
    <LegacyPageFrame
      src={`/legacy/${page.file}`}
      title={`Travelian ${page.title}`}
    />
  );
}
