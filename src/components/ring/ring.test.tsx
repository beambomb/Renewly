// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { computeRing, type RingInput } from "@/lib/rings/ring";
import { Ring, RingCard } from "./ring";

const input: RingInput = {
  kind: "subscription",
  status: "active",
  name: "Netflix",
  periodStart: "2026-10-01",
  dueDate: "2026-10-31",
};

const vmOn = (today: string, overrides: Partial<RingInput> = {}) =>
  computeRing({ ...input, ...overrides }, today);

const states = [
  { state: "comfortable", today: "2026-10-10", text: "21 days left" },
  { state: "soon", today: "2026-10-24", text: "7 days left" },
  { state: "urgent", today: "2026-10-29", text: "2 days left" },
  { state: "overdue", today: "2026-11-03", text: "Overdue by 3 days" },
] as const;

describe("Ring states", () => {
  it.each(states)("renders the $state state with text and an accessible label", ({ state, today, text }) => {
    const vm = vmOn(today);
    render(<RingCard name="Netflix" vm={vm} status="active" />);

    // Visible text, so colour is never the only signal.
    expect(screen.getByText(text)).toBeInTheDocument();
    // The SVG carries an aria-label with the name, time left and state.
    const svg = screen.getByRole("img", { name: new RegExp(`Netflix, ${text}`) });
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute("aria-label")).toContain("status:");
    // State is exposed for styling and tests.
    expect(document.querySelector(`[data-state="${state}"]`)).not.toBeNull();
  });

  it("renders paused items as inactive with no urgency wording", () => {
    const vm = vmOn("2026-11-20", { status: "paused" });
    render(<RingCard name="Netflix" vm={vm} status="paused" />);
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Netflix, Paused" })).toBeInTheDocument();
    expect(screen.queryByText(/Overdue/)).toBeNull();
  });

  it("renders cancelled items", () => {
    render(<RingCard name="Gym" vm={vmOn("2026-10-10", { status: "cancelled", name: "Gym" })} status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("uses warranty wording once expired", () => {
    const vm = vmOn("2026-11-03", { kind: "warranty", name: "Laptop" });
    render(<RingCard name="Laptop" vm={vm} status="active" />);
    expect(screen.getByText("Expired 3 days ago")).toBeInTheDocument();
  });
});

describe("Ring graphic", () => {
  it("fills the ring in proportion to the time left", () => {
    render(<Ring name="Netflix" vm={vmOn("2026-10-16")} />); // 15 of 30 days
    const progress = screen.getByTestId("ring-progress");
    const circumference = Number(progress.getAttribute("stroke-dasharray"));
    const offset = Number(progress.getAttribute("stroke-dashoffset"));
    expect(offset / circumference).toBeCloseTo(0.5, 5);
  });

  it("draws a full dashed ring instead of a progress arc when overdue", () => {
    render(<Ring name="Netflix" vm={vmOn("2026-11-03")} />);
    expect(screen.queryByTestId("ring-progress")).toBeNull();
    expect(screen.getByTestId("ring-overdue").getAttribute("stroke-dasharray")).toBe("8 6");
  });

  it("draws no progress arc on the due day", () => {
    render(<Ring name="Netflix" vm={vmOn("2026-10-31")} />);
    expect(screen.queryByTestId("ring-progress")).toBeNull();
  });

  it("uses a larger geometry for the detail size", () => {
    const { container } = render(<Ring name="Netflix" vm={vmOn("2026-10-10")} size="lg" />);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("160");
  });
});

describe("Ring logo", () => {
  it("shows initials when there is no logo", () => {
    render(<Ring name="Amazon Prime" vm={vmOn("2026-10-10", { name: "Amazon Prime" })} />);
    expect(screen.getByText("AP")).toBeInTheDocument();
  });

  it("shows the chosen emoji", () => {
    render(<Ring name="Coffee" vm={vmOn("2026-10-10", { name: "Coffee" })} logo={{ emoji: "☕" }} />);
    expect(screen.getByText("☕")).toBeInTheDocument();
    expect(screen.queryByText("CO")).toBeNull();
  });

  it("shows the uploaded image with reserved space and no duplicate alt text", () => {
    const { container } = render(
      <Ring name="Netflix" vm={vmOn("2026-10-10")} logo={{ src: "https://example.test/logo.webp", emoji: "N" }} />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("width")).toBe("56");
    expect(img?.getAttribute("height")).toBe("56");
    expect(screen.queryByText("N")).toBeNull();
  });
});
