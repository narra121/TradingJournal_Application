import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
import { RootState } from '@/app/store'
import { awsLogout } from '@/app/awsAuthSlice'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/ui/dialog'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'
import { cn } from 'lib/utils'
import { API_BASE_URL } from '@/lib/config'
import { Badge } from '@/ui/badge'

type PanelKey = 'profile' | 'changePassword' | 'settings'

const panelLabels: Record<PanelKey,string> = {
  profile: 'Profile',
  changePassword: 'Change Password',
  settings: 'Settings'
}

export function UserNav() {
  const dispatch = useDispatch()
  const auth = useSelector((s:RootState)=> s.AwsAuth)
  const user = auth.user || { email: 'user@example.com', name: 'User' } as any
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<PanelKey>('profile')

  // Form placeholder local state
  const [displayName, setDisplayName] = useState(user.name || '')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifToast, setNotifToast] = useState(true)

  const baseUrl = API_BASE_URL || ''
  const apiStage: 'dev' | 'prod' | 'custom' = /\/dev\//.test(baseUrl) ? 'dev' : /\/prod\//.test(baseUrl) ? 'prod' : 'custom'

  const initials = (user.name || user.email || 'U')
    .split(/\s|\./)
    .filter(Boolean)
    .slice(0,2)
    .map((s:string)=>s[0]?.toUpperCase())
    .join('')

  const renderPanel = () => {
    switch(panel){
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Profile Info</h3>
              <p className="text-sm text-muted-foreground">Update your basic account information.</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Environment:</span>
              <Badge variant={apiStage==='prod' ? 'default':'secondary'} className={cn(apiStage==='dev' && 'bg-amber-500/80 text-black', apiStage==='custom' && 'bg-blue-500/80')}>
                {apiStage.toUpperCase()}
              </Badge>
              <span className="truncate max-w-[260px] font-mono text-xs" title={API_BASE_URL}>{API_BASE_URL}</span>
            </div>
            <div className="grid gap-4 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
              </div>
              <Button size="sm" className="w-fit" variant="default">Save Changes</Button>
            </div>
          </div>
        )
      case 'changePassword':
        return (
          <div className="space-y-6 max-w-md">
            <div>
              <h3 className="text-lg font-semibold">Change Password</h3>
              <p className="text-sm text-muted-foreground">Enter your current and new password.</p>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPass">Current Password</Label>
                <Input id="currentPass" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPass">New Password</Label>
                <Input id="newPass" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPass">Confirm Password</Label>
                <Input id="confirmPass" type="password" />
              </div>
              <Button size="sm" className="w-fit">Update Password</Button>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="space-y-6 max-w-md">
            <div>
              <h3 className="text-lg font-semibold">Settings</h3>
              <p className="text-sm text-muted-foreground">Personalize your experience.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive trade summaries via email.</p>
                </div>
                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
              </div>
              {/* separator removed */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">Toast Alerts</p>
                  <p className="text-xs text-muted-foreground">Show success / error toasts.</p>
                </div>
                <Switch checked={notifToast} onCheckedChange={setNotifToast} />
              </div>
              <Button size="sm" className="mt-2">Save Preferences</Button>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v)=> { setOpen(v); if(!v) setPanel('profile') }}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border hover:ring-primary transition">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl || '/avatars/01.png'} alt={user.name || user.email} />
            <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 max-w-[80vw] w-[80vw] h-[80vh]">
        <div className="flex h-full">
          {/* Left Nav 20% */}
          <div className="w-1/5 min-w-[180px] border-r bg-muted/40 flex flex-col">
            <div className="p-4 pb-2">
              <DialogHeader className="text-left">
                <DialogTitle className="text-base">Account</DialogTitle>
              </DialogHeader>
            </div>
            <nav className="flex-1 overflow-auto px-2 space-y-1">
              {(Object.keys(panelLabels) as PanelKey[]).map(key => (
                <button
                  key={key}
                  onClick={()=> setPanel(key)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    panel===key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >{panelLabels[key]}</button>
              ))}
              {/* separator removed */}
              <button
                onClick={()=> { dispatch(awsLogout()); setOpen(false) }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >Log out</button>
            </nav>
            <div className="p-3 text-[10px] text-muted-foreground">v1.0</div>
          </div>
          {/* Right Content 80% */}
          <div className="flex-1 overflow-auto p-6">{renderPanel()}</div>
        </div>
        <DialogClose asChild>
          <Button size="sm" variant="ghost" className="absolute top-2 right-2">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
