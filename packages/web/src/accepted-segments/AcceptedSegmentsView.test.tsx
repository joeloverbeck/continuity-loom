// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteAcceptedSegment, listAcceptedSegments, type AcceptedSegment } from "../api.js";
import { AcceptedSegmentsView } from "./AcceptedSegmentsView.js";

vi.mock("../api.js", () => ({
  deleteAcceptedSegment: vi.fn(),
  listAcceptedSegments: vi.fn()
}));

let scrollMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  window.history.replaceState(null, "", "/accepted-segments");
  setPageMetrics({ innerHeight: 800, scrollHeight: 800, scrollY: 0 });
  scrollMock = vi.fn();
  Element.prototype.scrollIntoView = scrollMock as unknown as Element["scrollIntoView"];
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList(false)));
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

  it("shows and searches truthful source-specific metadata without user-supplied placeholders", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        {
          ...segment({ id: 1, sequence: 1, text: "OpenRouter cloth." }),
          metadata
        },
        {
          ...segment({ id: 2, sequence: 2, text: "User-supplied cloth." }),
          metadata: {
            source: "user_supplied",
            versions: metadata.versions
          }
        }
      ]
    });

    render(<AcceptedSegmentsView />);

    expect(await screen.findByRole("button", { name: /Segment 2/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));

    expect(screen.getAllByText("Source")).toHaveLength(2);
    expect(screen.getByText("OpenRouter")).toBeTruthy();
    expect(screen.getByText("User-supplied")).toBeTruthy();
    expect(screen.getAllByText("Model")).toHaveLength(1);
    expect(screen.getAllByText("Provider")).toHaveLength(1);
    expect(screen.getAllByText("Temperature")).toHaveLength(1);
    expect(screen.getAllByText("Max output tokens")).toHaveLength(1);
    expect(screen.getAllByText("Top P")).toHaveLength(1);
    expect(screen.queryByText("Not set")).toBeNull();

    const filter = screen.getByRole("searchbox", { name: "Filter archive" });
    fireEvent.change(filter, { target: { value: "user-supplied" } });
    expect(screen.queryByRole("button", { name: /Segment 1/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Segment 2/ })).toBeTruthy();

    fireEvent.change(filter, { target: { value: "openrouter" } });
    expect(screen.getByRole("button", { name: /Segment 1/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Segment 2/ })).toBeNull();
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

  it("lands on and focuses the latest segment when no segment hash is present", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: "Opening cloth." }),
        segment({ id: 2, sequence: 2, text: "Latest cloth." })
      ]
    });

    render(<AcceptedSegmentsView />);

    const latestToggle = await screen.findByRole("button", { name: /Segment 2/ });

    await waitFor(() => expect(document.activeElement).toBe(latestToggle));
    expect(scrollIntoViewMock()).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });
    expect(latestToggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("expands and focuses a segment hash target instead of the latest segment", async () => {
    window.history.replaceState(null, "", "/accepted-segments#segment-1");
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: "Opening cloth." }),
        segment({ id: 2, sequence: 2, text: "Latest cloth." })
      ]
    });

    render(<AcceptedSegmentsView />);

    const firstToggle = await screen.findByRole("button", { name: /Segment 1/ });

    await waitFor(() => expect(document.activeElement).toBe(firstToggle));
    expect(firstToggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: /Segment 2/ }).getAttribute("aria-expanded")).toBe("true");
    expect(scrollIntoViewMock()).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });
  });

  it("falls back to latest landing for an unknown segment hash", async () => {
    window.history.replaceState(null, "", "/accepted-segments#segment-999");
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: "Opening cloth." }),
        segment({ id: 2, sequence: 2, text: "Latest cloth." })
      ]
    });

    render(<AcceptedSegmentsView />);

    const latestToggle = await screen.findByRole("button", { name: /Segment 2/ });

    await waitFor(() => expect(document.activeElement).toBe(latestToggle));
    expect(latestToggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("uses instant landing when reduced motion is preferred", async () => {
    vi.mocked(window.matchMedia).mockImplementation(() => mediaQueryList(true));
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [segment({ id: 1, sequence: 1, text: "Readable only." })]
    });

    render(<AcceptedSegmentsView />);

    await screen.findByRole("button", { name: /Segment 1/ });

    await waitFor(() => expect(scrollIntoViewMock()).toHaveBeenCalledWith({ block: "start", behavior: "auto" }));
  });

  it("reacts to hash changes while the view remains mounted", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: "Opening cloth." }),
        segment({ id: 2, sequence: 2, text: "Latest cloth." })
      ]
    });

    render(<AcceptedSegmentsView />);

    const firstToggle = await screen.findByRole("button", { name: /Segment 1/ });
    const latestToggle = screen.getByRole("button", { name: /Segment 2/ });
    await waitFor(() => expect(document.activeElement).toBe(latestToggle));

    window.history.replaceState(null, "", "/accepted-segments#segment-1");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => expect(document.activeElement).toBe(firstToggle));
    expect(firstToggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("expands and collapses every segment from the toolbar", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: "Opening cloth." }),
        segment({ id: 2, sequence: 2, text: "Middle cloth." }),
        segment({ id: 3, sequence: 3, text: "Latest cloth." })
      ]
    });

    const { container } = render(<AcceptedSegmentsView />);

    await screen.findByRole("button", { name: /Segment 1/ });
    expect(getRenderedProse(container)).toEqual(["Latest cloth."]);

    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));

    expect(getRenderedProse(container)).toEqual(["Opening cloth.", "Middle cloth.", "Latest cloth."]);

    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));

    expect(getRenderedProse(container)).toEqual([]);
  });

  it("hides jump navigation until the archive is taller than the viewport", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [segment({ id: 1, sequence: 1, text: "Readable only." })]
    });

    render(<AcceptedSegmentsView />);

    await screen.findByRole("button", { name: /Segment 1/ });
    expect(screen.getByRole("button", { name: "Expand all" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Collapse all" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
  });

  it("moves focus with Back to top and Jump to latest controls", async () => {
    setPageMetrics({ innerHeight: 600, scrollHeight: 1200, scrollY: 120 });
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [
        segment({ id: 1, sequence: 1, text: "Opening cloth." }),
        segment({ id: 2, sequence: 2, text: "Latest cloth." })
      ]
    });

    render(<AcceptedSegmentsView />);

    const latestToggle = await screen.findByRole("button", { name: /Segment 2/ });
    const topTarget = document.getElementById("accepted-archive-top");
    expect(topTarget).toBeTruthy();
    expect(await screen.findByRole("navigation", { name: "Accepted segment navigation" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));

    expect(document.activeElement).toBe(topTarget);
    expect(scrollIntoViewMock()).toHaveBeenLastCalledWith({ block: "start", behavior: "smooth" });

    fireEvent.click(screen.getByRole("button", { name: "Jump to latest" }));

    expect(document.activeElement).toBe(latestToggle);
    expect(latestToggle.getAttribute("aria-expanded")).toBe("true");
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
        {
          ...segment({ id: 2, sequence: 2, text: "Filtered-visible prose." }),
          metadata: { source: "user_supplied", versions: metadata.versions }
        },
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
      expect(markdown).toContain("- Source: OpenRouter");
      expect(markdown).toContain("- Source: User-supplied");
      expect(plainText).toContain("Source: OpenRouter");
      expect(plainText).toContain("Source: User-supplied");
      expect(markdown?.match(/^- Model:/gm)).toHaveLength(1);
      expect(markdown?.match(/^- Provider:/gm)).toHaveLength(1);
      expect(markdown?.match(/^- Temperature:/gm)).toHaveLength(1);
      expect(markdown?.match(/^- Max output tokens:/gm)).toHaveLength(1);
      expect(markdown?.match(/^- Top P:/gm)).toHaveLength(1);
      expect(plainText?.match(/^Model:/gm)).toHaveLength(1);
      expect(plainText?.match(/^Provider:/gm)).toHaveLength(1);
      expect(plainText?.match(/^Temperature:/gm)).toHaveLength(1);
      expect(plainText?.match(/^Max output tokens:/gm)).toHaveLength(1);
      expect(plainText?.match(/^Top P:/gm)).toHaveLength(1);
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
  source: "openrouter",
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
} satisfies AcceptedSegment["metadata"];

function getRenderedProse(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".acceptedSegmentText")).map((node) => node.textContent ?? "");
}

function containerFromDocument(): HTMLElement {
  return document.body;
}

function mediaQueryList(matches: boolean): MediaQueryList {
  return {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  };
}

function scrollIntoViewMock(): ReturnType<typeof vi.fn> {
  return scrollMock;
}

function setPageMetrics({
  innerHeight,
  scrollHeight,
  scrollY
}: {
  innerHeight: number;
  scrollHeight: number;
  scrollY: number;
}): void {
  Object.defineProperty(window, "innerHeight", { configurable: true, value: innerHeight });
  Object.defineProperty(window, "scrollY", { configurable: true, value: scrollY });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: scrollHeight });
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
