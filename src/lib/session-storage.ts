/**
 * Session persistence utility for localStorage
 * Saves and restores design state across page navigation and refresh
 */

import { DesignSelection } from "@/types/design-state";
import { FormData } from "@/types/calculator";
import { BottomTab, ControlMode, Tier } from "@/contexts/DesignContext";
import type { AuditResponse, AuditVariables } from "@/types/layout-audit";

const STORAGE_KEY = "design_dialogues_session";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SessionData {
  // Design selections
  design: DesignSelection;
  generatedImage: string | null;

  // Budget inputs
  formData: FormData | null;
  selectedTier: Tier;

  // UI state
  activeTab: BottomTab;
  activeMode: ControlMode;

  // Plan state
  userMoveInDate: string | null; // ISO string for Date serialization
  completedTasks: string[]; // Array of completed task IDs

  // Layout audit state
  layoutAuditResponses?: Record<string, AuditResponse>;
  layoutAuditVariables?: AuditVariables;

  // Metadata
  savedAt: number;
}

/**
 * Save session data to localStorage
 * Handles quota exceeded errors gracefully
 */
export function saveSession(data: Omit<SessionData, "savedAt">): boolean {
  try {
    const sessionData: SessionData = {
      ...data,
      savedAt: Date.now(),
    };

    const serialized = JSON.stringify(sessionData);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    // Handle quota exceeded - try saving without images
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, saving session without images");
      try {
        const minimalData: SessionData = {
          ...data,
          design: {
            ...data.design,
            uploadedImages: {}, // Clear uploaded images to save space
          },
          generatedImage: null, // Clear generated image
          savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalData));
        return true;
      } catch {
        console.error("Failed to save even minimal session data");
        return false;
      }
    }
    console.error("Failed to save session:", error);
    return false;
  }
}

/**
 * Load session data from localStorage
 * Returns null if no valid session exists or if session is expired
 */
export function loadSession(): SessionData | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;

    const data: SessionData = JSON.parse(serialized);

    // Check if session has expired
    if (Date.now() - data.savedAt > SESSION_EXPIRY_MS) {
      clearSession();
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to load session:", error);
    clearSession();
    return null;
  }
}

/**
 * Clear session data from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
}

/**
 * Check if a session exists (without parsing it)
 */
export function hasSession(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
