"use client";
import { Loader2 } from "lucide-react";

interface PitchUploadProgressProps {
  /** Upload progress 0–100. Covers the file transfer; 100 means finalizing on the server. */
  progress: number;
  fileName?: string;
  className?: string;
}

export function PitchUploadProgress({
  progress,
  fileName,
  className = "",
}: PitchUploadProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const finalizing = clamped >= 100;
  const label = finalizing
    ? "Finalizing upload—almost done…"
    : clamped === 0
      ? "Preparing upload…"
      : "Uploading your pitch…";

  return (
    <div
      className={`rounded-lg border border-v0-blue-200 bg-v0-blue-50 p-3 sm:p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="truncate text-sm font-medium text-v0-blue-900">
            {label}
            {fileName ? (
              <span className="font-normal text-v0-blue-700"> — {fileName}</span>
            ) : null}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
          {clamped}%
        </span>
      </div>
      <div
        className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-v0-blue-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label="Elevator pitch upload progress"
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r from-primary to-v0-blue-400 transition-[width] duration-300 ease-out ${
            finalizing ? "animate-pulse" : ""
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-v0-blue-700">
        Please keep this page open until the upload completes.
      </p>
    </div>
  );
}

export default PitchUploadProgress;
