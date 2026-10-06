// =============================================================================
// LumiVue — cn() utility
// =============================================================================
// Merges Tailwind classes safely. Required by shadcn/ui components.
// =============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
