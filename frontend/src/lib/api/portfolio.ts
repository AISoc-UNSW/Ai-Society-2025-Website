import { PortfolioDetailResponse } from "../types";
import { apiFetch } from "./client";

export async function getPortfolioDetails(portfolioId: number): Promise<PortfolioDetailResponse> {
  return await apiFetch(`/api/v1/portfolios/${portfolioId}`, {
    method: "GET",
  });
}