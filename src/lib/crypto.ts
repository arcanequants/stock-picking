import { JsonRpcProvider, Interface, Log } from "ethers";

// USDC on Base L2
const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const MIN_AMOUNT_USDC = 5;
const MIN_CONFIRMATIONS = 6;

const iface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export interface PaymentVerification {
  valid: boolean;
  from: string;
  to: string;
  amount: number;
  error?: string;
}

export async function verifyUsdcPayment(
  txHash: string
): Promise<PaymentVerification> {
  const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  const walletAddress = process.env.CRYPTO_WALLET_ADDRESS;

  if (!walletAddress) {
    return {
      valid: false,
      from: "",
      to: "",
      amount: 0,
      error: "Crypto payments not configured",
    };
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);

    // Get receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { valid: false, from: "", to: "", amount: 0, error: "Transaction not found" };
    }

    // Check confirmations
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    if (confirmations < MIN_CONFIRMATIONS) {
      return {
        valid: false,
        from: "",
        to: "",
        amount: 0,
        error: `Transaction needs ${MIN_CONFIRMATIONS} confirmations, has ${confirmations}`,
      };
    }

    // Check status
    if (receipt.status !== 1) {
      return { valid: false, from: "", to: "", amount: 0, error: "Transaction failed" };
    }

    // Find USDC Transfer event
    const transferLog = receipt.logs.find(
      (log: Log) =>
        log.address.toLowerCase() === USDC_BASE_ADDRESS.toLowerCase() &&
        log.topics[0] === TRANSFER_TOPIC
    );

    if (!transferLog) {
      return {
        valid: false,
        from: "",
        to: "",
        amount: 0,
        error: "No USDC transfer found in transaction",
      };
    }

    const parsed = iface.parseLog({
      topics: transferLog.topics as string[],
      data: transferLog.data,
    });

    if (!parsed) {
      return { valid: false, from: "", to: "", amount: 0, error: "Failed to parse transfer" };
    }

    const from = parsed.args[0] as string;
    const to = parsed.args[1] as string;
    const rawAmount = parsed.args[2] as bigint;
    const amount = Number(rawAmount) / 10 ** USDC_DECIMALS;

    // Verify recipient
    if (to.toLowerCase() !== walletAddress.toLowerCase()) {
      return {
        valid: false,
        from,
        to,
        amount,
        error: "Payment not sent to correct wallet",
      };
    }

    // Verify amount
    if (amount < MIN_AMOUNT_USDC) {
      return {
        valid: false,
        from,
        to,
        amount,
        error: `Minimum payment is ${MIN_AMOUNT_USDC} USDC, received ${amount}`,
      };
    }

    return { valid: true, from, to, amount };
  } catch (err) {
    return {
      valid: false,
      from: "",
      to: "",
      amount: 0,
      error: `Verification error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}
