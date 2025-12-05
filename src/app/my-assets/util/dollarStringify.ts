export const dollarStringify = (value: number) => {
  const isMillionOrMore = Math.abs(value) >= 1_000_000;
  
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: isMillionOrMore ? 2 : 0,
    maximumFractionDigits: isMillionOrMore ? 2 : 0,
  }).format(value);
};