import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getStocksList } from "@/lib/api-data";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const url = new URL(request.url);
  const ticker = url.searchParams.get("ticker");
  const sector = url.searchParams.get("sector");
  const region = url.searchParams.get("region");

  let stocksList = getStocksList(result.auth.tier);

  if (ticker) {
    stocksList = stocksList.filter(
      (s) => s.ticker.toLowerCase() === ticker.toLowerCase()
    );
  }
  if (sector) {
    stocksList = stocksList.filter(
      (s) => s.sector.toLowerCase() === sector.toLowerCase()
    );
  }
  if (region) {
    stocksList = stocksList.filter(
      (s) => s.region.toLowerCase() === region.toLowerCase()
    );
  }

  return apiResponse(stocksList, result.auth);
}
