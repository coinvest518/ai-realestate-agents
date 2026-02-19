"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Settings } from "lucide-react"
import { toast } from "sonner"

export function UserMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()

    if (!user) {
      return (
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="bg-primary text-primary-foreground">Get Started</Button>
          </Link>
        </div>
      )
    }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
      router.push("/")
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out")
    }
  }

  const initials = user.email?.substring(0, 2).toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block text-sm truncate max-w-[12rem]">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
