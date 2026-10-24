import { describe, expect, it } from "vitest";
import { originFromHeaders } from "./request-origin";

describe("originFromHeaders", () => {
  it("uses http for localhost and https elsewhere", () => {
    expect(originFromHeaders({ host: "localhost:3000" })).toBe("http://localhost:3000");
    expect(originFromHeaders({ host: "127.0.0.1:3000" })).toBe("http://127.0.0.1:3000");
    expect(originFromHeaders({ host: "renewly.vercel.app" })).toBe("https://renewly.vercel.app");
  });

  it("prefers the forwarded host and protocol set by the proxy", () => {
    expect(
      originFromHeaders({ host: "internal:3000", forwardedHost: "app.example.com", forwardedProto: "https" }),
    ).toBe("https://app.example.com");
    expect(originFromHeaders({ host: "localhost:3000", forwardedProto: "http" })).toBe("http://localhost:3000");
  });

  it("takes the first value of a comma-separated list and lowercases", () => {
    expect(originFromHeaders({ forwardedHost: "App.Example.com, other.example" })).toBe("https://app.example.com");
  });

  it("rejects hosts that could break out of a URL", () => {
    for (const host of ["evil.com/path", "evil.com@good.com", "a b.com", "evil.com#x", "", "javascript:alert(1)", "-bad.com", "host:99999999"]) {
      expect(originFromHeaders({ host })).toBeNull();
    }
    expect(originFromHeaders({})).toBeNull();
  });

  it("ignores an unknown forwarded protocol", () => {
    expect(originFromHeaders({ host: "example.com", forwardedProto: "ftp" })).toBe("https://example.com");
  });
});
