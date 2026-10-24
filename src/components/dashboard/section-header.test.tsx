// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SectionCost } from "@/lib/money/section-cost";
import { SectionHeader } from "./section-header";

afterEach(cleanup);

const multi: SectionCost = {
  totals: [
    { currency: "EUR", monthlyMinor: 3500 },
    { currency: "IDR", monthlyMinor: 86000 },
    { currency: "USD", monthlyMinor: 1200 },
  ],
  estimated: false,
};

describe("SectionHeader", () => {
  it("puts the figure before the heading", () => {
    const { container } = render(<SectionHeader kind="subscription" count={3} cost={multi} />);
    const list = container.querySelector("ul");
    const heading = screen.getByRole("heading", { level: 2 });
    expect(list).not.toBeNull();
    expect(list!.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows every currency with the unit once", () => {
    const { container } = render(<SectionHeader kind="subscription" count={3} cost={multi} />);
    const text = container.textContent ?? "";
    expect(text).toContain("€35.00");
    expect(text).toContain("Rp");
    expect(text).toContain("86.000");
    expect(text).toContain("$12.00");
    expect(screen.getAllByText("per month")).toHaveLength(1);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(2);
  });

  it("labels an estimate", () => {
    render(<SectionHeader kind="recurring" count={1} cost={{ totals: [{ currency: "IDR", monthlyMinor: 260893 }], estimated: true }} />);
    expect(screen.getByText("per month (est.)")).toBeTruthy();
    expect(screen.queryByText("per month")).toBeNull();
  });

  it.each([
    ["null cost", null],
    ["empty totals", { totals: [], estimated: true }],
  ])("renders only the name and count for %s", (_label, cost) => {
    const { container } = render(<SectionHeader kind="warranty" count={2} cost={cost} />);
    expect(container.querySelector("ul")).toBeNull();
    expect(container.textContent).not.toContain("per month");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain("Warranties");
  });

  it("shows the count as a bare number", () => {
    render(<SectionHeader kind="reminder" count={4} cost={null} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toMatch(/4$/);
    expect(heading.textContent).not.toMatch(/items/);
    expect(heading.id).toBe("reminder-heading");
  });
});
