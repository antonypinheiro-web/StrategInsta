import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingWizard } from '../../src/components/OnboardingWizard';
import { Button } from '../../src/components/ui/button';
import type { UserInput } from '../../src/types';
import { saveBriefingDraft } from '../../src/lib/briefing';
import '../../src/index.css';

// Development fixture: no account, database, payment or AI calls.
export function BriefingFixture() {
  const [theme, setTheme] = useState(new URLSearchParams(window.location.search).get('theme') === 'light' ? 'light' : 'dark');
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState<UserInput | null>(null);
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  return <>
    {!new URLSearchParams(window.location.search).has('compare') && <div className="flex flex-wrap items-center gap-3 bg-muted px-5 py-2 text-xs text-foreground">
      <strong>PRÉVIA VISUAL: esta página não gera estratégias. O saldo dos testes não é o saldo da sua conta.</strong>
      <label><input type="checkbox" checked={blocked} onChange={(event) => setBlocked(event.target.checked)} /> Sem créditos</label>
      <label><input type="checkbox" checked={failed} onChange={(event) => setFailed(event.target.checked)} /> Falha do plano</label>
      <Button size="sm" variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Alternar tema</Button>
    </div>}
    <OnboardingWizard previewMode isAuthenticated userId="local-ui-fixture" onStart={(input) => {
      saveBriefingDraft(localStorage, 'local-ui-fixture', input, 4);
      setSent(input);
    }} canGenerate={!blocked && !failed}
      planError={failed ? 'Falha simulada ao consultar plano.' : null} creditsRemaining={blocked ? 0 : 1} />
    {sent && <div role="status" className="fixed bottom-3 left-3 right-3 z-20 mx-auto max-w-xl rounded-lg border border-primary bg-card p-5 text-foreground shadow-lg">
      <p className="font-semibold">Briefing salvo neste navegador. Nenhuma estratégia foi gerada.</p>
      <p className="my-3 text-sm">No app real, entre na sua conta e clique em “Trazer respostas da prévia”. Depois revise o briefing e gere com seu saldo real.</p>
      <Button asChild variant="gradient"><a href="/app" target="_blank" rel="noopener noreferrer">Abrir app real</a></Button>
      <Button variant="ghost" className="ml-2" onClick={() => setSent(null)}>Fechar aviso</Button>
    </div>}
  </>;
}
if (import.meta.env.DEV) {
  const root = createRoot(document.getElementById('root')!);
  root.render(<BriefingFixture />);
  import.meta.hot?.dispose(() => root.unmount());
}
