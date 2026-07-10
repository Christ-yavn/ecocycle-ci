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
  };
  return <Icon name={map[role]} size={size} />;
}
