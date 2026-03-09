import type { ComponentType } from "react";

/**
 * Permissions that a mini app can request
 */
export type Permission =
  | "notifications" // Browser push notifications
  | "storage" // Access to local/session storage
  | "network" // External API calls
  | "calendar" // Calendar integration
  | "email"; // Email integration

/**
 * A route definition within a mini app
 */
export interface MiniAppRoute {
  /** Route path relative to the mini app's basePath */
  path: string;
  /** React component to render */
  component: ComponentType;
  /** Page title for browser tab */
  title: string;
  /** Whether to show this route in the mini app's navigation */
  showInNav?: boolean;
  /** Icon for navigation (emoji or icon name) */
  icon?: string;
}

/**
 * Settings field definition for mini app configuration
 */
export interface SettingsField {
  key: string;
  type: "string" | "number" | "boolean" | "select";
  label: string;
  description?: string;
  defaultValue?: unknown;
  options?: { label: string; value: string | number }[];
  required?: boolean;
}

/**
 * Widget component for home screen display
 */
export interface MiniAppWidget {
  /** Widget component */
  component: ComponentType;
  /** Widget size: small (1x1), medium (2x1), large (2x2) */
  size: "small" | "medium" | "large";
  /** Refresh interval in seconds (0 = no auto-refresh) */
  refreshInterval?: number;
}

/**
 * The main mini app interface that all mini apps must implement
 */
export interface MiniApp {
  // ========== Identity ==========
  /** Unique identifier (e.g., "stocks", "budget") */
  id: string;
  /** Display name (e.g., "Stock Watchlist") */
  name: string;
  /** Short description */
  description: string;
  /** Icon (emoji or icon name from lucide-react) */
  icon: string;
  /** Semantic version */
  version: string;
  /** Author name */
  author?: string;

  // ========== Routes ==========
  /** URL base path (e.g., "/stocks") - derived from id if not provided */
  basePath?: string;
  /** Route definitions within the mini app */
  routes: MiniAppRoute[];

  // ========== Optional Features ==========
  /** Widget for home screen */
  widget?: MiniAppWidget;
  /** Required permissions */
  permissions?: Permission[];
  /** User-configurable settings */
  settings?: SettingsField[];

  // ========== Lifecycle Hooks ==========
  /** Called when mini app is first installed */
  onInstall?(): Promise<void>;
  /** Called when mini app is uninstalled */
  onUninstall?(): Promise<void>;
  /** Called when mini app becomes active (navigated to) */
  onActivate?(): Promise<void>;
  /** Called when mini app becomes inactive (navigated away) */
  onDeactivate?(): Promise<void>;
}

/**
 * Registered mini app with computed properties
 */
export interface RegisteredMiniApp extends MiniApp {
  /** Computed base path (defaults to /${id}) */
  basePath: string;
  /** Whether the mini app is currently enabled */
  enabled: boolean;
  /** Installation timestamp */
  installedAt: Date;
}
