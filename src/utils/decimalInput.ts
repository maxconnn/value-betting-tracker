const DEFAULT_MAX_FRACTION_DIGITS = 2;

function buildDecimalPattern(maxFractionDigits: number) {
  return new RegExp(
    `^(?:\\d+(?:\\.\\d{0,${maxFractionDigits}})?|\\.\\d{1,${maxFractionDigits}})?$`,
  );
}

export function normalizeDecimalInput(
  rawValue: string,
  maxFractionDigits = DEFAULT_MAX_FRACTION_DIGITS,
) {
  const normalizedValue = rawValue.replace(/\s+/g, '').replace(/,/g, '.');
  const pattern = buildDecimalPattern(maxFractionDigits);

  if (!pattern.test(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}
