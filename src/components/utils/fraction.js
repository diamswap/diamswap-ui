// src/components/utils/fraction.js
export function priceToFraction(priceStr) {
    if (!/^\d+(\.\d+)?$/.test(priceStr)) {
      throw new Error("Invalid price format");
    }
    const [intPart, fracPart = ""] = priceStr.split(".");
    const d = 10 ** fracPart.length;
    const n =
      parseInt(intPart, 10) * d +
      (fracPart ? parseInt(fracPart, 10) : 0);
    return { n, d };
  }
  