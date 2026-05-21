import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";

jest.mock("./store/auth-store", () => ({
  useAuthStore: () => ({
    currentUser: null,
    logout: jest.fn(),
    restore: jest.fn(),
    status: "idle",
    token: null,
  }),
}));

jest.mock("./components/AuthForm", () => ({
  AuthForm: () => <div>AuthForm</div>,
}));

jest.mock("./components/MerchantHotelManager", () => ({
  MerchantHotelManager: () => <div>MerchantHotelManager</div>,
}));

jest.mock("./components/AdminHotelAuditManager", () => ({
  AdminHotelAuditManager: () => <div>AdminHotelAuditManager</div>,
}));

jest.mock("./components/UserHotelSearch", () => ({
  UserHotelSearch: () => <div>UserHotelSearch</div>,
}));

jest.mock("./components/UserHotelList", () => ({
  UserHotelList: () => <div>UserHotelList</div>,
}));

jest.mock("./components/UserHotelDetail", () => ({
  UserHotelDetail: () => <div>UserHotelDetail</div>,
}));

describe("web portal shell", () => {
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
});
