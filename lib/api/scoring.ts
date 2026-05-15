export function isOfficialScoreSource(source: string) {
  return String(source || '').trim().toLowerCase() === 'agent_api';
}

export function formatScore(score: number) {
  return Math.max(0, Math.floor(Number(score) || 0)).toLocaleString('en-US');
}
