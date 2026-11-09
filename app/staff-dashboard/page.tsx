import type { Metadata } from "next";
import { Suspense } from "react";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { StaffDashboard } from "./StaffDashboard";
import { StaffLogin } from "./StaffLogin";

export const metadata: Metadata = {
  title: "NavConnect · Staff dashboard",
};

// Reads the unlock cookie, so it renders per request. The dashboard component is only
// included in the response once the password has been entered.
async function Gate() {
  if (!(await isStaffAuthenticated())) return <StaffLogin />;
  return <StaffDashboard />;
}

export default function StaffDashboardPage() {
  return (
    <Suspense fallback={null}>
      <Gate />
    </Suspense>
  );
}
