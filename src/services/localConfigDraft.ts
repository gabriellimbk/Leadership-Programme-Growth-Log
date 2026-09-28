import { FormConfig } from '../types';

const LOCAL_CONFIG_DRAFT_KEY = 'leadership-growth-log:v1-form-config-draft';

function isFormConfigDraft(value: unknown): value is Partial<FormConfig> {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<FormConfig>;
  return Boolean(draft.section1 && draft.section2 && draft.section3 && draft.section4);
}

export function loadLocalConfigDraft(baseConfig: FormConfig): FormConfig {
  try {
    const rawDraft = window.localStorage.getItem(LOCAL_CONFIG_DRAFT_KEY);
    if (!rawDraft) return baseConfig;

    const draft: unknown = JSON.parse(rawDraft);
    if (!isFormConfigDraft(draft)) return baseConfig;

    return {
      ...baseConfig,
      ...draft,
      section1: { ...baseConfig.section1, ...draft.section1 },
      section2: { ...baseConfig.section2, ...draft.section2 },
      section3: { ...baseConfig.section3, ...draft.section3 },
      section4: { ...baseConfig.section4, ...draft.section4 },
      section5: { ...baseConfig.section5, ...draft.section5 },
      section6: { ...baseConfig.section6, ...draft.section6 },
    };
  } catch (error) {
    console.warn('Ignoring an invalid local form configuration draft.', error);
    return baseConfig;
  }
}

export function saveLocalConfigDraft(config: FormConfig): void {
  window.localStorage.setItem(LOCAL_CONFIG_DRAFT_KEY, JSON.stringify(config));
}
