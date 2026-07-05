"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { uploadObservationImage, fileToCompactDataUrl } from "@/lib/image";
import { getCurrentPosition } from "@/lib/geo";
import { submitObservation, ApiError } from "@/lib/api";
import { enqueue } from "@/lib/offlineQueue";
import type { GeoPoint } from "@/lib/types";
import { Spinner } from "./Spinner";

type Phase = "idle" | "submitting" | "done" | "queued" | "error";

export function CameraCapture() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");

  async function onSelect(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPhase("idle");
    setMessage("");
    try {
      const img = await fileToCompactDataUrl(selected);
      setPreview(img.dataUrl);
    } catch {
      setPreview(null);
    }
    setLocating(true);
    getCurrentPosition()
      .then((c) => setCoords({ lng: c.lng, lat: c.lat }))
      .catch(() => setCoords(null))
      .finally(() => setLocating(false));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setNote("");
    setCoords(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function queueForLater(imageUrl: string) {
    await enqueue({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      imageUrl,
      note: note.trim() || undefined,
      location: coords ?? undefined,
    });
    setPhase("queued");
    setMessage(
      "Saved on this device — it will sync automatically when you're back online.",
    );
    reset();
  }

  async function onSubmit() {
    if (!file) return;
    setPhase("submitting");
    setMessage("");

    let imageUrl: string;
    try {
      imageUrl = await uploadObservationImage(file);
    } catch (err) {
      setPhase("error");
      setMessage(
        err instanceof Error ? err.message : "Could not process the image.",
      );
      return;
    }

    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    if (offline) {
      await queueForLater(imageUrl);
      return;
    }

    try {
      await submitObservation({
        imageUrl,
        note: note.trim() || undefined,
        location: coords ?? undefined,
      });
      setPhase("done");
      setMessage("Report submitted — AI analysis is in progress.");
      reset();
    } catch (err) {
      if (err instanceof ApiError && err.status > 0) {
        setPhase("error");
        setMessage(err.message);
      } else {
        await queueForLater(imageUrl);
      }
    }
  }

  const busy = phase === "submitting";
  const statusClass =
    phase === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700";
  const locationText = locating
    ? "Getting your location…"
    : coords
      ? `Location captured (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
      : "Location unavailable — you can still submit.";

  return (
    <div className="space-y-4">
      <label className="flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-400 hover:border-slate-400">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm">
            <span className="text-3xl" aria-hidden>
              📷
            </span>
            Tap to take or choose a photo
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onSelect}
        />
      </label>

      <p className="text-xs text-slate-500">{locationText}</p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional) — e.g. large pothole near the bus stop"
        maxLength={2000}
        rows={3}
        className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-500 focus:outline-none"
      />

      <button
        onClick={onSubmit}
        disabled={!file || busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-white disabled:opacity-40"
      >
        {busy ? <Spinner label="Submitting…" /> : "Submit report"}
      </button>

      {message ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${statusClass}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
