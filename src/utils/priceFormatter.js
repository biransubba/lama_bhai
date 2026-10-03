/**
 * Formats and parses prices entered by hosts or main admin.
 * Provides consistent formatting with Indian Rupee formatting (e.g. ₹2,000 / night).
 */
export function parseAndFormatPrice(rawPrice) {
  if (rawPrice === null || rawPrice === undefined) return null;
  const str = String(rawPrice).trim();
  if (!str) return null;

  // Extract numeric digits
  const numericMatch = str.replace(/,/g, "").match(/\d+(\.\d+)?/);
  if (numericMatch) {
    const num = Number(numericMatch[0]);
    if (!isNaN(num) && num > 0) {
      const formattedNum = num.toLocaleString("en-IN");
      return {
        numeric: num,
        formatted: formattedNum,
        currency: "₹",
        unit: "/ night",
        display: `₹${formattedNum} / night`,
      };
    }
  }

  // Graceful fallback for custom pricing text
  return {
    numeric: null,
    formatted: str.replace(/^₹\s*/, ""),
    currency: "₹",
    unit: "",
    display: str,
  };
}
