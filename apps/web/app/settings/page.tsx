"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@mysuperapp/ui";
import { getSettings, saveSettings, type AppSettings } from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
              <CardTitle>Stock Watchlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure how often stock data refreshes automatically.
              </p>
              {settings && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="quoteInterval">
                      Quote refresh interval (seconds)
                    </label>
                    <Input
                      id="quoteInterval"
                      type="number"
                      min={5}
                      max={300}
                      value={settings.quoteIntervalSec}
                      onChange={(e) =>
                        setSettings((s) =>
                          s ? { ...s, quoteIntervalSec: Math.max(5, parseInt(e.target.value) || 10) } : s
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      How often stock prices update. Minimum 5 seconds.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="fundamentalsInterval">
                      Fundamentals refresh interval (minutes)
                    </label>
                    <Input
                      id="fundamentalsInterval"
                      type="number"
                      min={1}
                      max={60}
                      value={settings.fundamentalsIntervalMin}
                      onChange={(e) =>
                        setSettings((s) =>
                          s ? { ...s, fundamentalsIntervalMin: Math.max(1, parseInt(e.target.value) || 15) } : s
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      How often P/E, EPS, market cap, and other fundamentals refresh. Minimum 1 minute.
                    </p>
                  </div>

                  <Button onClick={handleSave}>
                    {saved ? "✓ Saved" : "Save"}
                  </Button>
                </>
              )}
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
