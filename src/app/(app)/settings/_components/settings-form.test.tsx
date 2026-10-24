// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Profile } from "@/lib/schemas/profile";
import { strings } from "@/lib/strings";

vi.mock("../actions", () => ({ updateSettings: vi.fn() }));

import { SettingsForm } from "./settings-form";

const profile: Profile = {
  timezone: "Asia/Jakarta",
  defaultCurrency: "IDR",
  reminderOffsets: [7, 1],
  emailEnabled: true,
  pushEnabled: false,
};

const timeZones = [
  { value: "Asia/Jakarta", label: "Asia/Jakarta" },
  { value: "UTC", label: "UTC" },
];
const currencies = [
  { value: "IDR", label: "IDR" },
  { value: "USD", label: "USD" },
];

const REMOVED_COPY = [
  "Preferences",
  "Due dates and reminders use your local day.",
  "Used for new subscriptions. Totals are never converted between currencies.",
  "Pick the days before the due date. Each item can override this.",
  "In-app notifications are always on.",
  "Remind me before something is due",
  "Send reminders by email",
];

function renderForm() {
  return render(<SettingsForm profile={profile} timeZones={timeZones} currencies={currencies} />);
}

describe("SettingsForm", () => {
  it("shows only the fields, the reminder group and the save button", () => {
    renderForm();

    expect(screen.getByLabelText(strings.settings.timezoneLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(strings.settings.currencyLabel)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Remind me" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email reminders")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: strings.form.save })).toBeInTheDocument();
  });

  it("has no section headings", () => {
    renderForm();
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });

  it("drops the removed helper copy", () => {
    const { container } = renderForm();
    for (const text of REMOVED_COPY) expect(container).not.toHaveTextContent(text);
  });

  it("leaves the selects without aria-describedby until an error exists", () => {
    renderForm();
    expect(screen.getByLabelText(strings.settings.timezoneLabel)).not.toHaveAttribute("aria-describedby");
    expect(screen.getByLabelText(strings.settings.currencyLabel)).not.toHaveAttribute("aria-describedby");
    expect(screen.getByRole("group", { name: "Remind me" })).not.toHaveAttribute("aria-describedby");
    expect(screen.getByLabelText("Email reminders")).not.toHaveAttribute("aria-describedby");
  });

  it("keeps the offsets fieldset focusable for the error summary", () => {
    renderForm();
    const group = screen.getByRole("group", { name: "Remind me" });
    expect(group).toHaveAttribute("id", "offsets");
    expect(group).toHaveAttribute("tabindex", "-1");
  });

  it("reflects the profile in the checkboxes", () => {
    renderForm();
    expect(screen.getByLabelText(strings.settings.offsetLabel(7))).toBeChecked();
    expect(screen.getByLabelText(strings.settings.offsetLabel(1))).toBeChecked();
    expect(screen.getByLabelText(strings.settings.offsetLabel(3))).not.toBeChecked();
    expect(screen.getByLabelText(strings.settings.offsetLabel(0))).not.toBeChecked();
    expect(screen.getByLabelText("Email reminders")).toBeChecked();
  });
});
