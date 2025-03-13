import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import store from "./app/store.tsx";
import Page from "./Login-Page.tsx";
import DashboardPage from "./dashboard/page.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Page />
    </Provider>
  </StrictMode>
);
