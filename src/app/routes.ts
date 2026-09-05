import { createBrowserRouter } from "react-router"
import Layout from "../pages/Layout"
import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
    ],
  },
])
