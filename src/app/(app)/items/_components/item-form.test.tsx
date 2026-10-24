// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ITEM_KINDS } from "@/lib/items/types";
import type { FormValues } from "@/lib/schemas/item";
import { strings } from "@/lib/strings";
import type { ItemFormState } from "../actions";
import { ItemForm } from "./item-form";

const currencies = [
  { value: "IDR", label: "IDR" },
  { value: "USD", label: "USD" },
];
const create: FormValues = { useDefaultOffsets: "on", autoRenew: "on", offsets: [], currency: "IDR", usualCurrency: "IDR" };
const noop = async (): Promise<ItemFormState> => ({ status: "idle" });

function renderForm(
  kind: (typeof ITEM_KINDS)[number],
  options: { mode?: "create" | "edit"; initial?: FormValues; action?: (p: ItemFormState, f: FormData) => Promise<ItemFormState> } = {},
) {
  return render(
    <ItemForm
      kind={kind}
      mode={options.mode ?? "create"}
      action={options.action ?? noop}
      initial={options.initial ?? create}
      currencies={currencies}
      cancelHref="/"
    />,
  );
}

const details = () => document.querySelector("details") as HTMLDetailsElement;

describe("ItemForm layout", () => {
  it.each(ITEM_KINDS)("%s: one collapsed disclosure, no optional tags, no section headings", (kind) => {
    const { container } = renderForm(kind);
    expect(container.querySelectorAll("details")).toHaveLength(1);
    expect(details().open).toBe(false);
    expect(container.textContent).not.toContain("(optional)");
    expect(container.querySelector("h2")).toBeNull();
    expect(screen.getByText(strings.item.sections.more)).toBeInTheDocument();
  });

  it("keeps optional subscription fields in the form while collapsed and shows the examples as placeholders", () => {
    renderForm("subscription");
    const payment = screen.getByLabelText(strings.item.fields.paymentMethod);
    expect(details()).toContainElement(payment);
    expect(payment).toHaveAttribute("placeholder", strings.item.placeholders.paymentMethod);
    expect(screen.getByText(strings.item.fields.paymentMethodHint)).toBeInTheDocument();
    expect(screen.getByLabelText(strings.item.fields.cancelUrl)).toHaveAttribute("placeholder", "https://");
    expect(screen.getByLabelText(strings.item.fields.category)).toHaveAttribute("placeholder", "Entertainment");
    expect(screen.getByLabelText(strings.item.fields.autoRenew)).toBeChecked();
  });

  it("submits the same field names and values as before", async () => {
    const seen: FormData[] = [];
    const action = vi.fn(async (_previous: ItemFormState, formData: FormData): Promise<ItemFormState> => {
      seen.push(formData);
      return { status: "idle" };
    });
    const { container } = renderForm("subscription", { action, initial: { ...create, price: "10", currency: "USD" } });
    await act(async () => {
      fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    });
    const data = seen[0] as FormData;
    expect(Object.fromEntries(data.entries())).toMatchObject({
      name: "",
      price: "10",
      currency: "USD",
      billingCycle: "monthly",
      nextBillingDate: "",
      paymentMethod: "",
      cancelUrl: "",
      autoRenew: "on",
      emoji: "",
      category: "",
      notes: "",
      useDefaultOffsets: "on",
    });
  });
});

describe("ItemForm disclosure on edit", () => {
  it.each([
    ["subscription", { paymentMethod: "Visa 4242" }],
    ["subscription", { notes: "Family plan" }],
    ["savings", { deadline: "2027-06-30" }],
    ["recurring", { usualStore: "Market" }],
    ["warranty", { serialNumber: "SN-1" }],
    ["reminder", { category: "Personal" }],
    ["reminder", { useDefaultOffsets: "", offsets: ["7"] }],
  ] as const)("%s opens when it already has %j", (kind, extra) => {
    renderForm(kind, { mode: "edit", initial: { ...create, ...extra } as FormValues });
    expect(details().open).toBe(true);
  });

  it("stays closed when only currency and auto-renew are set", () => {
    renderForm("subscription", { mode: "edit", initial: { ...create, autoRenew: "on", currency: "USD" } });
    expect(details().open).toBe(false);
  });
});

describe("ItemForm errors", () => {
  it("opens the disclosure and flags the field when a hidden field fails", async () => {
    const action = async (): Promise<ItemFormState> => ({
      status: "error",
      errors: [{ field: "cancelUrl", message: "Use an https link." }],
      values: create,
    });
    const { container } = renderForm("subscription", { action });
    expect(details().open).toBe(false);
    await act(async () => {
      fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    });
    const input = screen.getByLabelText(strings.item.fields.cancelUrl);
    expect(details().open).toBe(true);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "cancelUrl-error");
    expect(screen.getByText("Use an https link.")).toBeInTheDocument();
  });
});
