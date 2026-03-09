"use client";

import Link from "next/link";
import { Card, CardContent, cn } from "@mysuperapp/ui";

interface MiniAppInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePath: string;
  enabled: boolean;
}

interface AppLauncherProps {
  apps: MiniAppInfo[];
}

export function AppLauncher({ apps }: AppLauncherProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {apps.map((app) => (
        <AppTile key={app.id} app={app} />
      ))}
    </div>
  );
}

function AppTile({ app }: { app: MiniAppInfo }) {
  const content = (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
        !app.enabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
          {app.icon}
        </span>
        <h3 className="font-medium text-sm">{app.name}</h3>
        {!app.enabled && (
          <span className="text-xs text-muted-foreground mt-1">Coming soon</span>
        )}
      </CardContent>
    </Card>
  );

  if (app.enabled) {
    return <Link href={app.basePath}>{content}</Link>;
  }

  return <div>{content}</div>;
}
