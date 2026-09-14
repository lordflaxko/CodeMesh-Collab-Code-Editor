import { useState, type FormEvent } from 'react'

interface AccountPanelProps {
  username: string | null
  guestName: string
  guestFormOpen: boolean
  onGuestFormOpenChange: (open: boolean) => void
  onGuestNameChange: (name: string) => void
  onLoginClick: () => void
  onLogout: () => void
}

function AccountPanel({
  username,
  guestName,
  guestFormOpen,
  onGuestFormOpenChange,
  onGuestNameChange,
  onLoginClick,
  onLogout,
}: AccountPanelProps) {
  const [guestNameInput, setGuestNameInput] = useState(guestName)

  if (username) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Signed in as {username}
        </span>
        <button type="button" className="rounded-md border border-border bg-card/70 px-2.5 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-primary" onClick={onLogout}>
          Log out
        </button>
      </div>
    )
  }

  function openGuestForm() {
    setGuestNameInput(guestName)
    onGuestFormOpenChange(true)
  }

  function handleGuestLogout() {
    onGuestNameChange('')
  }

  function submitGuestForm(e: FormEvent) {
    e.preventDefault()
    onGuestNameChange(guestNameInput.trim())
    onGuestFormOpenChange(false)
  }

  function goToLoginInstead() {
    onGuestFormOpenChange(false)
    onLoginClick()
  }

  if (!guestFormOpen) {
    return (
      <>
        {guestName.trim() ? (
          <div className="flex items-center gap-2">
            <button type="button" className="text-muted-foreground transition-colors hover:text-primary" onClick={openGuestForm}>
              Guest: {guestName.trim()}
            </button>
            <button type="button" className="rounded-md border border-border bg-card/70 px-2.5 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-primary" onClick={handleGuestLogout}>
              Log out
            </button>
          </div>
        ) : (
          <button type="button" className="rounded-md border border-border bg-card/70 px-2.5 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-primary" onClick={openGuestForm}>
            Continue as guest
          </button>
        )}
        <button type="button" className="rounded-pill bg-gradient-primary px-4 py-1.5 text-sm font-medium text-[hsl(var(--on-brand))] shadow-glow transition-all hover:brightness-110" onClick={onLoginClick}>
          Log in
        </button>
      </>
    )
  }

  return (
    <div className="relative">
      <form
      className="absolute right-0 top-full z-50 mt-2 w-[260px] space-y-3 rounded-lg border border-border bg-card/95 p-4 shadow-elegant backdrop-blur-md"
      onSubmit={submitGuestForm}
    >
        <h3 className="text-sm font-semibold">Continue as a guest</h3>
        <input
          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          value={guestNameInput}
          onChange={(e) => setGuestNameInput(e.target.value)}
          placeholder="Your name"
          aria-label="Guest name"
          autoFocus
        />
        <button
          type="submit"
          className="w-full rounded-md bg-gradient-primary py-2 text-sm font-medium text-[hsl(var(--on-brand))] transition-all hover:brightness-110"
        >
          Continue as guest
        </button>
        <div className="flex items-center justify-between text-xs">
          <button type="button" className="text-muted-foreground transition-colors hover:text-primary" onClick={goToLoginInstead}>
            Log in instead
          </button>
          <button type="button" className="text-muted-foreground transition-colors hover:text-primary" onClick={() => onGuestFormOpenChange(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AccountPanel
