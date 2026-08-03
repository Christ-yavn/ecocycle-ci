"use client";

import dynamic from "next/dynamic";
import type { SignalementMapItem } from "@/types/map";

const SignalementsMapClient = dynamic(
  () => import("./SignalementsMap").then((m) => m.SignalementsMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ec-paper-2)",
          borderRadius: "var(--radius-card)",
          color: "var(--ec-ink-soft)",
          fontFamily: "var(--font-mono)",
        }}
      >
        Chargement de la carte…
      </div>
    ),
  },
);

export function SignalementsMapDynamic(props: {
  signalements: SignalementMapItem[];
  onUpdateStatus?: (id: string, status: string) => void;
}) {
  return <SignalementsMapClient {...props} />;
}
