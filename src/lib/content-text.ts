import type { ContentBlock, ContentFormat, GeneratedContent, StoriesDay, StoryFrame } from '../types/workspace';

// Plain text built to be pasted into other creation tools (Canva, CapCut, docs), without extra markup.
export const FORMAT_NAMES: Record<ContentFormat, string> = { reel: 'Reel', carousel: 'Carrossel', static: 'Post estático', stories: 'Stories' };
const STORY_FORMAT_NAMES: Record<string, string> = { video: 'Vídeo', photo: 'Foto', text: 'Tela de texto' };
const GOAL_NAMES: Record<string, string> = { retain: 'Reter', engage: 'Engajar', convert: 'Converter' };

const lines = (...items: (string | false | undefined | null)[]) => items.filter((item): item is string => !!item && !!item.trim()).join('\n');

export function blockToText(block: ContentBlock, index?: number) {
  return lines(
    `${index !== undefined ? `${index + 1}. ` : ''}${block.label}`,
    block.action && `O que fazer: ${block.action}`,
    block.speech && `Fala: ${block.speech}`,
    block.onScreen && `Texto na tela: ${block.onScreen}`,
    block.text && `Texto: ${block.text}`,
  );
}

export function scriptToText(script: GeneratedContent) {
  return [
    lines(script.title, `Formato: ${FORMAT_NAMES[script.format] ?? script.format}`, script.objective && `Objetivo: ${script.objective}`),
    ...script.blocks.map((block, index) => blockToText(block, index)),
    script.caption && lines('Legenda:', script.caption),
    script.cta && `Próximo passo: ${script.cta}`,
  ].filter(Boolean).join('\n\n');
}

export function scriptsToText(scripts: GeneratedContent[]) {
  return scripts.map(scriptToText).join('\n\n' + '-'.repeat(24) + '\n\n');
}

export function storyToText(story: StoryFrame) {
  return lines(
    `Story ${story.position}${story.goal ? ` (${GOAL_NAMES[story.goal] ?? story.goal})` : ''}`,
    `Formato: ${STORY_FORMAT_NAMES[story.format ?? 'video'] ?? story.format}`,
    story.narrative,
    story.scene && `O que gravar: ${story.scene}`,
    story.speech && `Fala: ${story.speech}`,
    story.onScreen && `Texto na tela: ${story.onScreen}`,
    story.tool && story.tool !== 'nenhum' && `Recursos do Instagram: ${story.tool}`,
    story.cta && `Próximo passo: ${story.cta}`,
  );
}

export function storiesDayToText(day: StoriesDay) {
  const date = new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  return [`Stories de ${date}`, ...day.stories.map(storyToText)].join('\n\n');
}

/** Copies text with the async clipboard API and a textarea fallback for embedded browsers. */
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return; } catch { /* fall back below */ }
  const area = document.createElement('textarea');
  area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
  document.body.appendChild(area); area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('Não foi possível copiar. Selecione o texto e copie manualmente.');
}
