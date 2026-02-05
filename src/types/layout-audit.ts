/**
 * Layout Audit types for the ergonomic evaluation checklist
 */

export type AuditResponse = 'underbuilt' | 'minimal' | 'optimal' | 'yes' | 'no' | 'unknown' | 'na';

export interface AuditItem {
  id: string;
  /** i18n key for the label text (simplified, not a full question) */
  labelKey: string;
  /** i18n key for the "why it matters" tooltip */
  tooltipKey: string;
  /** Item type: measurable (value-based) or boolean (yes/no) */
  type: 'measurable' | 'boolean';

  /** For measurable items: threshold calculation function */
  thresholds?: (v: AuditVariables) => { minimal: number; optimal: number };
  /** Unit for measurable items (e.g., 'm', 'units', 'seats') */
  unit?: string;

  /** Functional tags for each response tier */
  functionalTags?: {
    underbuilt?: string;
    minimal?: string;
    optimal?: string;
    yes?: string;
    no?: string;
  };

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
