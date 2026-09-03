import { createBrowserRouter } from "react-router"
import { AuthProvider } from "../contexts/AuthContext"
import Layout from "../pages/Layout"
import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"

function RootLayout() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
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
