// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary.js";

let shouldThrow = true;

beforeEach(() => {
  shouldThrow = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders a fallback instead of leaving the document blank when a child throws", () => {
    renderBoundary();

    expect(screen.getByRole("heading", { name: "Something went wrong in this view" })).toBeTruthy();
    expect(document.body.textContent).toContain("Something went wrong in this view");
  });

  it("resets and renders children again when the underlying throw is gone", () => {
    renderBoundary();
    expect(screen.getByRole("heading", { name: "Something went wrong in this view" })).toBeTruthy();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByRole("heading", { name: "Recovered view" })).toBeTruthy();
  });

  it("leaves surrounding navigation mounted while the view fallback is shown", () => {
    render(
      <MemoryRouter>
        <main>
          <nav aria-label="Primary">
            <a href="/records">Records</a>
          </nav>
          <ErrorBoundary>
            <ThrowingView />
          </ErrorBoundary>
        </main>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Records" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Something went wrong in this view" })).toBeTruthy();
  });
});

function renderBoundary() {
  return render(
    <MemoryRouter>
      <ErrorBoundary>
        <ThrowingView />
      </ErrorBoundary>
    </MemoryRouter>
  );
}

function ThrowingView(): React.JSX.Element {
  if (shouldThrow) {
    throw new Error("view failed");
  }

  return <h2>Recovered view</h2>;
}
