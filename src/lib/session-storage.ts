/**
 * Session storage utility - DEPRECATED
 *
 * This module previously handled localStorage persistence.
 * Session data is now persisted to Supabase (Storage + Database).
 *
 * This file is kept for backwards compatibility during migration.
 * The types are still used by the share-session edge function.
 */

import { DesignSelection } from "@/types/design-state";
import { FormData } from "@/types/calculator";
import { BottomTab, ControlMode, Tier } from "@/contexts/DesignContext";
import type { AuditResponse, AuditVariables } from "@/types/layout-audit";

const STORAGE_KEY = "design_dialogues_session";

export interface SessionData {
  // Design selections
  design: DesignSelection;
  generatedImages: Record<string, string | null>;

  // Budget inputs
  formData: FormData | null;
  selectedTier: Tier;

  // UI state
  activeTab: BottomTab;
  activeMode: ControlMode;

  // Plan state
  userMoveInDate: string | null;
  completedTasks: string[];

  // Layout audit state
  layoutAuditResponses?: Record<string, AuditResponse>;
  layoutAuditVariables?: AuditVariables;

  // Metadata
  savedAt: number;
}

/**
 * @deprecated Use Supabase storage instead
 */
export function saveSession(_data: Omit<SessionData, "savedAt">): boolean {
  console.warn("saveSession is deprecated - data is now persisted to Supabase");
  return false;
}

/**
 * @deprecated Use Supabase storage instead
 */
export function loadSession(): SessionData | null {
  console.warn("loadSession is deprecated - data is now loaded from Supabase");
  return null;
}

/**
 * Clear any legacy session data from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * @deprecated Use Supabase storage instead
 */
export function hasSession(): boolean {
  return false;
}
