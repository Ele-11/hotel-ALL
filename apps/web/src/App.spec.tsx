import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { Role } from "@prisma/client";
import App from "./App";

type MockUser = {
  id: number;
  username: string;
  role: Role;
};

const storeState: {
  currentUser: MockUser | null;
  token: string | null;
  status: "idle" | "loading";
} = {
  currentUser: null,
  token: null,
  status: "idle",
};

jest.mock("./stores/auth-store", () => ({
  useAuthStore: () => ({
    currentUser: storeState.currentUser,
    logout: jest.fn(),
    restore: jest.fn(),
    status: storeState.status,
    token: storeState.token,
  }),
}));

jest.mock("./components/auth/AuthForm", () => ({
  AuthForm: () => <div>AuthForm</div>,
}));

jest.mock("./views/merchant/MerchantHotelManager", () => ({
  MerchantHotelManager: () => <div>MerchantHotelManager</div>,
}));

jest.mock("./views/admin/AdminHotelAuditManager", () => ({
  AdminHotelAuditManager: () => <div>AdminHotelAuditManager</div>,
}));

jest.mock("./views/user/UserHotelSearch", () => ({
  UserHotelSearch: () => <div>UserHotelSearch</div>,
}));

jest.mock("./views/user/UserHotelList", () => ({
  UserHotelList: () => <div>UserHotelList</div>,
}));

jest.mock("./views/user/UserHotelDetail", () => ({
  UserHotelDetail: () => <div>UserHotelDetail</div>,
}));

describe("web portal shell", () => {
  beforeEach(() => {
    storeState.currentUser = null;
    storeState.token = null;
    storeState.status = "idle";
  });

  test("guest portal does not mix hotel browsing into the PC login shell", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("AuthForm");
    expect(html).not.toContain("UserHotelSearch");
    expect(html).not.toContain("UserHotelList");
    expect(html).not.toContain("UserHotelDetail");
  });

  test("workspace exposes an independent mobile application entry", () => {
    const repoRoot = join(__dirname, "..", "..", "..");
    const rootPackageJson = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(existsSync(join(repoRoot, "apps", "mobile", "package.json"))).toBe(
      true,
    );
    expect(rootPackageJson.scripts?.["dev:mobile"]).toBeDefined();
  });

  test("merchant portal renders only the merchant management shell", () => {
    storeState.currentUser = {
      id: 1,
      username: "merchant01",
      role: "MERCHANT",
    };

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("MerchantHotelManager");
    expect(html).not.toContain("AdminHotelAuditManager");
    expect(html).not.toContain("AuthForm");
  });

  test("admin portal renders only the admin audit shell", () => {
    storeState.currentUser = {
      id: 2,
      username: "admin01",
      role: "ADMIN",
    };

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("AdminHotelAuditManager");
    expect(html).not.toContain("MerchantHotelManager");
    expect(html).not.toContain("AuthForm");
  });

  test("user portal redirects user-facing access to the mobile app entry", () => {
    storeState.currentUser = {
      id: 3,
      username: "user01",
      role: "USER",
    };

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("http://localhost:5174");
    expect(html).toContain("\u524d\u5f80\u79fb\u52a8\u7aef");
    expect(html).not.toContain("MerchantHotelManager");
    expect(html).not.toContain("AdminHotelAuditManager");
  });
});
