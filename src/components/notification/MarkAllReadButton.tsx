"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./MarkAllReadButton.module.css";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
        setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "…" : "Marquer tout comme lu"}
    </button>
  );
}
