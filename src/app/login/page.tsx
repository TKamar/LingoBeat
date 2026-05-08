import { signIn } from '@/auth'

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-6 bg-background text-foreground">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">LingoBeat</h1>
        <p className="text-slate-400">Sign in to save words and track your progress.</p>
      </div>
      <form
        action={async () => {
          'use server'
          await signIn('google')
        }}
      >
        <button
          type="submit"
          className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
        >
          Sign in with Google
        </button>
      </form>
    </main>
  )
}
