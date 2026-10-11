import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { InputDialog } from '../../src/components/InputDialog';
import { completeStrategySave } from '../../src/lib/complete-strategy-save';
import '../../src/index.css';

// Local UI fixture only: no Supabase, Stripe or paid AI calls.
export function DialogFixture() {
  const [open, setOpen] = useState(false);
  const [fail, setFail] = useState(true);
  const [saves, setSaves] = useState(0);
  const [charges, setCharges] = useState(0);
  const save = () => completeStrategySave(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (fail) throw new Error('Simulated failure');
    setSaves((n) => n + 1);
  }, async () => { setCharges((n) => n + 1); });
  return <main className="p-6 space-y-4">
    <h1>Teste local, sem dados reais</h1>
    <label className="block"><input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> Simular falha</label>
    <button onClick={() => setOpen(true)}>Abrir salvamento</button>
    <p role="status">Salvamentos: {saves}. Debitos simulados: {charges}.</p>
    <InputDialog isOpen={open} onClose={() => setOpen(false)} onConfirm={save} onCancel={save}
      title="Nomear estrategia de teste" label="Nome" initialValue="Teste local"
      description="Simulacao sem uso de banco ou creditos reais."
      confirmText="Salvar" cancelText="Usar nome padrao" />
  </main>;
}
createRoot(document.getElementById('root')!).render(<DialogFixture />);
