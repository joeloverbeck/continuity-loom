import { configure } from "@testing-library/dom";

// RTL's async helpers (waitFor / findBy*) default to a 1000ms budget, which
// timing-sensitive jsdom/React tests (e.g. Radix popover dismissal) can exceed
// under CPU contention on CI runners. Give them headroom; pairs with the
// per-test testTimeout raised in vitest.config.ts.
configure({ asyncUtilTimeout: 5000 });
