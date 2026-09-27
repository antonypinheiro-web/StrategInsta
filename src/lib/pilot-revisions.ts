import type { ContentOrigin, PilotWorkspaceData } from '../types/workspace';

// Historical snapshots are immutable. Restore the edited item's identity from
// its revision record instead of attributing feedback to the previous version.
export function stampEditedVersion(data: PilotWorkspaceData, source: ContentOrigin | undefined, versionId: string): PilotWorkspaceData {
  if (!source) return data;
  if (source.kind === 'idea') return { ...data, matrix: data.matrix && { ...data.matrix, cells: data.matrix.cells.map(cell => ({ ...cell, ideas: cell.ideas.map(idea => idea.id === source.id ? { ...idea, versionId } : idea) })) } };
  if (source.kind === 'bio') return { ...data, bios: data.bios?.map(bio => bio.id === source.id ? { ...bio, versionId } : bio) };
  if (source.kind === 'story') return { ...data, storiesWeek: data.storiesWeek && { ...data.storiesWeek, days: data.storiesWeek.days.map(day => ({ ...day, stories: day.stories.map(story => story.id === source.id ? { ...story, versionId } : story) })) } };
  if (source.kind === 'section') return { ...data, scripts: data.scripts.map(script => script.id === source.id ? { ...script, versionId } : script) };
  return data;
}
