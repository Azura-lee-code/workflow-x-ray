// Lightweight UI internationalization for the three core demo languages.
// Diagnosis output and the voice interview already follow the selected
// `language` (handled by Gemini). This covers the UI shell only.
// Any language other than Chinese/Japanese falls back to English UI.

type Lang = 'en' | 'zh' | 'ja';

export function langCode(language: string): Lang {
  if (language === 'Chinese') return 'zh';
  if (language === 'Japanese') return 'ja';
  return 'en';
}

type Entry = { en: string; zh: string; ja: string };

const DICT: Record<string, Entry> = {
  'header.tagline': {
    en: 'Organizational Problem Diagnostician',
    zh: '组织问题诊断师',
    ja: '組織課題診断官',
  },
  'header.outputLang': { en: 'Output language:', zh: '输出语言:', ja: '出力言語:' },

  'hero.title': {
    en: 'Find the real problem before you solve it.',
    zh: '先找到真正的问题，再去解决。',
    ja: '解決する前に、本当の課題を見極める。',
  },
  'hero.desc': {
    en: 'Workflow X-Ray acts as a clinical corporate auditor. Bring us an initiative, KPI, manual process, or AI/automation idea. We reveal which layers are actually broken and map a staged path to real change.',
    zh: 'Workflow X-Ray 像一位临床式的企业诊断师。带上你的项目、KPI、手动流程或 AI/自动化想法，我们会揭示哪一层真正出了问题，并给出分阶段的变革路径。',
    ja: 'Workflow X-Ray は臨床的な企業診断官として機能します。施策・KPI・手作業プロセス・AI/自動化のアイデアをお持ちください。どの層が実際に壊れているかを明らかにし、段階的な変革への道筋を示します。',
  },

  'templates.heading': {
    en: 'Explore Diagnostic Templates (Click to Pre-fill)',
    zh: '诊断模板（点击预填）',
    ja: '診断テンプレート（クリックで入力）',
  },
  'templates.quick': { en: 'Quick Scoping templates', zh: '快速诊断模板', ja: 'クイックスコーピング' },
  'templates.load': { en: 'Load template', zh: '加载模板', ja: 'テンプレートを読み込む' },

  'form.title': { en: 'Diagnostics Intake Form', zh: '诊断输入表单', ja: '診断インテークフォーム' },
  'form.subtitle': {
    en: 'Scrutinize the initiative through structured inquiry or raw material.',
    zh: '通过结构化提问或原始材料审视这个项目。',
    ja: '構造化された質問または生の資料で施策を精査します。',
  },
  'form.guided': { en: 'Guided scoping', zh: '引导式', ja: 'ガイド式' },
  'form.raw': { en: 'Raw text / Transcript', zh: '原始文本 / 记录', ja: '生テキスト / 記録' },
  'form.run': { en: 'Run Clinical Scan', zh: '运行诊断扫描', ja: '診断スキャンを実行' },

  'ctx.industry': { en: 'Industry', zh: '行业', ja: '業界' },
  'ctx.orgSize': { en: 'Organization Size', zh: '组织规模', ja: '組織規模' },
  'ctx.risk': { en: 'Risk Appetite', zh: '风险偏好', ja: 'リスク許容度' },
  'ctx.conservative': { en: 'Conservative', zh: '保守', ja: '保守的' },
  'ctx.moderate': { en: 'Moderate', zh: '适中', ja: '中程度' },
  'ctx.aggressive': { en: 'Aggressive', zh: '激进', ja: '積極的' },

  'tab.mirror': { en: 'The Mirror', zh: '镜像', ja: 'ミラー' },
  'tab.direction': { en: 'Direction Suitability', zh: '方向适配', ja: '方向性の妥当性' },
  'tab.execution': { en: 'Operational Readiness', zh: '执行准备度', ja: '実行準備状況' },
  'tab.alignment': { en: 'Alignment Dynamics', zh: '各方一致性', ja: '連携の力学' },
  'tab.facts': { en: 'Extracted Facts & Audit', zh: '事实提取与审计', ja: '事実抽出と監査' },
  'tab.reform': { en: 'Reform Roadmap', zh: '变革路线图', ja: '改革ロードマップ' },
  'tab.brief': { en: 'Executive Brief', zh: '决策摘要', ja: 'エグゼクティブブリーフ' },

  'voice.launch': { en: 'Launch Voice Scoper', zh: '启动语音访谈', ja: '音声面談を開始' },
};

export function makeT(language: string) {
  const code = langCode(language);
  return (key: string): string => {
    const e = DICT[key];
    if (!e) return key;
    return e[code] || e.en;
  };
}
