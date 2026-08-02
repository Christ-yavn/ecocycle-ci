import type { Role } from "@/types/role";

const PATHS: Record<string, string> = {
  home: "M3 12l9-9 9 9M5 10v10h14V10",
  lot: "M4 4h16v6H4zM4 14h16v6H4z",
  plus: "M12 5v14M5 12h14",
  star: "M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.3 6.2 20.8l1.6-6.6L2.6 9.8l6.8-.5z",
  map: "M9 4l-6 3v13l6-3 6 3 6-3V4l-6 3-6-3zM9 4v13M15 7v13",
  route: "M6 19a3 3 0 100-6 3 3 0 000 6zM18 11a3 3 0 100-6 3 3 0 000 6zM9 16h6M15 8l-6 4",
  box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  truck: "M3 6h11v9H3zM14 9h4l3 3v3h-7zM7 18a2 2 0 100-4 2 2 0 000 4zM17 18a2 2 0 100-4 2 2 0 000 4z",
  market: "M4 4h16l-1 6H5zM5 10v8h14v-8M9 14h6",
  order: "M6 4h12v16H6zM9 8h6M9 12h6",
  recycle: "M7 19l-3-5 4-2M4 14a6 6 0 0110-4M17 5l3 5-4 2M20 10a6 6 0 01-10 4M12 9l2 3h-3",
  catalog: "M4 6h16M4 10h16M4 14h10M4 18h10",
  dashboard: "M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z",
  alert: "M12 3l9 16H3zM12 9v5M12 17h.01",
  report: "M4 4h16v16H4zM8 12h8M12 8v8",
  follow: "M5 4h14v16l-7-4-7 4z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
  bell: "M9 17a3 3 0 006 0M6 9a6 6 0 1112 0c0 4 2 5 2 5H4s2-1 2-5z",
  logout: "M14 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2v-2M16 12h6M19 9l3 3-3 3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 12a3 3 0 100-6 3 3 0 000 6z",
  eyeOff: "M3 3l18 18M10.5 5.2A10.8 10.8 0 0112 5c6.5 0 10 7 10 7a17.6 17.6 0 01-2.9 3.9M6.6 6.6A16.9 16.9 0 002 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3M9.9 9.9a3 3 0 004.2 4.2",
  shield: "M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h3v3h-3zM20 20v.01",
  scan: "M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M4 12h16",
  camera: "M4 7h3l2-2h6l2 2h3v13H4zM12 16a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  coins: "M12 8a8 3.5 0 100-7 8 3.5 0 000 7zM4 8v4c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V8M4 12v4c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-4",
  check: "M4 12l5 5L20 6",
  location: "M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z",
  filter: "M4 5h16l-6 8v6l-4-2v-4z",
  chart: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  key: "M14 10a4 4 0 10-4 4c.5 0 1-.1 1.4-.3L13 15h2v2h2v2h3v-3.6l-4.3-4.3c.1-.4.3-.9.3-1.1zM8 10h.01",
};

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: keyof typeof PATHS | string;
  size?: number;
  className?: string;
}) {
  const d = PATHS[name] ?? PATHS.home;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export function RoleIcon({ role, size = 18 }: { role: Role; size?: number }) {
  const map: Record<Role, string> = {
    producteur: "home",
    collecteur: "truck",
    recycleur: "recycle",
    acheteur: "catalog",
    mairie: "dashboard",
    citoyen: "alert",
    admin: "shield",
  };
  return <Icon name={map[role]} size={size} />;
}
