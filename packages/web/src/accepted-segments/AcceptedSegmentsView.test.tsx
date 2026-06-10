// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteAcceptedSegment, listAcceptedSegments, type AcceptedSegment, type GenerationMetadata } from "../api.js";
import { AcceptedSegmentsView } from "./AcceptedSegmentsView.js";

vi.mock("../api.js", () => ({
  deleteAcceptedSegment: vi.fn(),
  listAcceptedSegments: vi.fn()
}));

beforeEach(() => {
  vi.mocked(deleteAcceptedSegment).mockReset();
  vi.mocked(listAcceptedSegments).mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("AcceptedSegmentsView", () => {
  it("renders summaries in sequence order and opens the latest segment by default", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 30, sequence: 3, text: "Third cloth." }),
        segment({ id: 10, sequence: 1, text: "First cloth." }),
        segment({ id: 20, sequence: 2, text: "Second cloth." })
      ]
    });

    const { container } = render(<AcceptedSegmentsView />);

    expect(await screen.findByRole("heading", { name: "Accepted Segments" })).toBeTruthy();
    expect(screen.getByText("Accepted prose is readable output, not continuity canon.")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Segment \d/ }).map((button) => button.textContent)).toEqual([
      "Segment 1Expand",
      "Segment 2Expand",
      "Segment 3Collapse"
    ]);
    expect(screen.getByRole("button", { name: /Segment 1/ }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: /Segment 2/ }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: /Segment 3/ }).getAttribute("aria-expanded")).toBe("true");
    expect(getRenderedProse(container)).toEqual(["Third cloth."]);
    expect(screen.getAllByText("Stored sequence")).toHaveLength(1);
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getAllByText("openai/gpt-4.1")).toHaveLength(1);
    expect(screen.getAllByText("template-1")).toHaveLength(1);
    expect(screen.getAllByText("compiler-1")).toHaveLength(1);
    expect(screen.getAllByText("contract-1")).toHaveLength(1);
  });

  it("renders the empty archive state", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({ ok: true, segments: [] });

    render(<AcceptedSegmentsView />);

    expect(await screen.findByText("No accepted segments yet.")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Export Markdown" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Export text" }).disabled).toBe(true);
  });

  it("filters locally and clears without refetching", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: "The amber door closes." }),
        segment({ id: 2, sequence: 2, text: "The blue key turns." })
      ]
    });

    render(<AcceptedSegmentsView />);

    expect(await screen.findByRole("button", { name: /Segment 1/ })).toBeTruthy();
    const filter = screen.getByRole<HTMLInputElement>("searchbox", { name: "Filter archive" });
    fireEvent.change(filter, { target: { value: "blue" } });

    expect(screen.queryByRole("button", { name: /Segment 1/ })).toBeNull();
    expect(getRenderedProse(containerFromDocument())).toEqual(["The blue key turns."]);
    expect(listAcceptedSegments).toHaveBeenCalledTimes(1);

    fireEvent.change(filter, { target: { value: "" } });

    expect(screen.getByRole("button", { name: /Segment 1/ })).toBeTruthy();
    expect(getRenderedProse(containerFromDocument())).toEqual(["The blue key turns."]);
    expect(listAcceptedSegments).toHaveBeenCalledTimes(1);
  });

  it("toggles collapsed prose with mouse and keyboard while keeping collapsed prose out of the DOM", async () => {
    const collapsedText = "First cloth opens with a long corridor before naming the copper hinge at the end.";
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: collapsedText }),
        segment({ id: 2, sequence: 2, text: "Latest cloth." })
      ]
    });

    const { container } = render(<AcceptedSegmentsView />);

    const firstToggle = await screen.findByRole("button", { name: /Segment 1/ });
    expect(firstToggle.getAttribute("aria-expanded")).toBe("false");
    expect(getRenderedProse(container)).toEqual(["Latest cloth."]);

    fireEvent.click(firstToggle);

    expect(firstToggle.getAttribute("aria-expanded")).toBe("true");
    expect(getRenderedProse(container)).toEqual([collapsedText, "Latest cloth."]);

    fireEvent.keyDown(firstToggle, { key: "Enter" });

    expect(firstToggle.getAttribute("aria-expanded")).toBe("false");
    expect(getRenderedProse(container)).toEqual(["Latest cloth."]);
  });

  it("requires confirmation before deleting and removes the row on success", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [segment({ id: 1, sequence: 1, text: "Keep this output." }), segment({ id: 2, sequence: 2, text: "Delete this output." })]
    });
    vi.mocked(deleteAcceptedSegment).mockResolvedValue({ ok: true, deleted: { id: 2 } });

    render(<AcceptedSegmentsView />);

    expect(await screen.findByRole("button", { name: /Segment 2/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Segment 1/ }).getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteAcceptedSegment).not.toHaveBeenCalled();
    expect(screen.getByText("Delete removes this readable output only. Records are unchanged.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Confirm delete output" }));

    await waitFor(() => expect(screen.queryByText("Delete this output.")).toBeNull());
    expect(getRenderedProse(containerFromDocument())).toEqual(["Keep this output."]);
    expect(deleteAcceptedSegment).toHaveBeenCalledWith(2);
  });

  it("surfaces delete failures without removing the segment", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [segment({ id: 1, sequence: 1, text: "Still readable." })]
    });
    vi.mocked(deleteAcceptedSegment).mockResolvedValue({
      ok: false,
      kind: "not-found",
      message: "Accepted segment not found: 1."
    });

    render(<AcceptedSegmentsView />);

    expect(await screen.findByRole("button", { name: /Segment 1/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete output" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Accepted segment not found: 1.");
    expect(getRenderedProse(containerFromDocument())).toEqual(["Still readable."]);
  });

  it("keeps display indices stable under filters and restores tracked expansion after clearing", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: "Opening amber cloth." }),
        segment({ id: 2, sequence: 2, text: "The quartz key turns in the lock." }),
        segment({ id: 3, sequence: 3, text: "Closing blue cloth." })
      ]
    });

    const { container } = render(<AcceptedSegmentsView />);

    const latestToggle = await screen.findByRole("button", { name: /Segment 3/ });
    fireEvent.click(latestToggle);
    expect(latestToggle.getAttribute("aria-expanded")).toBe("false");
    expect(getRenderedProse(container)).toEqual([]);

    fireEvent.change(screen.getByRole("searchbox", { name: "Filter archive" }), { target: { value: "quartz" } });

    expect(screen.getByRole("button", { name: /Segment 2/ }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.queryByRole("button", { name: /Segment 1/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Segment 3/ })).toBeNull();
    expect(getRenderedProse(container)).toEqual(["The quartz key turns in the lock."]);

    fireEvent.change(screen.getByRole("searchbox", { name: "Filter archive" }), { target: { value: "" } });

    expect(screen.getByRole("button", { name: /Segment 3/ }).getAttribute("aria-expanded")).toBe("false");
    expect(getRenderedProse(container)).toEqual([]);
  });

  it("exports the full archive in sequence order independent of the active filter", async () => {
    const blobs: CapturedBlob[] = [];
    vi.stubGlobal("Blob", CapturedBlob);
    const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn((blob: CapturedBlob) => {
        blobs.push(blob);
        return `blob:accepted-${blobs.length}`;
      })
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn()
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 2, sequence: 2, text: "Filtered-visible prose." }),
        segment({ id: 1, sequence: 1, text: "Hidden by active filter." })
      ]
    });

    try {
      render(<AcceptedSegmentsView />);

      expect(await screen.findByRole("button", { name: /Segment 1/ })).toBeTruthy();
      fireEvent.change(screen.getByRole("searchbox", { name: "Filter archive" }), { target: { value: "visible" } });
      expect(screen.queryByRole("button", { name: /Segment 1/ })).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Export Markdown" }));
      fireEvent.click(screen.getByRole("button", { name: "Export text" }));

      expect(click).toHaveBeenCalledTimes(2);
      const markdown = blobs[0]?.content;
      const plainText = blobs[1]?.content;
      expect(markdown).toBeDefined();
      expect(plainText).toBeDefined();
      expect(markdown).toContain("Hidden by active filter.");
      expect(markdown).toContain("Filtered-visible prose.");
      expect(markdown?.indexOf("Hidden by active filter.")).toBeLessThan(
        markdown?.indexOf("Filtered-visible prose.") ?? -1
      );
      expect(plainText).toContain("Hidden by active filter.");
      expect(plainText).toContain("Filtered-visible prose.");
    } finally {
      restoreUrlProperty("createObjectURL", originalCreateObjectUrl);
      restoreUrlProperty("revokeObjectURL", originalRevokeObjectUrl);
    }
  });

  it("does not render prompt-context controls or a durable-change reminder", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [segment({ id: 1, sequence: 1, text: "Readable only." })]
    });

    render(<AcceptedSegmentsView />);

    expect(await screen.findByRole("button", { name: /Segment 1/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /use as prompt context/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /include in prompt/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /include.*prompt/i })).toBeNull();
    expect(screen.queryByText(/durable changes/i)).toBeNull();
  });
});

function segment(input: { id: number; sequence: number; text: string }): AcceptedSegment {
  return {
    id: input.id,
    sequence: input.sequence,
    text: input.text,
    metadata,
    createdAt: "2026-06-06T08:12:00.000Z"
  };
}

const metadata = {
  model: "openai/gpt-4.1",
  provider: "openrouter",
  temperature: 0.4,
  maxOutputTokens: 2200,
  topP: 0.9,
  versions: {
    template: "template-1",
    compiler: "compiler-1",
    contract: "contract-1"
  }
} satisfies GenerationMetadata;

function getRenderedProse(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".acceptedSegmentText")).map((node) => node.textContent ?? "");
}

function containerFromDocument(): HTMLElement {
  return document.body;
}

class CapturedBlob {
  readonly content: string;
  readonly type: string;

  constructor(parts: string[], options?: BlobPropertyBag) {
    this.content = parts.join("");
    this.type = options?.type ?? "";
  }
}

function restoreUrlProperty(property: "createObjectURL" | "revokeObjectURL", descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) {
    Object.defineProperty(URL, property, descriptor);
    return;
  }

  delete (URL as Partial<Record<typeof property, unknown>>)[property];
}
