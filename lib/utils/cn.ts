import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes safely.
 * Tránh conflict khi có điều kiện (vd: "p-4" vs "p-2").
 *
 * @example
 * cn("btn", isActive && "btn-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
