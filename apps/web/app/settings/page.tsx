import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@mysuperapp/ui";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h1 className="font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sign in with Google, Microsoft, or Apple to sync your data across devices.
              </p>
              <Button className="mt-4">Sign In</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mini Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage your installed mini apps and their permissions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Customize the look and feel of your super app.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                MySuperApp v0.1.0
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your personal super app with modular mini apps.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
