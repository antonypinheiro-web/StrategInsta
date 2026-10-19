import test from 'node:test';
import assert from 'node:assert/strict';
import { isRecoveryUrl } from '../src/lib/auth-recovery.ts';
import { AUTH_PT_BR } from '../src/lib/auth-pt-br.ts';
import { applyWorkspaceResult, emptyWorkspace } from '../src/components/workspace/workspace-model.ts';

test('the password recovery link is recognized wherever it lands (bug of 18/10)', () => {
  assert.equal(isRecoveryUrl('#access_token=abc&expires_in=3600&refresh_token=def&token_type=bearer&type=recovery'), true);
  assert.equal(isRecoveryUrl('', '?type=recovery'), true);
  assert.equal(isRecoveryUrl('#access_token=abc&type=signup'), false);
  assert.equal(isRecoveryUrl('#type=recoveryx'), false);
});

test('every login text is in Portuguese', () => {
  const english = /\b(Sign|Email address|Your Password|Forgot|Don't have|Already have|Send|password)\b/;
  for (const [view, texts] of Object.entries(AUTH_PT_BR.variables)) {
    for (const [key, value] of Object.entries(texts)) assert.doesNotMatch(value, english, `${view}.${key}`);
  }
  assert.equal(AUTH_PT_BR.variables.forgotten_password.link_text, 'Esqueci minha senha');
});

test('calendar and action plan can be generated alone for a strategy saved part-way', () => {
  const day = n => ({ day: n, weekday: 'Segunda', contentType: 'reel', topic: 'Ideia', caption: 'Orientação', hashtags: ['#a'] });
  const calendar = Array.from({ length: 30 }, (_, i) => day(i + 1));
  const withCalendar = applyWorkspaceResult(emptyWorkspace(), 'section_regenerate', { workspace: emptyWorkspace(), section: 'editorialCalendar' }, { output: calendar });
  assert.equal(withCalendar.overrides.editorialCalendar.length, 30);
  const plan = [1, 2, 3, 4].map(week => ({ week, tasks: [{ task: 'Tarefa', description: 'Como fazer', priority: 'high' }] }));
  const withPlan = applyWorkspaceResult(emptyWorkspace(), 'section_regenerate', { workspace: emptyWorkspace(), section: 'actionPlan' }, { output: plan });
  assert.equal(withPlan.overrides.actionPlan[3].week, 4);
  const withProfile = applyWorkspaceResult(emptyWorkspace(), 'section_regenerate', { workspace: emptyWorkspace(), section: 'idealCustomerProfile' }, { output: 'Perfil revisado' });
  assert.equal(withProfile.overrides.idealCustomerProfile, 'Perfil revisado');
  assert.throws(() => applyWorkspaceResult(emptyWorkspace(), 'section_regenerate', { workspace: emptyWorkspace(), section: 'editorialCalendar' }, { output: [{ day: 1 }] }));
});
