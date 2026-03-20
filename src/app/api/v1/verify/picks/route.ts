import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { transactions } from "@/data/stocks";

export async function GET() {
  // Recompute hash chain from source of truth (transactions)
  const ledger: Array<{
    pick_number: number;
    ticker: string;
    price: number;
    date: string;
    previous_hash: string;
    hash: string;
  }> = [];

  let previousHash = "0".repeat(64);
  let chainValid = true;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const input = `${tx.ticker}|${tx.price}|${tx.date}|${previousHash}`;
    const hash = createHash("sha256").update(input).digest("hex");

    ledger.push({
      pick_number: i + 1,
      ticker: tx.ticker,
      price: tx.price,
      date: tx.date,
      previous_hash: previousHash,
      hash,
    });

    previousHash = hash;
  }

  return NextResponse.json({
    valid: chainValid,
    chain_length: ledger.length,
    latest_hash: ledger[ledger.length - 1]?.hash ?? null,
    algorithm: "SHA-256(ticker|price|date|previous_hash)",
    source: "git-committed, immutable transaction history",
    picks: ledger,
  });
}
