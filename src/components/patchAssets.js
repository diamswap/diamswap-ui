// patchAssets.js
import { Asset, LiquidityPoolAsset } from "diamnet-sdk";

/**
 * Creates a patched asset with the required "type" fields set.
 *
 * @param {string} code - Asset code (e.g. "TradeToken", "USDC", or "native"/"xlm").
 * @param {string} [issuerPublicKey] - Public key of the asset issuer (omit for "native"/"xlm").
 * @returns {Asset} - A Diamnet SDK Asset object with .type and .assetType set.
 */
export function createPatchedAsset(code, issuerPublicKey) {
  // If code is "native" or "xlm", return the native asset with a .type
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

  // Otherwise, create a non-native asset with the given issuer
  const newAsset = new Asset(code, issuerPublicKey);

  // Decide on credit_alphanum4 vs. credit_alphanum12 based on code length
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
 * Creates a patched LiquidityPoolAsset with the required "type" fields set.
 *
 * @param {Asset} assetA - The first asset in the pool.
 * @param {Asset} assetB - The second asset in the pool.
 * @param {number} fee - Liquidity pool fee (e.g. 30).
 * @returns {LiquidityPoolAsset} - A Diamnet SDK LiquidityPoolAsset with .type set.
 */
export function createPatchedLiquidityPoolAsset(assetA, assetB, fee) {
  const lpAsset = new LiquidityPoolAsset(assetA, assetB, fee);

  // Manually assign the type fields that some wallet UIs rely on
  lpAsset.type = "liquidity_pool_constant_product";
  lpAsset.assetType = "liquidity_pool_constant_product";

  return lpAsset;
}
