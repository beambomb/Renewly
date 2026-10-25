// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SectionCost } from "@/lib/money/section-cost";
import { SectionSummary } from "./section-summary";

afterEach(cleanup);

const one: SectionCost = { totals: [{ currency: "IDR", monthlyMinor: 86000 }], estimated: false };
const multi: SectionCost = {
  totals: [
    { currency: "EUR", monthlyMinor: 3500 },
    { currency: "IDR", monthlyMinor: 86000 },
    { currency: "USD", monthlyMinor: 1200 },
  ],
  estimated: false,
};

describe("SectionSummary", () => {
  it("shows one currency with the unit once", () => {
    const { container } = render(<SectionSummary kind="subscription" count={3} cost={one} />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toContain("Rp");
    expect(items[0]?.textContent).toContain("86.000");
    expect(screen.getAllByText("per month")).toHaveLength(1);
  });

  it("stacks every currency in order, unconverted, with the unit once", () => {
    const { container } = render(<SectionSummary kind="subscription" count={3} cost={multi} />);
    const texts = Array.from(container.querySelectorAll("li")).map((li) => li.textContent ?? "");
    expect(texts).toHaveLength(3);
    expect(texts[0]).toBe("€35.00");
    expect(texts[1]).toContain("86.000");
    expect(texts[2]).toBe("$12.00");
    expect(screen.getAllByText("per month")).toHaveLength(1);
  });

  it("labels an estimate", () => {
    render(<SectionSummary kind="recurring" count={1} cost={{ totals: [{ currency: "IDR", monthlyMinor: 260893 }], estimated: true }} />);
    expect(screen.getByText("per month (est.)")).toBeTruthy();
    expect(screen.queryByText("per month")).toBeNull();
  });

  it.each([
    ["null cost", null],
    ["empty totals", { totals: [], estimated: true }],
  ])("shows only the name and count for %s", (_label, cost) => {
    const { container } = render(<SectionSummary kind="warranty" count={2} cost={cost} />);
    expect(container.querySelector("ul")).toBeNull();
    expect(container.textContent).not.toContain("per month");
    expect(container.textContent).not.toMatch(/\d\.\d|\$|€|Rp/);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain("Warranties");
  });

  it("has a level 2 heading with the section id and a bare count", () => {
    render(<SectionSummary kind="reminder" count={4} cost={null} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.id).toBe("reminder-heading");
    expect(heading.textContent).toMatch(/4$/);
    expect(heading.textContent).not.toMatch(/items/);
  });

  it("is not interactive", () => {
    const { container } = render(<SectionSummary kind="subscription" count={3} cost={one} />);
    expect(container.querySelector("a, button, [tabindex]")).toBeNull();
  });

  it("never truncates a large figure", () => {
    const cost: SectionCost = { totals: [{ currency: "USD", monthlyMinor: 36_525_000 }], estimated: true };
    const { container } = render(<SectionSummary kind="recurring" count={1} cost={cost} />);
    const figure = container.querySelector("li");
    expect(figure?.textContent).toBe("$365,250.00");
    expect(figure?.className).not.toMatch(/truncate|ellipsis/);
  });
});
