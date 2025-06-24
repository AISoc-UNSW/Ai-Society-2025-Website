import { apiFetch } from "./client";
import { Role } from "../types";

export async function getRole(role_id: number): Promise<Role> {
  return apiFetch(`/api/v1/roles/${role_id}`, {
    method: "GET",
  });
}