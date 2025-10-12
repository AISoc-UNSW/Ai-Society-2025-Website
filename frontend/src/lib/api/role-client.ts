"use client";

import { Role } from "../types";
import { clientApiFetch } from "./client-side";

export async function getRoleClient(role_id: number): Promise<Role> {
  return clientApiFetch(`/api/v1/roles/${role_id}`, {
    method: "GET",
  });
} 