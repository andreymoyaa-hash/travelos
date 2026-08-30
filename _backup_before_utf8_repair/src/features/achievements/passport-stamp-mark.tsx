import Image from "next/image";
import { LockKeyhole } from "lucide-react";
import type { CSSProperties } from "react";

import type { Achievement, PassportStampShape, PassportStampVisual } from "@/types/travel";

const FALLBACK_SHAPES: readonly PassportStampShape[] = ["round", "oval", "rectangle", "square", "arch", "ticket"];

const compactLocation = (achievement: Achievement) => achievement.city ?? achievement.location ?? "NIOLI";

const hashString = (value: string) => Array.from(value).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 17);

export function resolvePassportStampVisual(achievement: Achievement): PassportStampVisual {
  if (achievement.stamp) return achievement.stamp;
  const hash = hashString(achievement.id);
  const location = compactLocation(achievement);
  return {
    shape: FALLBACK_SHAPES[hash % FALLBACK_SHAPES.length],
    ink: achievement.color,
    motif: achievement.category,
    label: `${achievement.title.toUpperCase()} · ${location.toUpperCase()}`,
    rotationDeg: (hash % 9) - 4,
  };
}

function StampCopy({ label }: { label: string }) {
  const [primary, ...rest] = label.split("·").map((part) => part.trim()).filter(Boolean);
  return (
    <span className="passport-stamp-copy" aria-hidden="true">
      <span>{primary}</span>
      {rest.length ? <small>{rest.join(" · ")}</small> : null}
    </span>
  );
}

export function PassportStampMark({ achievement, unlocked, large = false, recentlyUnlocked = false }: { achievement: Achievement; unlocked: boolean; large?: boolean; recentlyUnlocked?: boolean }) {
  const visual = resolvePassportStampVisual(achievement);
  const conceal = !unlocked && achievement.discovery === "secret" && !visual.assetPath;
  const displayLabel = conceal ? "SELLO POR DESCUBRIR · NIOLI" : visual.label;
  const displayMotif = conceal ? "✦" : achievement.icon;
  const style = {
    "--stamp-ink": visual.ink,
    "--stamp-rotation": `${visual.rotationDeg ?? 0}deg`,
  } as CSSProperties;
  const stateClass = unlocked ? "is-unlocked" : "is-locked";
  const freshClass = recentlyUnlocked ? " is-fresh" : "";
  const largeClass = large ? " is-large" : "";

  if (visual.assetPath) {
    return (
      <span
        className={`passport-stamp-mark official-stamp-asset ${stateClass}${largeClass}${freshClass}`}
        style={style}
        aria-hidden="true"
      >
        <Image
          className="official-stamp-image"
          src={visual.assetPath}
          alt=""
          fill
          sizes={large ? "300px" : "190px"}
        />
        {!unlocked ? <span className="official-stamp-lock"><LockKeyhole size={15} strokeWidth={2.1} /></span> : null}
      </span>
    );
  }

  return (
    <span
      className={`passport-stamp-mark shape-${visual.shape} ${stateClass}${largeClass}${freshClass}`}
      style={style}
      aria-hidden="true"
    >
      <span className="passport-stamp-ring passport-stamp-ring-outer" />
      <span className="passport-stamp-ring passport-stamp-ring-inner" />
      <span className="passport-stamp-motif">{displayMotif}</span>
      <StampCopy label={displayLabel} />
      <span className="passport-stamp-code">NIOLI</span>
    </span>
  );
}
