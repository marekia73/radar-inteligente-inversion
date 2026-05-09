import { ProcessedAsset, MarketData } from '../types';

export function enrichAssetsWithMarketData(
  assets: ProcessedAsset[],
  marketDataMap: Record<string, MarketData>
): ProcessedAsset[] {
  return assets.map(asset => {
    const marketData = marketDataMap[asset.ticker];
    return {
      ...asset,
      marketData: marketData,
      dataStatus: marketData ? marketData.status : "simulated"
    };
  });
}
