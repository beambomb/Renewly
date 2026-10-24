// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

vi.mock("../actions", () => ({ signIn: vi.fn() }));

import { SignInForm } from "./sign-in-form";

describe("SignInForm", () => {
  it("renders labelled email and password fields with the right autofill hints", () => {
    render(<SignInForm next="/" linkError={false} />);
    const email = screen.getByLabelText(strings.auth.emailLabel);
    const password = screen.getByLabelText(strings.auth.passwordLabel);

    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("inputmode", "email");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).not.toHaveAttribute("value");
    expect(screen.getByRole("button", { name: strings.auth.submit })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("toggles password visibility and flips the button label", () => {
    render(<SignInForm next="/" linkError={false} />);
    const password = screen.getByLabelText(strings.auth.passwordLabel);

    fireEvent.click(screen.getByRole("button", { name: strings.auth.showPassword }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: strings.auth.hidePassword }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("announces an expired link as an alert", () => {
    render(<SignInForm next="/" linkError />);
    expect(screen.getByRole("alert")).toHaveTextContent(strings.auth.linkFailed);
  });
});
