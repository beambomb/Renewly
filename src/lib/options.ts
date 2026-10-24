export interface SelectOption {
  value: string;
  label: string;
}

/** IANA time zone names, always including `current` and UTC. */
export function timeZoneOptions(current?: string): SelectOption[] {
  const zones = new Set<string>(Intl.supportedValuesOf("timeZone"));
  zones.add("UTC");
  if (current) zones.add(current);
  return [...zones].sort().map((zone) => ({ value: zone, label: zone.replaceAll("_", " ") }));
}

/** ISO 4217 codes with their English names, for example "EUR - Euro". */
export function currencyOptions(): SelectOption[] {
  const names = new Intl.DisplayNames("en", { type: "currency" });
  return Intl.supportedValuesOf("currency")
    .map((code) => ({ value: code, label: `${code} - ${names.of(code) ?? code}` }))
    .sort((a, b) => a.value.localeCompare(b.value));
}
