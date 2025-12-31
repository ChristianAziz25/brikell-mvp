export const dollarStringify = ({value, format = "number"}:{value: number, format?: "text" | "number"}) => {
  if (format === "text") {
    const absValue = Math.abs(value);
    
    if (absValue < 1000) {
      return new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (absValue < 1_000_000) {
      const rounded = Math.round(value / 1000);
      return rounded + "K";
    }
    if (absValue < 1_000_000_000) {
      const rounded = Math.round(value / 1_000_000);
      return rounded + "M";
    }
    if (absValue < 1_000_000_000_000) {
      const rounded = Math.round(value / 1_000_000_000);
      return rounded + "B";
    }
    if (absValue < 1_000_000_000_000_000) {
      const rounded = Math.round(value / 1_000_000_000_000);
      return rounded + "T";
    }
    const rounded = Math.round(value / 1_000_000_000_000_000);
    return rounded + "Q";
  }
  const isMillionOrMore = Math.abs(value) >= 1_000_000;
  
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: isMillionOrMore ? 2 : 0,
    maximumFractionDigits: isMillionOrMore ? 2 : 0,
  }).format(value);
};