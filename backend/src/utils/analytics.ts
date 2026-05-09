export const calculateVolatility = (prices: number[]): number => {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((price, index) => {
    if (prices[index] === 0) return 0;
    return (price - prices[index]) / prices[index];
  });
  
  const mean = returns.reduce((sum, current) => sum + current, 0) / returns.length;
  const variance =
    returns.reduce((sum, current) => sum + Math.pow(current - mean, 2), 0) / returns.length;
  
  const stdDev = Math.sqrt(variance);
  
  // Express as a percentage of the mean price movement per interval.
  // Annualise to daily: worker fires every 10s → 8,640 samples/day.
  // Daily vol = stdDev × √8640. Display as % (multiply by 100).
  const SAMPLES_PER_DAY = 8_640;
  const dailyVolatility = stdDev * Math.sqrt(SAMPLES_PER_DAY) * 100;
  
  return parseFloat(dailyVolatility.toFixed(4));
};

export const calculateCorrelation = (
  series1: number[],
  series2: number[]
): number => {
  const minLength = Math.min(series1.length, series2.length);
  if (minLength < 2) return 0;
  
  // In finance, correlation must be calculated on percent returns, not raw prices.
  const returns1: number[] = [];
  const returns2: number[] = [];
  
  for (let i = 1; i < minLength; i++) {
    if (series1[i-1] === 0 || series2[i-1] === 0) continue;
    returns1.push((series1[i] - series1[i-1]) / series1[i-1]);
    returns2.push((series2[i] - series2[i-1]) / series2[i-1]);
  }
  
  const length = returns1.length;
  if (length < 2) return 0;

  const mean1 = returns1.reduce((sum, current) => sum + current, 0) / length;
  const mean2 = returns2.reduce((sum, current) => sum + current, 0) / length;
  const covariance =
    returns1.reduce((sum, currentReturn, index) => sum + (currentReturn - mean1) * (returns2[index] - mean2), 0) / length;
  const stdDev1 = Math.sqrt(
    returns1.reduce((sum, currentReturn) => sum + Math.pow(currentReturn - mean1, 2), 0) / length
  );
  const stdDev2 = Math.sqrt(
    returns2.reduce((sum, currentReturn) => sum + Math.pow(currentReturn - mean2, 2), 0) / length
  );
  
  if (stdDev1 === 0 || stdDev2 === 0) return 0;
  return parseFloat((covariance / (stdDev1 * stdDev2)).toFixed(4));
};

export const calculatePriceChangePercent = (
  oldPrice: number,
  newPrice: number
): number => {
  if (oldPrice === 0) return 0;
  return parseFloat((((newPrice - oldPrice) / oldPrice) * 100).toFixed(4));
};
