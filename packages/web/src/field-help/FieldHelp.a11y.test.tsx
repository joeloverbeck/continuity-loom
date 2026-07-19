// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { FieldHelp } from "./FieldHelp.js";
import { BriefFieldRow } from "../generation-brief/BriefFieldRow.js";

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

  it("states the person exclusion in ENTITY short_description help via keyboard and accessible description", async () => {
    // #113 (F004): help must make clear a person entity's short_description is not compiled into
    // material pressure, and route offstage-person pressure to the Generation Brief.
    render(<FieldHelp fieldPath="ENTITY.short_description" fieldLabel="short_description" />);

    const trigger = screen.getByRole("button", { name: "Help for short_description" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });

    const content = await screen.findByRole("dialog");
    expect(trigger.getAttribute("aria-describedby")).toBe(`${content.id}-summary`);
    const summary = document.getElementById(`${content.id}-summary`);
    expect(summary?.textContent).toContain(
      "A person entity's short_description is not compiled into material pressure"
    );
    expect(within(content).getByText(/author the current pressure in the Generation Brief/)).toBeTruthy();
    expect(within(content).getByText(/optional durable deepening, not a prerequisite/)).toBeTruthy();
  });

  it("states non-person material-pressure eligibility in ENTITY entity_kind help", async () => {
    render(<FieldHelp fieldPath="ENTITY.entity_kind" fieldLabel="entity_kind" />);

    const trigger = screen.getByRole("button", { name: "Help for entity_kind" });
    fireEvent.click(trigger);

    const content = await screen.findByRole("dialog");
    const summary = document.getElementById(`${content.id}-summary`);
    expect(summary?.textContent).toContain("A selected non-person entity compiles into material pressure");
    expect(summary?.textContent).toContain("a person entity does not");
  });

  it("places the brief help trigger in the label row without nesting it inside the field label", () => {
    render(
      <BriefFieldRow
        path="current_authoritative_state.current_time"
        schemaLabel="current_time"
        generationContext="first_segment"
      >
        <input />
      </BriefFieldRow>
    );

    const trigger = screen.getByRole("button", { name: "Help for Current time" });
    const field = screen.getByLabelText(/current_time/);
    const label = document.querySelector(`label[for="${field.id}"]`);

    expect(trigger.closest(".briefFieldLabelRow")).toBeTruthy();
    expect(label?.contains(trigger)).toBe(false);
  });
});
