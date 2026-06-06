// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DurableChangeReminder } from "./DurableChangeReminder.js";
import { acknowledgeDurableChangeReminder, getDurableChangeReminder } from "../api.js";
import type { DurableChangeReminderResponse } from "../api.js";

vi.mock("../api.js", () => ({
  acknowledgeDurableChangeReminder: vi.fn(),
  getDurableChangeReminder: vi.fn()
}));

const activeReminder = {
  ok: true,
  reminder: {
    active: true,
    latestSegment: { sequence: 3, createdAt: "2026-06-06T08:12:00.000Z" },
    acknowledgedThroughSequence: 2
  }
} satisfies DurableChangeReminderResponse;

const inactiveReminder = {
  ok: true,
  reminder: {
    active: false,
    latestSegment: { sequence: 3, createdAt: "2026-06-06T08:12:00.000Z" },
    acknowledgedThroughSequence: 3
  }
} satisfies DurableChangeReminderResponse;

const noOpenProject = {
  ok: false,
  kind: "no-open-project",
  message: "No project is open."
} satisfies DurableChangeReminderResponse;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DurableChangeReminder", () => {
  it("renders active reminder content, checklist, quick links, and non-modal controls", async () => {
    vi.mocked(getDurableChangeReminder).mockResolvedValue(activeReminder);

    renderReminder();

    expect(await screen.findByRole("heading", { name: "Segment 3 was accepted" })).toBeTruthy();
    expect(screen.getByText(/update records manually before the next generation/i)).toBeTruthy();
    expect(screen.getByText("Did a secret become known?")).toBeTruthy();
    expect(screen.getByText("Did a character move?")).toBeTruthy();
    expect(screen.getByText("Did an object change hands?")).toBeTruthy();
    expect(screen.getByText("Did a relationship or emotion change?")).toBeTruthy();
    expect(screen.getByText("Did a promise, obligation, clock, consequence, injury, or open thread change?")).toBeTruthy();
    expect(screen.getByText("Does current authoritative state need updating?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Acknowledge" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Snooze" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();

    expect(screen.getByRole("link", { name: "Create EVENT" }).getAttribute("href")).toBe("/records?create=EVENT");
    expect(screen.getByRole("link", { name: "Create CAST MEMBER" }).getAttribute("href")).toBe(
      "/records?create=CAST%20MEMBER"
    );
    expect(screen.getByRole("link", { name: "Update Generation Brief" }).getAttribute("href")).toBe("/generation-brief");
    expect(screen.getAllByRole("link", { name: /^Create / })).toHaveLength(12);
  });

  it("acknowledges durably and hides the banner from the server response", async () => {
    vi.mocked(getDurableChangeReminder).mockResolvedValue(activeReminder);
    vi.mocked(acknowledgeDurableChangeReminder).mockResolvedValue(inactiveReminder);

    renderReminder();
    fireEvent.click(await screen.findByRole("button", { name: "Acknowledge" }));

    await waitFor(() => expect(acknowledgeDurableChangeReminder).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Segment 3 was accepted" })).toBeNull());
  });

  it("snoozes only in component state and reappears after remount", async () => {
    vi.mocked(getDurableChangeReminder).mockResolvedValue(activeReminder);

    const rendered = renderReminder();
    fireEvent.click(await screen.findByRole("button", { name: "Snooze" }));

    expect(acknowledgeDurableChangeReminder).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Segment 3 was accepted" })).toBeNull());

    rendered.unmount();
    renderReminder();

    expect(await screen.findByRole("heading", { name: "Segment 3 was accepted" })).toBeTruthy();
  });

  it("renders nothing for inactive and no-open-project states", async () => {
    vi.mocked(getDurableChangeReminder).mockResolvedValueOnce(inactiveReminder).mockResolvedValueOnce(noOpenProject);

    const inactive = renderReminder();
    await waitFor(() => expect(getDurableChangeReminder).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("heading", { name: /was accepted/i })).toBeNull();

    inactive.unmount();
    renderReminder();
    await waitFor(() => expect(getDurableChangeReminder).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("heading", { name: /was accepted/i })).toBeNull();
  });
});

function renderReminder() {
  return render(
    <MemoryRouter>
      <DurableChangeReminder />
    </MemoryRouter>
  );
}
