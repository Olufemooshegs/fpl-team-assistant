import { createElement } from "react"
import { createBrowserRouter } from "react-router"
import { AuthProvider } from "../contexts/AuthContext"
import Layout from "../pages/Layout"
import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"

function RootLayout() {
  return createElement(AuthProvider, null, createElement(Layout))
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
    ],
  },
])
