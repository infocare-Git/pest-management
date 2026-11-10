import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Actor, Role } from "@/lib/types";
import { UserError } from "./nafha";

const ROLES: Role[] = ["lead_farmer", "expert", "authority", "admin"];

/**
 * PILOT ONLY: the role is picked in the sidebar and kept in a cookie, with no login.
 * Replace with real authentication (e.g. NAFHA accounts / phone OTP) before the
 * system is used outside a supervised pilot.
 */
export async function getActor(): Promise<Actor> {
  const c = await cookies();
  const role = c.get("oh_role")?.value as Role | undefined;
  return {
    role: role && ROLES.includes(role) ? role : "lead_farmer",
    name: decodeURIComponent(c.get("oh_name")?.value ?? "") || "Unnamed user",
  };
}

export function can(actor: Actor, action: "review" | "manage_registry" | "handle_flags" | "admin"): boolean {
  switch (action) {
    case "review":
      return actor.role === "expert" || actor.role === "admin";
    case "manage_registry":
    case "handle_flags":
      return actor.role === "authority" || actor.role === "admin";
    case "admin":
      return actor.role === "admin";
  }
}

export async function requireRole(action: Parameters<typeof can>[1]): Promise<Actor> {
  const actor = await getActor();
  if (!can(actor, action)) throw new UserError("Your role is not allowed to do this", 403);
  return actor;
}

/** Wrap a route handler so UserErrors become JSON error responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A) => {
    try {
      const result = await fn(...args);
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof UserError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}
