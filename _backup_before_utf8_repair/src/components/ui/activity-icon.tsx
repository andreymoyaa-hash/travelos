import {
  Binoculars,
  Camera,
  Coffee,
  Gamepad2,
  Landmark,
  Plane,
  ShoppingBag,
  Soup,
  Sparkles,
  Ticket,
  TrainFront,
  Trees,
} from "lucide-react";
import type { ComponentType } from "react";

import type { ActivityCategory } from "@/types/travel";

const activityIcons: Record<ActivityCategory, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  travel: Plane,
  transport: TrainFront,
  food: Soup,
  geek: Gamepad2,
  shopping: ShoppingBag,
  culture: Landmark,
  temple: Landmark,
  photography: Camera,
  nature: Trees,
  viewpoint: Binoculars,
  gaming: Gamepad2,
  anime: Sparkles,
  "theme-park": Ticket,
  leisure: Coffee,
};

export function ActivityIcon({ category, size = 18, className = "activity-icon-frame" }: { category: ActivityCategory; size?: number; className?: string }) {
  const Icon = activityIcons[category];
  return <span className={`${className} category-${category}`}><Icon size={size} aria-hidden={true} /></span>;
}
