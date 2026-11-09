export interface PasswordHistoryItem {
  id: string;
  user_id: string;
  label: string;
  length: number;
  use_upper: boolean;
  use_lower: boolean;
  use_numbers: boolean;
  use_symbols: boolean;
  created_at: string;
}

export interface GeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeLookAlike: boolean;
}

export type PageView = 'generator' | 'history' | 'auth';

export interface PasswordStrength {
  score: 1 | 2 | 3 | 4;
  label: 'Weak' | 'Moderate' | 'Strong' | 'Impenetrable';
  color: string;
  bgColor: string;
  borderColor: string;
  entropyBits: number;
  crackTimeText: string;
  suggestions: string[];
}
