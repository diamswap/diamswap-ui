// src/utils/poolHistory.js

/**
 * Fetch a pool’s last N deposit/withdraw operations and build a time-series of prices.
 * Each record has { ts: number, price: number } where ts is UNIX ms.
 *
 * @param {string} poolId — hex pool ID
 * @param {number} limit — how many operations to fetch (max 200 per Aurora)
 * @returns {Promise<Array<{ts:number,price:number}>>}
 */
export async function fetchPoolHistory(poolId, limit = 200) {
    // build the templated operations URL
    const url = `https://diamtestnet.diamcircle.io/liquidity_pools/${poolId}/operations?limit=${limit}&order=asc`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Error fetching pool history: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    const ops = json._embedded.records || [];
  
    return ops
      // only deposits & withdraws have the reserves field
      .filter((op) =>
        op.type === "liquidity_pool_deposit" ||
        op.type === "liquidity_pool_withdraw"
      )
      .map((op) => {
        const ts = new Date(op.created_at).getTime();
        const [r0, r1] = op.reserves; // r0 = asset A, r1 = asset B
        const price = parseFloat(r1.amount) / parseFloat(r0.amount);
        return { ts, price };
      });
  }
  