import fc from "fast-check";

export const recordIdArbitrary = fc
  .integer({ min: 1, max: 999_999 })
  .map((value) => `019b0298-5c00-7000-8000-${value.toString().padStart(12, "0")}`);

export const displayLabelArbitrary = fc
  .tuple(fc.constantFrom("Alpha", "Beta", "Clock", "Fact", "Plan", "Secret", "Zeta"), fc.integer({ min: 0, max: 4 }))
  .map(([prefix, suffix]) => `${prefix} ${suffix}`);
