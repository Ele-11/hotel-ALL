import { BrowserRouter } from "react-router-dom";
import { MobileAppView } from "./views/MobileAppView";

export default function App() {
  return (
    <BrowserRouter>
      <MobileAppView />
    </BrowserRouter>
  );
}
