export const BASIS_POINT_MAX = 10000;
// Mock token data - in a real app, this would come from an API
export const MOCK_TOKENS = [
  {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png",
  },
  {
    address: "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
    symbol: "JLP",
    name: "Jupiter Perps LP",
    decimals: 6,
    logo: "https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7374617469632e6a75702e61672f6a6c702f69636f6e2e706e67",
  },
];

export const DEFAULT_QUOTE_TOKEN = MOCK_TOKENS[0];

export const BASE_FEE_OPTIONS = [
  { value: 0.01, label: "0.01%" },
  { value: 0.05, label: "0.05%" },
  { value: 0.1, label: "0.1%" },
  { value: 0.3, label: "0.3%" },
  { value: 1, label: "1%" },
];

export const BIN_STEP_OPTIONS = [
  { value: 1, label: "0.01%" },
  { value: 5, label: "0.05%" },
  { value: 10, label: "0.1%" },
  { value: 25, label: "0.25%" },
  { value: 50, label: "0.5%" },
  { value: 100, label: "1%" },
];

export const POSITION_PRESETS = [
  {
    id: 1,
    code: "HFI-001",
    name: "High Frequency Liquidity (HFL)",
    upperPercentage: 0.5,
    lowerPercentage: 0.5,
    solAmount: 1,
  },
  {
    id: 2,
    code: "HFI-002",
    name: "High Frequency Liquidity (HFL) Turbo",
    upperPercentage: 0.25,
    lowerPercentage: 0.25,
    solAmount: 2,
  },
  {
    id: 3,
    code: "HFI-004",
    name: "Multiday Cook Up (MCU)",
    upperPercentage: 15,
    lowerPercentage: 15,
    solAmount: 5,
  },
  {
    id: 4,
    code: "HFI-005",
    name: "TGE Sniper",
    upperPercentage: 5,
    lowerPercentage: 5,
    solAmount: 0.5,
  },
];
