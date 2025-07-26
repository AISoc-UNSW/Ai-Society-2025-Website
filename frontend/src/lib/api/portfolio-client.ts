"use client";

import { PortfolioDetailResponse, PortfolioSimple } from "../types";
import { clientApiFetch } from "./client-side";

export async function getPortfolioDetailsClient(portfolioId: number): Promise<PortfolioDetailResponse> {
  return await clientApiFetch(`/api/v1/portfolios/${portfolioId}`, {
    method: "GET",
  });
}

export async function getAllPortfoliosSimpleClient(): Promise<PortfolioSimple[]> {
  return await clientApiFetch("/api/v1/portfolios/all/simple", {
    method: "GET",
  });
} 