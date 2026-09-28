import { FormConfig } from '../types';

const LOCAL_CONFIG_DRAFT_KEY = 'leadership-growth-log:v1-form-config-draft';

type LegacyFormConfigDraft = Partial<FormConfig> & {
  section5?: Partial<FormConfig['section5']> & { question?: string };
  section6?: Partial<FormConfig['section6']> & { question?: string };
};

function isFormConfigDraft(value: unknown): value is LegacyFormConfigDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as LegacyFormConfigDraft;
  return Boolean(draft.section1 && draft.section2 && draft.section3 && draft.section4);
}

function migrateDraftQuestions(
  section: { questions?: string[]; question?: string } | undefined,
  baseQuestions: string[],
  legacyQuestionIndex = 0,
): string[] {
  if (Array.isArray(section?.questions)) return section.questions;
  if (typeof section?.question === 'string') {
    return baseQuestions.map((question, index) =>
      index === legacyQuestionIndex ? section.question as string : question
    );
  }
  return baseQuestions;
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
      section5: {
        ...baseConfig.section5,
        ...draft.section5,
        questions: migrateDraftQuestions(draft.section5, baseConfig.section5.questions, 1),
      },
      section6: {
        ...baseConfig.section6,
        ...draft.section6,
        questions: migrateDraftQuestions(draft.section6, baseConfig.section6.questions),
      },
    };
  } catch (error) {
    console.warn('Ignoring an invalid local form configuration draft.', error);
    return baseConfig;
  }
}

export function saveLocalConfigDraft(config: FormConfig): void {
  window.localStorage.setItem(LOCAL_CONFIG_DRAFT_KEY, JSON.stringify(config));
}
