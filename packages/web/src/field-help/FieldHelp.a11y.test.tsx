// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { FieldHelp } from "./FieldHelp.js";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverStub;
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

describe("FieldHelp accessibility", () => {
  it("opens from keyboard, associates trigger and content, and dismisses with Escape", async () => {
    render(<FieldHelp fieldPath="SECRET.reveal_permission" fieldLabel="Reveal permission" />);

    const trigger = screen.getByRole("button", { name: "Help for Reveal permission" });

    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.keyDown(trigger, { key: "Enter" });

    const content = await screen.findByRole("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(trigger.getAttribute("aria-describedby")).toBe(`${content.id}-summary`);

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens by click/touch path without hover", async () => {
    render(<FieldHelp fieldPath="GENERATION BRIEF.stop_guidance.soft_unit_guidance" fieldLabel="Stop guidance" />);

    const trigger = screen.getByRole("button", { name: "Help for Stop guidance" });

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.queryByText("Stop at the next local response point; do not ask for downstream consequences."))
      .toBeTruthy();
  });
});
