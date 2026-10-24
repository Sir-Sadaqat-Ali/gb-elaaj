// Shared RBAC helper for /api/location/* routes.
//
// All location routes share this access matrix:
//   • The patient on the request can read their own request's location
//   • The assigned nurse can read + write
//   • An ADMIN can read all (audit-logged for privacy)
//   • Everyone else gets 403
//
// Centralized here so we never drift between routes.

import { Role } from "@prisma/client";
import type { HomeCareRequest, NurseProfile, PatientProfile, User } from "@prisma/client";

type RequestForRbac = HomeCareRequest & {
  patient: PatientProfile & { user: Pick<User, "id"> };
  nurse: (NurseProfile & { user: Pick<User, "id"> }) | null;
};

export type LocationCallerRole = "patient" | "nurse" | "admin" | null;

export function whoCanAccess(
  callerUserId: string,
  callerRole: Role,
  request: RequestForRbac,
): LocationCallerRole {
  if (request.patient.user.id === callerUserId) return "patient";
  if (request.nurse?.user.id === callerUserId) return "nurse";
  if (callerRole === Role.ADMIN) return "admin";
  return null;
}
