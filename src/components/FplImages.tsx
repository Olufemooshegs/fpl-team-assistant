import { useState } from "react"
import { shirtUrl, crestUrl } from "../utils/fplImages"

// ── Shared internals ──────────────────────────────────────────────────────────

function Skeleton({ rounded = false }: { rounded?: boolean }) {
  return (
    <div
      className={`absolute inset-0 animate-pulse bg-line ${rounded ? "rounded-full" : "rounded"}`}
    />
  )
}

function Fallback({
  text,
  size,
  rounded = false,
}: {
  text: string
  size: number
  rounded?: boolean
}) {
  const fontSize = size <= 18 ? "7px" : size <= 32 ? "8px" : "9px"
  return (
    <div
      className={`w-full h-full flex items-center justify-center font-bold text-white ${rounded ? "rounded-full" : "rounded"}`}
      style={{ background: "var(--c-primary)", fontSize }}
    >
      {text.slice(0, 3).toUpperCase()}
    </div>
  )
}

// ── Jersey ────────────────────────────────────────────────────────────────────

interface JerseyProps {
  teamCode: number
  teamShortName: string
  isGK?: boolean
  size?: number
  className?: string
}

export function Jersey({
  teamCode,
  teamShortName,
  isGK = false,
  size = 48,
  className = "",
}: JerseyProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")
  const src = shirtUrl(teamCode, isGK)

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {status === "loading" && <Skeleton />}
      {status !== "error" && (
        <img
          src={src}
          alt={`${teamShortName} ${isGK ? "goalkeeper " : ""}shirt`}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`w-full h-full object-contain transition-opacity duration-150 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {status === "error" && (
        <Fallback text={teamShortName} size={size} />
      )}
    </div>
  )
}

// ── Crest ─────────────────────────────────────────────────────────────────────

interface CrestProps {
  teamCode: number
  shortName: string
  size?: number
  className?: string
}

export function Crest({ teamCode, shortName, size = 20, className = "" }: CrestProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")
  const src = crestUrl(teamCode)

  return (
    <span
      className={`relative inline-flex shrink-0 align-middle ${className}`}
      style={{ width: size, height: size }}
    >
      {status === "loading" && <Skeleton rounded />}
      {status !== "error" && (
        <img
          src={src}
          alt={`${shortName} crest`}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`w-full h-full object-contain transition-opacity duration-150 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {status === "error" && (
        <Fallback text={shortName} size={size} rounded />
      )}
    </span>
  )
}
