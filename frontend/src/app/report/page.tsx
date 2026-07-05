"use client";

import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { CameraCapture } from "@/components/CameraCapture";

export default function ReportPage() {
  return (
    <Protected>
      <AppShell>
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-slate-900">Report an asset</h1>
          <p className="mt-1 text-sm text-slate-500">
            Photograph a road or bridge defect. Spandan’s AI scores its
            condition and routes it to the right authority.
          </p>
          <div className="mt-6">
            <CameraCapture />
          </div>
        </div>
      </AppShell>
    </Protected>
  );
}
