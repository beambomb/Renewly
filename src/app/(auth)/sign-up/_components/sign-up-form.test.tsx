// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }));
vi.mock("../actions", () => ({ signUp }));

import { SignUpForm } from "./sign-up-form";

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("SignUpForm", () => {
  it("renders labelled fields with the right autofill hints and one password hint", () => {
    render(<SignUpForm next="/" />);
    const email = screen.getByLabelText(strings.auth.emailLabel);
    const password = screen.getByLabelText(strings.auth.passwordLabel);
    const confirm = screen.getByLabelText(strings.auth.confirmPasswordLabel);

    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("inputmode", "email");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(confirm).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAccessibleDescription(strings.auth.passwordHint);
    expect(screen.getByRole("button", { name: strings.auth.signUpSubmit })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("toggles both password fields together", () => {
    render(<SignUpForm next="/" />);
    fireEvent.click(screen.getByRole("button", { name: strings.auth.showPassword }));
    expect(screen.getByLabelText(strings.auth.passwordLabel)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(strings.auth.confirmPasswordLabel)).toHaveAttribute("type", "text");
  });

  it("blocks a mismatch on the client and announces it on the confirm field", () => {
    render(<SignUpForm next="/" />);
    fill(strings.auth.emailLabel, "a@example.com");
    fill(strings.auth.passwordLabel, "long-enough-pw");
    fill(strings.auth.confirmPasswordLabel, "something-else");
    fireEvent.click(screen.getByRole("button", { name: strings.auth.signUpSubmit }));

    expect(screen.getByRole("alert")).toHaveTextContent(strings.auth.passwordMismatch);
    expect(screen.getByLabelText(strings.auth.confirmPasswordLabel)).toHaveAttribute("aria-invalid", "true");
    expect(signUp).not.toHaveBeenCalled();
  });
});
