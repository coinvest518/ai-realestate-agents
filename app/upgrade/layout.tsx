import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get("sb-access-token")?.value
  if (!token) redirect("/auth/login")

  return <>{children}</>
}
