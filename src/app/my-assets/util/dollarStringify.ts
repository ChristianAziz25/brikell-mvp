export const dollarStringify = (value: number) => {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};