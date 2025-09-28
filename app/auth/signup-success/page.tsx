import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-display bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to Ultra Finance!
            </CardTitle>
            <CardDescription className="text-lg">Account created successfully</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Your account has been created successfully! Please check your email to verify your account before
                signing in.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You'll receive 2 free spins on our Spin Wheel once you verify your email!
              </p>
            </div>

            <Button asChild className="w-full h-12">
              <Link href="/auth/login">Continue to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
