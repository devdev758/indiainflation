const defaultFormatter = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

export const safeFormatDate = (
  d?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-IN"
): string => {
  if (!d) {
    return "—";
  }

  const parsed = d instanceof Date ? d : new Date(d);
  if (!Number.isFinite(parsed.getTime())) {
    return "—";
  }

  if (!options) {
    return defaultFormatter.format(parsed);
  }

  return new Intl.DateTimeFormat(locale, options).format(parsed);
};

export default safeFormatDate;
