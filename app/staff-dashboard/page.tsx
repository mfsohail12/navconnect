import type { Metadata } from "next";
import { StaffDashboard } from "./StaffDashboard";

export const metadata: Metadata = {
  title: "NavConnect · Staff dashboard",
};

export default function StaffDashboardPage() {
  return <StaffDashboard />;
}
