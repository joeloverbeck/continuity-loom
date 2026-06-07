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

describe("FieldHelp", () => {
  it("renders a real button and opens by click without hover", async () => {
    render(
      <FieldHelp
        fieldPath="GENERATION BRIEF.immediate_handoff.prior_accepted_prose_status_or_handoff_note"
        fieldLabel="Prior accepted prose status"
      />
    );

    const trigger = screen.getByRole("button", { name: "Help for Prior accepted prose status" });

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Accepted prose is readable output, not continuity authority.")).not.toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(await screen.findByText("Prior accepted prose status")).not.toBeNull();
    expect(screen.queryAllByText("Prompt").length).toBeGreaterThan(0);
    expect(trigger.getAttribute("aria-controls")).toMatch(/^field-help-/);
    expect(trigger.getAttribute("aria-describedby")).toMatch(/^field-help-/);
  });

  it("opens and closes with keyboard activation", async () => {
    render(
      <FieldHelp
        fieldPath="GENERATION BRIEF.stop_guidance.soft_unit_guidance"
        fieldLabel="Soft unit guidance"
      />
    );

    const trigger = screen.getByRole("button", { name: "Help for Soft unit guidance" });

    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(await screen.findByText("Where the prose should stop for the user's next decision.")).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(trigger, { key: " " });

    await waitFor(() => {
      expect(screen.queryByText("Where the prose should stop for the user's next decision.")).toBeNull();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("dismisses with Escape, outside click, and second trigger activation", async () => {
    render(
      <div>
        <FieldHelp fieldPath="SECRET.reveal_permission" fieldLabel="Reveal permission" />
        <button type="button">Outside</button>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Help for Reveal permission" });

    fireEvent.click(trigger);
    expect(await screen.findByText("The rule for whether and how this secret may surface.")).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("The rule for whether and how this secret may surface.")).toBeNull();
    });

    fireEvent.click(trigger);
    expect(await screen.findByText("The rule for whether and how this secret may surface.")).not.toBeNull();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    await waitFor(() => {
      expect(screen.queryByText("The rule for whether and how this secret may surface.")).toBeNull();
    });

    fireEvent.click(trigger);
    expect(await screen.findByText("The rule for whether and how this secret may surface.")).not.toBeNull();
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText("The rule for whether and how this secret may surface.")).toBeNull();
    });
  });

  it("renders nothing when no guidance entry exists", () => {
    const { container } = render(<FieldHelp fieldPath="UNKNOWN.field" fieldLabel="Unknown" />);

    expect(container.textContent).toBe("");
  });
});
