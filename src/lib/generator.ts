import { GeneratorOptions, PasswordStrength } from './types';

// Distinct character pools
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Confusing / look-alike characters to exclude if requested
// i, l, 1, I, L, o, 0, O, |, `
const LOOK_ALIKE_SET = new Set(['i', 'l', '1', 'I', 'L', 'o', '0', 'O', '|', '`', '\'', '"', ';', ':']);

/**
 * Cryptographically secure integer selection in range [0, max - 1]
 * Uses rejection sampling to guarantee zero modulo bias.
 * Strictly uses crypto.getRandomValues, NEVER Math.random.
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const array = new Uint32Array(1);
  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);
  return array[0] % max;
}

/**
 * Cryptographic Fisher-Yates shuffle
 */
export function cryptoShuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Generate password strictly using crypto.getRandomValues
 */
export function generatePassword(options: GeneratorOptions): string {
  let upper = UPPERCASE_CHARS;
  let lower = LOWERCASE_CHARS;
  let numbers = NUMBER_CHARS;
  let symbols = SYMBOL_CHARS;

  if (options.excludeLookAlike) {
    upper = upper.split('').filter(c => !LOOK_ALIKE_SET.has(c)).join('');
    lower = lower.split('').filter(c => !LOOK_ALIKE_SET.has(c)).join('');
    numbers = numbers.split('').filter(c => !LOOK_ALIKE_SET.has(c)).join('');
    symbols = symbols.split('').filter(c => !LOOK_ALIKE_SET.has(c)).join('');
  }

  const enabledSets: string[] = [];
  if (options.useUpper && upper.length > 0) enabledSets.push(upper);
  if (options.useLower && lower.length > 0) enabledSets.push(lower);
  if (options.useNumbers && numbers.length > 0) enabledSets.push(numbers);
  if (options.useSymbols && symbols.length > 0) enabledSets.push(symbols);

  // If no sets are selected, fallback to lower+numbers for safety
  if (enabledSets.length === 0) {
    enabledSets.push(lower.length > 0 ? lower : LOWERCASE_CHARS);
  }

  const fullPool = enabledSets.join('');
  const passwordChars: string[] = [];

  // Guarantee at least one character from each enabled character set
  for (const set of enabledSets) {
    const idx = getSecureRandomInt(set.length);
    passwordChars.push(set[idx]);
  }

  // Fill the remaining length with random characters from the combined pool
  const targetLength = Math.max(options.length, passwordChars.length);
  while (passwordChars.length < targetLength) {
    const idx = getSecureRandomInt(fullPool.length);
    passwordChars.push(fullPool[idx]);
  }

  // Cryptographically shuffle the characters to ensure unpredictable order
  const shuffled = cryptoShuffle(passwordChars);
  return shuffled.slice(0, options.length).join('');
}

/**
 * Evaluate password strength and cryptographic entropy
 */
export function calculateStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 1,
      label: 'Weak',
      color: '#F43F5E',
      bgColor: 'rgba(244, 63, 94, 0.12)',
      borderColor: 'rgba(244, 63, 94, 0.35)',
      entropyBits: 0,
      crackTimeText: 'Instant',
      suggestions: ['Generate a password to test security.'],
    };
  }

  let poolSize = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumbers) poolSize += 10;
  if (hasSymbols) poolSize += 32;

  // Shannon Entropy in bits = length * log2(poolSize)
  const length = password.length;
  const entropyBits = Math.round(length * (poolSize > 0 ? Math.log2(poolSize) : 0));

  // Determine crack time approximation assuming 100 billion guesses / sec (modern GPU cluster)
  const crackTimeText = formatCrackTime(entropyBits);

  const suggestions: string[] = [];
  if (length < 12) suggestions.push('Increase length to at least 16 characters.');
  if (!hasSymbols) suggestions.push('Include special symbols.');
  if (!hasNumbers) suggestions.push('Include numeric digits.');
  if (!hasUpper || !hasLower) suggestions.push('Mix uppercase and lowercase letters.');

  // Score brackets:
  // 1: < 45 bits or length < 10 (Weak)
  // 2: 45 - 64 bits (Moderate)
  // 3: 65 - 84 bits (Strong)
  // 4: >= 85 bits (Impenetrable)
  let score: 1 | 2 | 3 | 4 = 1;
  let label: 'Weak' | 'Moderate' | 'Strong' | 'Impenetrable' = 'Weak';
  let color = '#F43F5E';
  let bgColor = 'rgba(244, 63, 94, 0.12)';
  let borderColor = 'rgba(244, 63, 94, 0.35)';

  if (entropyBits >= 85 && length >= 14) {
    score = 4;
    label = 'Impenetrable';
    color = '#10B981';
    bgColor = 'rgba(16, 185, 129, 0.12)';
    borderColor = 'rgba(16, 185, 129, 0.35)';
  } else if (entropyBits >= 65 && length >= 12) {
    score = 3;
    label = 'Strong';
    color = '#6366F1';
    bgColor = 'rgba(99, 102, 241, 0.12)';
    borderColor = 'rgba(99, 102, 241, 0.35)';
  } else if (entropyBits >= 45 && length >= 9) {
    score = 2;
    label = 'Moderate';
    color = '#F59E0B';
    bgColor = 'rgba(245, 158, 11, 0.12)';
    borderColor = 'rgba(245, 158, 11, 0.35)';
  } else {
    score = 1;
    label = 'Weak';
    color = '#F43F5E';
    bgColor = 'rgba(244, 63, 94, 0.12)';
    borderColor = 'rgba(244, 63, 94, 0.35)';
  }

  return {
    score,
    label,
    color,
    bgColor,
    borderColor,
    entropyBits,
    crackTimeText,
    suggestions,
  };
}

function formatCrackTime(bits: number): string {
  if (bits < 28) return 'Under a second';
  if (bits < 36) return 'Few seconds';
  if (bits < 44) return 'Several minutes';
  if (bits < 52) return 'A few hours';
  if (bits < 60) return 'Several days';
  if (bits < 70) return 'Months to years';
  if (bits < 80) return 'Centuries';
  if (bits < 90) return 'Millions of years';
  return 'Trillions of years';
}

/**
 * Character group identification for syntax coloring in the display
 * Alphabetic characters in #FFFFFF
 * Numerals in #818CF8
 * Symbols in #10B981
 */
export function getCharColorClass(char: string): string {
  if (/[0-9]/.test(char)) {
    return 'text-[#818cf8] font-semibold'; // Numerals
  }
  if (/[a-zA-Z]/.test(char)) {
    return 'text-white font-medium'; // Alphabetic
  }
  return 'text-[#10b981] font-bold'; // Symbols
}
