import assert from "node:assert/strict";
import test from "node:test";

import { appearsToContainCompiledPrompt } from "./browser-act.mjs";

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

test("does not classify ordinary visible UI text as a compiled prompt", () => {
  assert.equal(
    appearsToContainCompiledPrompt("Project Library\nCreate Project\nNo project open."),
    false
  );
});
