import type { UserInput } from '../types';

// Account-level brand personalization (account menu). Stored in the user's auth metadata and sent with
// every generation as input.brandProfile; the engine applies it as a style preference.
export type EmojiUse = 'none' | 'few' | 'free';
export interface BrandProfile { voice: string; wordsToUse: string; wordsToAvoid: string; emojis: EmojiUse; notes: string; }

export const EMPTY_BRAND_PROFILE: BrandProfile = { voice: '', wordsToUse: '', wordsToAvoid: '', emojis: 'few', notes: '' };
export const BRAND_PROFILE_LIMITS: Record<Exclude<keyof BrandProfile, 'emojis'>, number> = { voice: 500, wordsToUse: 1000, wordsToAvoid: 1000, notes: 1500 };

let current: BrandProfile = EMPTY_BRAND_PROFILE;

/** Reads a profile from untrusted metadata, keeping only known fields within their limits. */
export function parseBrandProfile(value: unknown): BrandProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return EMPTY_BRAND_PROFILE;
  const raw = value as Record<string, unknown>;
  const text = (key: keyof typeof BRAND_PROFILE_LIMITS) => typeof raw[key] === 'string' ? (raw[key] as string).slice(0, BRAND_PROFILE_LIMITS[key]) : '';
  const emojis = ['none', 'few', 'free'].includes(String(raw.emojis)) ? raw.emojis as EmojiUse : 'few';
  return { voice: text('voice'), wordsToUse: text('wordsToUse'), wordsToAvoid: text('wordsToAvoid'), emojis, notes: text('notes') };
}

export function hasBrandProfile(profile: BrandProfile) {
  return !!(profile.voice.trim() || profile.wordsToUse.trim() || profile.wordsToAvoid.trim() || profile.notes.trim() || profile.emojis !== 'few');
}

export function setCurrentBrandProfile(profile: BrandProfile) { current = profile; }
export function currentBrandProfile() { return current; }

/** Adds the account profile to a briefing. The profile voice also fills the briefing voice when that one is empty. */
export function withBrandProfile<T extends Partial<UserInput>>(input: T, profile: BrandProfile = current): T {
  if (!input || !hasBrandProfile(profile)) return input;
  return { ...input, brandVoice: input.brandVoice?.trim() ? input.brandVoice : profile.voice, brandProfile: profile };
}
