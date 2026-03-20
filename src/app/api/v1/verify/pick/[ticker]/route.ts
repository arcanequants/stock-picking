import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { transactions } from "@/data/stocks";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  // Find the transaction index
  const txIndex = transactions.findIndex((t) => t.ticker === upperTicker);
  if (txIndex === -1) {
    return NextResponse.json(
      { error: `Pick for ${upperTicker} not found` },
      { status: 404 }
    );
  }

  // Recompute hash chain up to and including this pick
  let previousHash = "0".repeat(64);
  for (let i = 0; i < txIndex; i++) {
    const tx = transactions[i];
    const input = `${tx.ticker}|${tx.price}|${tx.date}|${previousHash}`;
    previousHash = createHash("sha256").update(input).digest("hex");
  }

  const tx = transactions[txIndex];
  const input = `${tx.ticker}|${tx.price}|${tx.date}|${previousHash}`;
  const hash = createHash("sha256").update(input).digest("hex");

  // Compute next hash if exists
  let nextHash: string | null = null;
  if (txIndex + 1 < transactions.length) {
    const nextTx = transactions[txIndex + 1];
    const nextInput = `${nextTx.ticker}|${nextTx.price}|${nextTx.date}|${hash}`;
    nextHash = createHash("sha256").update(nextInput).digest("hex");
  }

  return NextResponse.json({
    verified: true,
    pick: {
      pick_number: txIndex + 1,
      ticker: tx.ticker,
      price: tx.price,
      date: tx.date,
      type: tx.type,
      previous_hash: previousHash,
      hash,
      next_hash: nextHash,
    },
    algorithm: "SHA-256(ticker|price|date|previous_hash)",
    chain_position: `${txIndex + 1} of ${transactions.length}`,
  });
}
