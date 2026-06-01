/**
 * Content access control.
 *
 * A user can access dictation / grammar / reading-practice content if they are:
 *  - admin or teacher (role-based), OR
 *  - an internal student (has a studentCode assigned by a teacher), OR
 *  - enrolled in at least one paid course (enrolledCourses is non-empty).
 *
 * Everyone else (self-registered, no enrollment) sees a lock modal.
 */

interface AccessProfile {
  role: string;
  studentCode: string | null;
  enrolledCourses: number[];
}

export function canAccessContent(profile: AccessProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "teacher") return true;
  if (profile.studentCode !== null) return true; // HV internal
  return profile.enrolledCourses.length > 0;
}
