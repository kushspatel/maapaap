/**
 * Core domain types for maapaap
 * Shared between web and API
 */

// ============= Enums =============

export enum Unit {
  INCHES = 'IN',
  CENTIMETERS = 'CM',
}

export enum MeasureType {
  ROUND = 'ROUND',     // Full circumference
  FLAT = 'FLAT',       // Half measurement (flat)
  LENGTH = 'LENGTH',   // Linear measurement
  WIDTH = 'WIDTH',     // Width measurement
}

export enum FitPreference {
  TIGHT = 'TIGHT',
  REGULAR = 'REGULAR',
  LOOSE = 'LOOSE',
}

export enum GarmentType {
  BLOUSE_CHOLI = 'BLOUSE_CHOLI',
  SKIRT_CHANIYA = 'SKIRT_CHANIYA',
  KAMEEZ_KURTI = 'KAMEEZ_KURTI',
  SALWAR = 'SALWAR',
  CHURIDAR = 'CHURIDAR',
  PANTS = 'PANTS',
  DRESS = 'DRESS',
  KIDS_GENERIC = 'KIDS_GENERIC',
}

export enum Language {
  GUJARATI = 'gu',
  ENGLISH = 'en',
  HINDI = 'hi',
}

// ============= Base Entities =============

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  nickname?: string;
  age?: number;
  height?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MeasurementSet {
  id: string;
  user_id: string;
  profile_id: string;
  garment_type: GarmentType;
  title: string;
  unit_default: Unit;
  fit_preference: FitPreference;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  measurements?: MeasurementEntry[];
}

export interface MeasurementEntry {
  id: string;
  measurement_set_id: string;
  key: string;              // Stable internal ID (e.g., 'bust_round')
  label_gu: string;         // Gujarati label
  label_en: string;         // English label
  value: number;            // Numeric value (decimal)
  unit: Unit;
  measure_type: MeasureType;
  created_at: Date;
  updated_at: Date;
}

// ============= Measurement Definitions =============

export interface MeasurementDefinition {
  key: string;
  label_gu: string;
  label_en: string;
  measure_type: MeasureType;
  is_essential: boolean;    // True for essential, false for advanced
  how_to_measure_gu?: string;
  how_to_measure_en?: string;
  diagram_url?: string;
  min_value?: number;       // For soft validation
  max_value?: number;       // For soft validation
  typical_range?: [number, number]; // [min, max] for warnings
}

export interface GarmentMeasurementTemplate {
  garment_type: GarmentType;
  name_gu: string;
  name_en: string;
  measurements: MeasurementDefinition[];
}

// ============= API Request/Response Types =============

export interface CreateProfileRequest {
  name: string;
  nickname?: string;
  age?: number;
  height?: number;
  notes?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  nickname?: string;
  age?: number;
  height?: number;
  notes?: string;
}

export interface CreateMeasurementSetRequest {
  profile_id: string;
  garment_type: GarmentType;
  title: string;
  unit_default: Unit;
  fit_preference: FitPreference;
  notes?: string;
  measurements: Array<{
    key: string;
    value: number;
    unit: Unit;
  }>;
}

export interface UpdateMeasurementSetRequest {
  title?: string;
  unit_default?: Unit;
  fit_preference?: FitPreference;
  notes?: string;
  measurements?: Array<{
    key: string;
    value: number;
    unit: Unit;
  }>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============= Validation Types =============

export interface ValidationWarning {
  field: string;
  message_gu: string;
  message_en: string;
  severity: 'warning' | 'info';
}

export interface MeasurementValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
}

// ============= Share/Export Types =============

export interface ShareFormat {
  format: 'whatsapp' | 'copy' | 'pdf' | 'link';
  language: Language;
}

export interface ShareContent {
  profile: Profile;
  measurement_set: MeasurementSet;
  formatted_text: string;
}
