import { AppLauncher } from "@/components/app-launcher";
import { Header } from "@/components/header";

// Placeholder mini apps - will be replaced with real registry
const miniApps = [
  {
    id: "stocks",
    name: "Stocks",
    description: "Track your stock watchlist",
    icon: "📈",
    basePath: "/stocks",
    enabled: true,
  },
  {
    id: "budget",
    name: "Budget",
    description: "Manage your expenses",
    icon: "💰",
    basePath: "/budget",
    enabled: false,
  },
  {
    id: "assistant",
    name: "Assistant",
    description: "AI-powered personal assistant",
    icon: "🤖",
    basePath: "/assistant",
    enabled: false,
  },
  {
    id: "notes",
    name: "Notes",
    description: "Quick notes and reminders",
    icon: "📝",
    basePath: "/notes",
    enabled: false,
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Your schedule at a glance",
    icon: "📅",
    basePath: "/calendar",
    enabled: false,
  },
  {
    id: "settings",
    name: "Settings",
    description: "App settings and preferences",
    icon: "⚙️",
    basePath: "/settings",
    enabled: true,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">
            What would you like to do today?
          </p>
        </div>
        <AppLauncher apps={miniApps} />
      </main>
    </div>
  );
}
