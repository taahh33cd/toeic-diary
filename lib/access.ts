/**
 * Content access control — freemium model.
 *
 * Exempt users (unlimited access, no timer):
 *  - admin or teacher (role-based)
 *  - internal student (has a studentCode assigned by a teacher)
 *  - enrolled in at least one paid course (enrolledCourses non-empty)
 *
 * Free users: get FREE_LIMIT_SECONDS (120 min) of cumulative usage.
 * After that, canAccessContent returns false until they enroll.
 */

export const FREE_LIMIT_SECONDS = 7200; // 120 minutes

export interface AccessProfile {
  role: string;
  studentCode: string | null;
  enrolledCourses: number[];
  freeUsageSeconds?: number;
}

/** Returns true if this user is permanently exempt from the usage timer. */
export function isUsageExempt(profile: AccessProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "teacher") return true;
  if (profile.studentCode !== null) return true; // HV internal
  return profile.enrolledCourses.length > 0; // paid
}

/** Returns true if the user can access gated content right now. */
export function canAccessContent(profile: AccessProfile | null | undefined): boolean {
  if (!profile) return false;
  if (isUsageExempt(profile)) return true;
  return (profile.freeUsageSeconds ?? 0) < FREE_LIMIT_SECONDS;
}
