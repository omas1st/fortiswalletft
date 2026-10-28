export const ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', tvSymbol: 'BINANCE:BTCUSDT' },
  { symbol: 'ETH', name: 'Ethereum', tvSymbol: 'BINANCE:ETHUSDT' },
  { symbol: 'USDT', name: 'Tether', tvSymbol: 'BINANCE:USDTUSD' },
  { symbol: 'BNB', name: 'BNB', tvSymbol: 'BINANCE:BNBUSDT' },
  { symbol: 'SOL', name: 'Solana', tvSymbol: 'BINANCE:SOLUSDT' },
  { symbol: 'XRP', name: 'XRP', tvSymbol: 'BINANCE:XRPUSDT' },
  { symbol: 'ADA', name: 'Cardano', tvSymbol: 'BINANCE:ADAUSDT' },
  { symbol: 'DOGE', name: 'Dogecoin', tvSymbol: 'BINANCE:DOGEUSDT' },
  { symbol: 'MATIC', name: 'Polygon', tvSymbol: 'BINANCE:MATICUSDT' },
  { symbol: 'DOT', name: 'Polkadot', tvSymbol: 'BINANCE:DOTUSDT' },
  { symbol: 'LTC', name: 'Litecoin', tvSymbol: 'BINANCE:LTCUSDT' },
  { symbol: 'TRX', name: 'TRON', tvSymbol: 'BINANCE:TRXUSDT' },
  { symbol: 'AVAX', name: 'Avalanche', tvSymbol: 'BINANCE:AVAXUSDT' },
  { symbol: 'LINK', name: 'Chainlink', tvSymbol: 'BINANCE:LINKUSDT' },
  { symbol: 'USDC', name: 'USD Coin', tvSymbol: 'BINANCE:USDCUSDT' },
];

export const assetIcon = (symbol) =>
  `https://assets.coincap.io/assets/icons/${String(symbol || '').toLowerCase()}@2x.png`;

export const findAsset = (symbol) =>
  ASSETS.find((a) => a.symbol === symbol) || {
    symbol,
    name: symbol,
    tvSymbol: `BINANCE:${symbol}USDT`,
  };