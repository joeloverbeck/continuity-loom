import assert from "node:assert/strict";
import test from "node:test";

import {
  appearsToContainCompiledPrompt,
  clearVisibleField,
  isSupportedVerb,
  visibleScopeContainsCompiledPrompt
} from "./browser-act.mjs";

test("recognizes prose and assistance prompts before terminal output", () => {
  const prompts = [
    "# Generated Prose Prompt\nWrite one segment.",
    "# Grounded Ideation Prompt\nReturn ideas.",
    "# Story-Record Hygiene Prompt\nReview records.",
    "# Segment Reconciliation Prompt\nPropose changes.",
    "<role>Writer</role>\n<final_output_instruction>Prose only.</final_output_instruction>"
  ];
  for (const prompt of prompts) assert.equal(appearsToContainCompiledPrompt(prompt), true);
});

test("recognizes serialized headings and structural assistance prompt boundaries", () => {
  const prompts = [
    '- code: "# Segment Reconciliation Prompt\\naccepted evidence follows"',
    "<ideation_role>Consultant</ideation_role>\n<ideation_output_format>Blocks</ideation_output_format>",
    "<record_hygiene_role>Reviewer</record_hygiene_role>\n<record_hygiene_output_format>JSON</record_hygiene_output_format>",
    "<segment_reconciliation_role>Reviewer</segment_reconciliation_role>\n<segment_reconciliation_output_format>JSON</segment_reconciliation_output_format>"
  ];
  for (const prompt of prompts) assert.equal(appearsToContainCompiledPrompt(prompt), true);
});

test("detects a visible prompt body inside or intersecting an output scope", async () => {
  const descendantScope = {
    locator: (selector) => {
      assert.equal(selector, '[aria-label="Compiled prompt preview"] pre:visible');
      return { count: async () => 1 };
    },
    evaluate: async () => {
      throw new Error("descendant match should short-circuit");
    }
  };
  assert.equal(await visibleScopeContainsCompiledPrompt(descendantScope), true);

  const scope = (promptBody, style = { display: "block", visibility: "visible" }) => ({
    locator: () => ({ count: async () => 0 }),
    evaluate: async (predicate, selector) => {
      const originalGetComputedStyle = globalThis.getComputedStyle;
      globalThis.getComputedStyle = () => style;
      try {
        return predicate(
          {
            closest: (receivedSelector) => {
              assert.equal(receivedSelector, selector);
              return promptBody;
            }
          },
          selector
        );
      } finally {
        if (originalGetComputedStyle) globalThis.getComputedStyle = originalGetComputedStyle;
        else delete globalThis.getComputedStyle;
      }
    }
  });
  const visiblePromptBody = { getClientRects: () => [{}] };
  assert.equal(await visibleScopeContainsCompiledPrompt(scope(visiblePromptBody)), true);
  assert.equal(await visibleScopeContainsCompiledPrompt(scope(null)), false);
  assert.equal(
    await visibleScopeContainsCompiledPrompt(
      scope(visiblePromptBody, { display: "none", visibility: "visible" })
    ),
    false
  );
});

test("does not classify ordinary visible UI text as a compiled prompt", () => {
  assert.equal(
    appearsToContainCompiledPrompt("Project Library\nCreate Project\nNo project open."),
    false
  );
  assert.equal(
    appearsToContainCompiledPrompt("## Segment Reconciliation Prompt Template"),
    false
  );
});

test("supports clearing a visible field without a temporary input file", async () => {
  const calls = [];
  const locator = {
    fill: async (...args) => calls.push(args)
  };

  assert.equal(isSupportedVerb("clear"), true);
  await clearVisibleField(locator, 1_250);
  assert.deepEqual(calls, [["", { timeout: 1_250 }]]);
});
