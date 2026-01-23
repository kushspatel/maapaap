/**
 * Utility functions for measurements, validation, and formatting
 */

import { Unit, MeasurementEntry, ValidationWarning, Language } from './types';
import { MeasurementDefinition } from './types';

// ============= Unit Conversion =============

export function convertUnit(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;

  if (from === Unit.INCHES && to === Unit.CENTIMETERS) {
    return value * 2.54;
  }

  if (from === Unit.CENTIMETERS && to === Unit.INCHES) {
    return value / 2.54;
  }

  return value;
}

export function formatMeasurement(value: number, unit: Unit, decimals: number = 1): string {
  return `${value.toFixed(decimals)} ${unit === Unit.INCHES ? '"' : 'cm'}`;
}

// ============= Validation =============

export function validateMeasurement(
  value: number,
  definition: MeasurementDefinition,
  unit: Unit
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Convert value to inches for comparison if needed
  const valueInInches = unit === Unit.CENTIMETERS ? convertUnit(value, Unit.CENTIMETERS, Unit.INCHES) : value;

  // Check typical range
  if (definition.typical_range) {
    const [min, max] = definition.typical_range;

    if (valueInInches < min) {
      warnings.push({
        field: definition.key,
        message_gu: `આ માપ સામાન્ય કરતાં નાનું લાગે છે (${min}-${max} ${Unit.INCHES})`,
        message_en: `This measurement seems smaller than typical (${min}-${max} ${Unit.INCHES})`,
        severity: 'warning',
      });
    }

    if (valueInInches > max) {
      warnings.push({
        field: definition.key,
        message_gu: `આ માપ સામાન્ય કરતાં મોટું લાગે છે (${min}-${max} ${Unit.INCHES})`,
        message_en: `This measurement seems larger than typical (${min}-${max} ${Unit.INCHES})`,
        severity: 'warning',
      });
    }
  }

  // Check min/max bounds
  if (definition.min_value !== undefined && valueInInches < definition.min_value) {
    warnings.push({
      field: definition.key,
      message_gu: `આ માપ ખૂબ નાનું છે`,
      message_en: `This measurement is too small`,
      severity: 'warning',
    });
  }

  if (definition.max_value !== undefined && valueInInches > definition.max_value) {
    warnings.push({
      field: definition.key,
      message_gu: `આ માપ ખૂબ મોટું છે`,
      message_en: `This measurement is too large`,
      severity: 'warning',
    });
  }

  return warnings;
}

export function validateMeasurementSet(
  measurements: Array<{ key: string; value: number; unit: Unit }>,
  definitions: MeasurementDefinition[]
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Individual measurement validation
  measurements.forEach((measurement) => {
    const definition = definitions.find((d) => d.key === measurement.key);
    if (definition) {
      warnings.push(...validateMeasurement(measurement.value, definition, measurement.unit));
    }
  });

  // Cross-measurement validation
  const getMeasurementValue = (key: string): number | undefined => {
    const m = measurements.find((m) => m.key === key);
    if (!m) return undefined;
    // Convert to inches for comparison
    return m.unit === Unit.CENTIMETERS ? convertUnit(m.value, Unit.CENTIMETERS, Unit.INCHES) : m.value;
  };

  // Bust should be larger than waist
  const bust = getMeasurementValue('bust_round');
  const waist = getMeasurementValue('waist_round');
  if (bust && waist && bust < waist - 2) {
    warnings.push({
      field: 'bust_round',
      message_gu: 'છાતી કમર કરતાં નાની લાગે છે. મહેરબાની કરી ફરીથી તપાસો.',
      message_en: 'Bust seems smaller than waist. Please double-check.',
      severity: 'warning',
    });
  }

  // Waist should be smaller than hip
  const hip = getMeasurementValue('hip_round');
  if (waist && hip && waist > hip + 2) {
    warnings.push({
      field: 'waist_round',
      message_gu: 'કમર નિતંબ કરતાં મોટી લાગે છે. મહેરબાની કરી ફરીથી તપાસો.',
      message_en: 'Waist seems larger than hip. Please double-check.',
      severity: 'warning',
    });
  }

  // Sleeve length validation
  const sleeveLength = getMeasurementValue('sleeve_length');
  if (sleeveLength && sleeveLength < 2 && sleeveLength > 0) {
    warnings.push({
      field: 'sleeve_length',
      message_gu: 'બાંયની લંબાઈ ખૂબ ટૂંકી લાગે છે. સ્લીવલેસ માટે 0 દાખલ કરો.',
      message_en: 'Sleeve length seems very short. Enter 0 for sleeveless.',
      severity: 'info',
    });
  }

  return warnings;
}

// ============= Formatting for Sharing =============

export function formatForWhatsApp(
  profileName: string,
  garmentTitle: string,
  measurements: MeasurementEntry[],
  language: Language = Language.GUJARATI
): string {
  const isGujarati = language === Language.GUJARATI;

  let text = isGujarati
    ? `📏 *${profileName}* ના માપ\n🧵 *${garmentTitle}*\n\n`
    : `📏 Measurements for *${profileName}*\n🧵 *${garmentTitle}*\n\n`;

  measurements.forEach((m) => {
    const label = isGujarati ? m.label_gu : m.label_en;
    const unitSymbol = m.unit === Unit.INCHES ? '"' : 'cm';
    const measureTypeHint = m.measure_type === 'ROUND'
      ? (isGujarati ? ' (ગોળ)' : ' (Round)')
      : m.measure_type === 'FLAT'
      ? (isGujarati ? ' (સપાટ)' : ' (Flat)')
      : '';

    text += `• ${label}${measureTypeHint}: ${m.value} ${unitSymbol}\n`;
  });

  text += isGujarati
    ? `\n_આ માપ maapaap એપ દ્વારા બનાવવામાં આવ્યાં છે_`
    : `\n_Created with maapaap app_`;

  return text;
}

export function formatForCopy(
  profileName: string,
  garmentTitle: string,
  measurements: MeasurementEntry[],
  language: Language = Language.GUJARATI
): string {
  return formatForWhatsApp(profileName, garmentTitle, measurements, language);
}

// ============= Helper Functions =============

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function sortMeasurementsByDefinition(
  measurements: MeasurementEntry[],
  definitions: MeasurementDefinition[]
): MeasurementEntry[] {
  const orderMap = new Map(definitions.map((d, i) => [d.key, i]));

  return [...measurements].sort((a, b) => {
    const orderA = orderMap.get(a.key) ?? 999;
    const orderB = orderMap.get(b.key) ?? 999;
    return orderA - orderB;
  });
}

export function getUnitSymbol(unit: Unit): string {
  return unit === Unit.INCHES ? '"' : 'cm';
}

export function getMeasureTypeLabel(type: string, language: Language): string {
  const labels = {
    ROUND: { gu: 'ગોળ', en: 'Round' },
    FLAT: { gu: 'સપાટ', en: 'Flat' },
    LENGTH: { gu: 'લંબાઈ', en: 'Length' },
    WIDTH: { gu: 'પહોળાઈ', en: 'Width' },
  };

  const key = language === Language.GUJARATI ? 'gu' : 'en';
  return labels[type as keyof typeof labels]?.[key] || type;
}

export function getGarmentTypeLabel(type: string, language: Language): string {
  const labels = {
    BLOUSE_CHOLI: { gu: 'ચોળી / બ્લાઉઝ', en: 'Choli / Blouse' },
    SKIRT_CHANIYA: { gu: 'ઘાઘરો / ચણિયા', en: 'Chaniya / Ghagra' },
    KAMEEZ_KURTI: { gu: 'કુર્તી / કમીઝ', en: 'Kameez / Kurti' },
    SALWAR: { gu: 'સલવાર', en: 'Salwar' },
    CHURIDAR: { gu: 'ચૂડીદાર', en: 'Churidar' },
    PANTS: { gu: 'પેન્ટ / પલાઝો', en: 'Pants / Palazzo' },
    DRESS: { gu: 'ડ્રેસ / ગાઉન', en: 'Dress / Gown' },
    KIDS_GENERIC: { gu: 'બાળકોનાં કપડાં', en: 'Kids Clothes' },
  };

  const key = language === Language.GUJARATI ? 'gu' : 'en';
  return labels[type as keyof typeof labels]?.[key] || type;
}
