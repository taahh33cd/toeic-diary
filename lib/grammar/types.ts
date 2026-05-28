export interface GrammarQuestion {
  id: string;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  grammar_type: string;
  explanation_reason: string;
  explanation_grammar: string;
  translation: string;
  core_vocabulary: Array<{ word: string; type: string; meaning: string }>;
  // Allow extra fields present in raw data
  [key: string]: unknown;
}

export interface TopicConfig {
  id: string;
  slug: string;
  name: string;
  testSizes: number[];
  emoji: string;
  color: string;
}

export interface QuizResumeState {
  answers: Record<string, string>;
  elapsed: number;
  savedAt: number;
}
