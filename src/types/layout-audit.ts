/**
 * Layout Audit types for the ergonomic evaluation checklist
 */

export type AuditResponse = 'pass' | 'fail' | 'unknown' | 'na';

export interface AuditItem {
  id: string;
  /** i18n key for the question text */
  questionKey: string;
  /** i18n key for the "why it matters" tooltip shown on fail */
  tooltipKey: string;
  /** Optional variable substitution in question text (e.g., {wardrobeLength}) */
  variableKey?: 'numberOfPeople' | 'workFromHome';
  /** Value calculation function based on variables */
  calculateValue?: (variables: AuditVariables) => string;
  /** Condition to show this item (returns true to show, false to hide) */
  showIf?: (variables: AuditVariables) => boolean;
}

export interface AuditCategory {
  id: string;
  /** i18n key for category title */
  titleKey: string;
  /** i18n key for category description */
  descriptionKey?: string;
  items: AuditItem[];
  /** Condition to show this category (returns true to show, false to hide) */
  showIf?: (variables: AuditVariables) => boolean;
}

export interface AuditVariables {
  /** Number of adults living in the apartment */
  numberOfAdults: number;
  /** Number of children living in the apartment */
  numberOfChildren: number;
  /** Total number of people (adults + children) - computed for backward compatibility */
  numberOfPeople: number;
  /** Whether anyone works from home (W) */
  workFromHome: boolean;
}

export interface LayoutAuditState {
  responses: Record<string, AuditResponse>;
  variables: AuditVariables;
}
