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
  it("renders accepted segments in sequence order with readable text and metadata", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [segment({ id: 30, sequence: 3, text: "Third cloth." }), segment({ id: 10, sequence: 1, text: "First cloth." })]
    });

    render(<AcceptedSegmentsView />);

    expect(await screen.findByRole("heading", { name: "Accepted Segments" })).toBeTruthy();
    expect(screen.getByText("Accepted prose is readable output, not continuity canon.")).toBeTruthy();
    const renderedSegments = screen.getAllByRole("article");
    expect(renderedSegments.map((article) => article.textContent)).toEqual([
      expect.stringContaining("First cloth."),
      expect.stringContaining("Third cloth.")
    ]);
    expect(screen.getAllByText("Stored sequence")).toHaveLength(2);
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getAllByText("openai/gpt-4.1")).toHaveLength(2);
    expect(screen.getAllByText("template-1")).toHaveLength(2);
    expect(screen.getAllByText("compiler-1")).toHaveLength(2);
    expect(screen.getAllByText("contract-1")).toHaveLength(2);
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

    expect(await screen.findByText("The amber door closes.")).toBeTruthy();
    const filter = screen.getByRole<HTMLInputElement>("searchbox", { name: "Filter archive" });
    fireEvent.change(filter, { target: { value: "blue" } });

    expect(screen.queryByText("The amber door closes.")).toBeNull();
    expect(screen.getByText("The blue key turns.")).toBeTruthy();
    expect(listAcceptedSegments).toHaveBeenCalledTimes(1);

    fireEvent.change(filter, { target: { value: "" } });

    expect(screen.getByText("The amber door closes.")).toBeTruthy();
    expect(screen.getByText("The blue key turns.")).toBeTruthy();
    expect(listAcceptedSegments).toHaveBeenCalledTimes(1);
  });

  it("requires confirmation before deleting and removes the row on success", async () => {
    vi.mocked(listAcceptedSegments).mockResolvedValue({
      ok: true,
      segments: [segment({ id: 1, sequence: 1, text: "Keep this output." }), segment({ id: 2, sequence: 2, text: "Delete this output." })]
    });
    vi.mocked(deleteAcceptedSegment).mockResolvedValue({ ok: true, deleted: { id: 2 } });

    render(<AcceptedSegmentsView />);

    expect(await screen.findByText("Delete this output.")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1] ?? failButton());

    expect(deleteAcceptedSegment).not.toHaveBeenCalled();
    expect(screen.getByText("Delete removes this readable output only. Records are unchanged.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Confirm delete output" }));

    await waitFor(() => expect(screen.queryByText("Delete this output.")).toBeNull());
    expect(screen.getByText("Keep this output.")).toBeTruthy();
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

    expect(await screen.findByText("Still readable.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete output" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Accepted segment not found: 1.");
    expect(screen.getByText("Still readable.")).toBeTruthy();
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

      expect(await screen.findByText("Hidden by active filter.")).toBeTruthy();
      fireEvent.change(screen.getByRole("searchbox", { name: "Filter archive" }), { target: { value: "visible" } });
      expect(screen.queryByText("Hidden by active filter.")).toBeNull();

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

    expect(await screen.findByText("Readable only.")).toBeTruthy();
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

function failButton(): HTMLButtonElement {
  throw new Error("Expected delete button.");
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
