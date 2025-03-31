// src/utils/patchAssets.js
import { Asset, LiquidityPoolAsset } from "diamnet-sdk";

/**
 * Creates a patched Asset with the required "type" and "assetType" fields.
 *
 * @param {string} code - The asset code (e.g., "TradeToken", "native").
 * @param {string} [issuerPublicKey] - The issuer's public key (omit for native).
 * @returns {Asset}
 */
export function createPatchedAsset(code, issuerPublicKey) {
  // For native assets:
  if (
    !issuerPublicKey ||
    code.toLowerCase() === "native" ||
    code.toLowerCase() === "xlm"
  ) {
    const nativeAsset = Asset.native();
    nativeAsset.type = "native";
    nativeAsset.assetType = "native";
    return nativeAsset;
  }
  // For non-native assets:
  const newAsset = new Asset(code, issuerPublicKey);
  if (code.length <= 4) {
    newAsset.type = "credit_alphanum4";
    newAsset.assetType = "credit_alphanum4";
  } else {
    newAsset.type = "credit_alphanum12";
    newAsset.assetType = "credit_alphanum12";
  }
  return newAsset;
}

/**
 * Creates a patched LiquidityPoolAsset with the required "type" and "assetType" fields.
 * Here we use "liquidity_pool_shares" which is the convention for pool share assets.
 *
 * @param {Asset} assetA - First asset in the pool.
 * @param {Asset} assetB - Second asset in the pool.
 * @param {number} fee - The fee (e.g., 30).
 * @returns {LiquidityPoolAsset}
 */
export function createPatchedLiquidityPoolAsset(assetA, assetB, fee) {
  const lpAsset = new LiquidityPoolAsset(assetA, assetB, fee);
  lpAsset.type = "liquidity_pool_shares";
  lpAsset.assetType = "liquidity_pool_shares";
  return lpAsset;
}
