export type ProviderName = 'primary' | 'fallback1' | 'fallback2';

export type EvalInput = {
  mode: 'academic' | 'general';
  task1Text: string;
  task1WordCount: number;
  task2Text: string;
  task2WordCount: number;
};

export type ProviderResult =
  | { ok: true; json: unknown; rawText: string }
  | { ok: false; error: string; rawText?: string };

export interface EvalProvider {
  name: ProviderName;
  evaluate(input: EvalInput): Promise<ProviderResult>;
}
