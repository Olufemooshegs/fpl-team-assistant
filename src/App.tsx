import { RouterProvider } from "react-router"
import { Analytics } from "@vercel/analytics/react"
import { router } from "./app/routes"
import { AuthProvider } from "./contexts/AuthContext"

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Analytics />
    </AuthProvider>
  )
}
