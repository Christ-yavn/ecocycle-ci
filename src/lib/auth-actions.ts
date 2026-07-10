"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Role } from "@/types/role";
import type { AnalyseIa } from "@/types/ia";

// ============================================================
// Actions d'auth côté client (login, register, logout)
// + helpers métier (upload photo, créer lot, etc.)
// ============================================================

let _supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = createSupabaseBrowserClient();
  }
  return _supabase;
}

// --- AUTH ---

export async function signIn(phone: string, password: string) {
  // Supabase Auth utilise l'email OU le téléphone.
  // Pour le MVP, on mappe phone → email formaté (à adapter avec OTP SMS V2).
  const email = phoneToEmail(phone);
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(
  name: string,
  phone: string,
  password: string,
  role: Role,
  commune?: string,
  quartier?: string,
) {
  const email = phoneToEmail(phone);
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        role,
        commune: commune ?? null,
        quartier: quartier ?? null,
      },
    },
  });
  return { data, error };
}

export async function signOut() {
  await getSupabase().auth.signOut();
}

// --- UPLOAD PHOTO ---
// Compresse l'image côté client (canvas → WebP) avant upload.
export async function compressAndUploadPhoto(
  file: File,
  userId: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const compressed = await compressImage(file, 1024, 0.7);
    const fileName = `${userId}/${crypto.randomUUID()}.webp`;

    const { error: upErr } = await getSupabase().storage
      .from("lots-photos")
      .upload(fileName, compressed, { contentType: "image/webp" });

    if (upErr) return { url: null, error: upErr.message };

    const { data } = getSupabase()
      .storage.from("lots-photos")
      .getPublicUrl(fileName);

    return { url: data.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : "Erreur upload" };
  }
}

// --- ANALYSE IA (proxy via route handler) ---
export async function analyzePhoto(file: File): Promise<AnalyseIa> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/ia/analyze", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`IA indisponible (${res.status}): ${errText}`);
  }

  return (await res.json()) as AnalyseIa;
}

// --- HELPERS ---

function phoneToEmail(phone: string): string {
  // Format CI : +225 07 00 00 00 00 → 0700000000@ecocycle.ci
  const cleaned = phone.replace(/[\s+\-]/g, "");
  return `${cleaned}@ecocycle.ci`;
}

function compressImage(
  file: File,
  maxSize: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas non supporté"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression échouée"));
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Image invalide"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Lecture fichier échouée"));
    reader.readAsDataURL(file);
  });
}
