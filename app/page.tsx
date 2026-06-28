import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

/**
 * Root route. Signed-in users go straight to the dashboard; everyone else is
 * sent to sign-in. (The deployed root page was a thin redirect shell.)
 */
export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')
  redirect('/sign-in')
}
