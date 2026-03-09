import type { MiniApp, RegisteredMiniApp } from "./types";

/**
 * Registry for managing mini apps
 */
class MiniAppRegistry {
  private apps: Map<string, RegisteredMiniApp> = new Map();

  /**
   * Register a new mini app
   */
  register(app: MiniApp): RegisteredMiniApp {
    if (this.apps.has(app.id)) {
      console.warn(`Mini app "${app.id}" is already registered. Skipping.`);
      return this.apps.get(app.id)!;
    }

    const registeredApp: RegisteredMiniApp = {
      ...app,
      basePath: app.basePath || `/${app.id}`,
      enabled: true,
      installedAt: new Date(),
    };

    this.apps.set(app.id, registeredApp);
    console.log(`Mini app "${app.name}" registered at ${registeredApp.basePath}`);

    return registeredApp;
  }

  /**
   * Unregister a mini app by ID
   */
  unregister(id: string): boolean {
    const app = this.apps.get(id);
    if (app) {
      this.apps.delete(id);
      console.log(`Mini app "${app.name}" unregistered`);
      return true;
    }
    return false;
  }

  /**
   * Get a mini app by ID
   */
  get(id: string): RegisteredMiniApp | undefined {
    return this.apps.get(id);
  }

  /**
   * Get a mini app by its base path
   */
  getByPath(path: string): RegisteredMiniApp | undefined {
    for (const app of this.apps.values()) {
      if (path.startsWith(app.basePath)) {
        return app;
      }
    }
    return undefined;
  }

  /**
   * Get all registered mini apps
   */
  getAll(): RegisteredMiniApp[] {
    return Array.from(this.apps.values());
  }

  /**
   * Get all enabled mini apps
   */
  getEnabled(): RegisteredMiniApp[] {
    return this.getAll().filter((app) => app.enabled);
  }

  /**
   * Enable or disable a mini app
   */
  setEnabled(id: string, enabled: boolean): boolean {
    const app = this.apps.get(id);
    if (app) {
      app.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Clear all registered mini apps
   */
  clear(): void {
    this.apps.clear();
  }
}

// Singleton instance
export const miniAppRegistry = new MiniAppRegistry();

/**
 * Helper function to define a mini app with type checking
 */
export function defineMiniApp(app: MiniApp): MiniApp {
  return app;
}
