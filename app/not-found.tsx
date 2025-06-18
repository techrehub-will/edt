import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'

// Force dynamic rendering to avoid webpack issues during static generation
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Engineering Development Tracker',
  description: 'The page you are looking for does not exist. Return to EDT to continue tracking your engineering development and career progress.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <Card>
            <CardHeader className="pb-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-primary">404</span>
              </div>
              <CardTitle className="text-2xl">Page Not Found</CardTitle>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Link href="/">
                  <Button className="w-full">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Homepage
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Popular pages:
                </p>
                <div className="space-y-1 text-sm">
                  <Link href="/login" className="block text-primary hover:underline">
                    Sign In
                  </Link>
                  <Link href="/register" className="block text-primary hover:underline">
                    Create Account
                  </Link>
                  <Link href="/dashboard/projects" className="block text-primary hover:underline">
                    Project Tracker
                  </Link>
                  <Link href="/dashboard/goals" className="block text-primary hover:underline">
                    Goal Management
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
