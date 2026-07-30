import type { Metadata } from "next";
import { LandingPageClient } from "./LandingPageClient";

export const metadata: Metadata = {
  title: "CampusChain | University Payments Ecosystem",
  description: "A secure, instant, Stellar-powered payment ecosystem for students, faculty, and universities.",
};

export default function HomePage() {
  return <LandingPageClient />;
}
