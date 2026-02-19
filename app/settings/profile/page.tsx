"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ProfileSettings() {
  const { user, session, loading, updateProfile, updatePassword } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setDisplayName((user.user_metadata as any)?.name || "")
  }, [user])

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6">Sign in to manage your profile.</div>

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ name: displayName })
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword) return toast.error('Enter a new password')
    setSaving(true)
    try {
      await updatePassword(newPassword)
      toast.success('Password updated')
      setNewPassword("")
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <div className="mt-1 text-sm">{user.email}</div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Display name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleChangePassword} disabled={saving}>{saving ? 'Updating…' : 'Update password'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
