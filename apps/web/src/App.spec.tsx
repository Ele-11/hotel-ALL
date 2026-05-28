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

jest.mock("./config/app", () => ({
  API_BASE_URL: "http://localhost:3000",
  MOBILE_APP_URL: "http://localhost:5174",
  TOKEN_STORAGE_KEY: "hotel_auth_token",
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
    expect(html).toContain("\u5546\u6237\u4e0e\u7ba1\u7406\u5458\u540e\u53f0");
    expect(html).not.toContain("\u6253\u5f00\u79fb\u52a8\u7aef\uff1a");
    expect(html).not.toContain("\u8fdb\u5165\u7528\u6237\u7aef");
    expect(html).not.toContain("\u5355\u72ec\u8fd0\u884c");
    expect(html).not.toContain("\u8bf7\u9009\u62e9\u540e\u53f0\u8eab\u4efd");
    expect(html).not.toContain("\u4f7f\u7528\u8bf4\u660e");
    expect(html).not.toContain("\u7528\u6237\u9884\u8ba2");
    expect(html).not.toContain("\u89d2\u8272\u8fb9\u754c");
    expect(html).not.toContain("\u7cfb\u7edf\u9884\u7f6e");
    expect(html).not.toContain("EASYSTAY PORTAL");
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

  test("user portal shows a backend permission error only", () => {
    storeState.currentUser = {
      id: 3,
      username: "user01",
      role: "USER",
    };

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("\u5f53\u524d\u8d26\u53f7\u65e0\u540e\u53f0\u8bbf\u95ee\u6743\u9650");
    expect(html).toContain("\u5207\u6362\u8d26\u53f7");
    expect(html).not.toContain("http://localhost:5174");
    expect(html).not.toContain("\u8fdb\u5165\u7528\u6237\u7aef");
    expect(html).not.toContain("\u6253\u5f00\u79fb\u52a8\u7aef\uff1a");
    expect(html).not.toContain("\u5355\u72ec\u8fd0\u884c");
    expect(html).not.toContain("\u62c6\u5206");
    expect(html).not.toContain("\u4f7f\u7528\u8bf4\u660e");
    expect(html).not.toContain("Milestone");
    expect(html).not.toContain("MerchantHotelManager");
    expect(html).not.toContain("AdminHotelAuditManager");
  });
});
