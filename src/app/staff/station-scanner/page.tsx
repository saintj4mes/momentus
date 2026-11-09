import { StaffStationScanner } from "@/modules/nfc/ui/staff-station-scanner";

export const metadata = {
  title: "Station Scanner · MOMENTUS Staff PWA",
  description: "Station-scoped live credential scanner with Web Audio acoustic feedback and atomic duplicate prevention.",
};

export default function StaffStationScannerPage() {
  return <StaffStationScanner />;
}

