import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { MobileAppView } from "./views/MobileAppView";

jest.mock("./stores/auth-store", () => ({
  useMobileAuthStore: () => ({
    authError: null,
    authMode: "login",
    currentUser: null,
    isAuthOpen: false,
    isAuthSubmitting: false,
    isRestoring: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    setAuthMode: jest.fn(),
    setIsAuthOpen: jest.fn(),
  }),
}));

jest.mock("./components/auth/MobileUserAuth", () => ({
  MobileUserAuth: () => <div>MobileUserAuth</div>,
}));

jest.mock("./views/hotels/MobileHotelSearch", () => ({
  MobileHotelSearch: ({ initialValue }: { initialValue: { city: string } }) => (
    <div>MobileHotelSearch city={initialValue.city}</div>
  ),
}));

jest.mock("./views/hotels/MobileHotelList", () => ({
  MobileHotelList: ({
    searchParams,
  }: {
    searchParams: { city: string; keyword: string };
  }) => (
    <div>
      MobileHotelList city={searchParams.city} keyword={searchParams.keyword}
    </div>
  ),
}));

jest.mock("./views/hotels/MobileHotelDetail", () => ({
  MobileHotelDetail: ({
    hotelId,
    searchParams,
  }: {
    hotelId: number;
    searchParams: {
      checkInDate: string;
      checkOutDate: string;
      city: string;
      keyword: string;
    };
  }) => (
    <div>
      {`MobileHotelDetail hotelId=${hotelId} city=${searchParams.city} keyword=${searchParams.keyword} checkInDate=${searchParams.checkInDate} checkOutDate=${searchParams.checkOutDate}`}
    </div>
  ),
}));

describe("mobile app routing", () => {
  let unexpectedConsoleErrors: unknown[][] = [];

  beforeEach(() => {
    unexpectedConsoleErrors = [];
    jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      const firstArg = String(args[0] ?? "");

      if (
        firstArg.includes("useLayoutEffect does nothing on the server") &&
        firstArg.includes("server renderer")
      ) {
        return;
      }

      unexpectedConsoleErrors.push(args);
    });
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    expect(unexpectedConsoleErrors).toEqual([]);
  });

  function renderAt(path: string) {
    const router = createMemoryRouter(
      [
        {
          path: "*",
          element: <MobileAppView />,
        },
      ],
      { initialEntries: [path] },
    );

    return renderToStaticMarkup(<RouterProvider router={router} />);
  }

  test("restores the hotel detail page from the current path and query params", () => {
    const html = renderAt(
      "/hotels/42?city=Hangzhou&keyword=Lake&checkInDate=2026-06-01&checkOutDate=2026-06-03",
    );

    expect(html).toContain("MobileHotelDetail");
    expect(html).toContain("hotelId=42");
    expect(html).toContain("city=Hangzhou");
    expect(html).toContain("keyword=Lake");
    expect(html).toContain("checkInDate=2026-06-01");
    expect(html).toContain("checkOutDate=2026-06-03");
    expect(html).not.toContain("MobileHotelSearch");
  });

  test("restores the hotel list page from the current path and query params", () => {
    const html = renderAt("/hotels?city=Shanghai&keyword=Business");

    expect(html).toContain("MobileHotelList");
    expect(html).toContain("city=Shanghai");
    expect(html).toContain("keyword=Business");
    expect(html).not.toContain("MobileHotelSearch");
  });
});
