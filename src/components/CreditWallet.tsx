import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CREDIT_PACKS, PRESALE_CONTACT_URL, brl, creditsInDeliveries, strategyPriceCents } from '@/lib/credit-packs';
import type { CreditPack } from '@/lib/credit-packs';
import { startCreditCheckout } from '@/services/creditCheckoutService';

interface WalletLike { available: number; reserved: number; }

/** Balance shown as deliveries, with a shortcut to the credit packs. */
export function CreditWalletSummary({ wallet, error, busy, onBuy, onRefresh }: { wallet?: WalletLike; error?: string; busy?: boolean; onBuy: () => void; onRefresh: () => void }) {
  return <div className="flex flex-wrap items-center gap-2 text-sm">
    <p className="text-muted-foreground">{wallet ? <>Você tem <strong className="text-foreground">{creditsInDeliveries(wallet.available)}</strong>{wallet.reserved > 0 && <> · {wallet.reserved} em uso por uma geração em andamento</>}</> : 'Consultando saldo'}{error && ' · ' + error}</p>
    <Button variant="ghost" size="sm" onClick={onRefresh} aria-label="Atualizar saldo"><RefreshCw className="h-4 w-4" /></Button>
    <Button variant="outline" size="sm" disabled={busy} onClick={onBuy}>Comprar créditos</Button>
  </div>;
}

/** Credit packs. While automatic billing is off, purchases go through Instagram Direct (pre-sale). */
export function CreditPacksDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [buying, setBuying] = useState<CreditPack['id']>();
  const [presale, setPresale] = useState<CreditPack>();
  const [buyError, setBuyError] = useState('');
  useEffect(() => { if (open) { setPresale(undefined); setBuyError(''); } }, [open]);
  const buy = async (pack: CreditPack) => {
    setBuying(pack.id); setBuyError('');
    try {
      const result = await startCreditCheckout(pack.id, crypto.randomUUID());
      if (result.enabled) window.location.assign(result.url);
      else setPresale(pack);
    } catch (reason) { setBuyError(reason instanceof Error ? reason.message : 'Não foi possível iniciar a compra.'); }
    finally { setBuying(undefined); }
  };
  return <Dialog open={open} onOpenChange={value => { if (!buying) onOpenChange(value); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Comprar créditos</DialogTitle>
          <DialogDescription>Uma estratégia completa usa 20 créditos. Ajustes, ideias novas e roteiros usam de 1 a 5.</DialogDescription>
        </DialogHeader>
        {presale ? <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm">
          <p className="font-medium">Estamos em pré-venda</p>
          <p>A compra do pacote de {presale.credits} créditos ({brl(presale.priceCents)}) é feita direto com a equipe ThinkPost, por Pix. Envie uma mensagem com o pacote escolhido; os créditos entram na sua conta em até 1 dia útil após o pagamento.</p>
          <div className="flex flex-wrap gap-2"><Button asChild><a href={PRESALE_CONTACT_URL} target="_blank" rel="noreferrer">Falar no Instagram</a></Button><Button variant="ghost" onClick={() => setPresale(undefined)}>Ver pacotes</Button></div>
        </div> : <div className="space-y-3">
          {CREDIT_PACKS.map(pack => <div key={pack.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div>
              <p className="font-semibold">{pack.credits} créditos · {brl(pack.priceCents)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{creditsInDeliveries(pack.credits)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Estratégia completa sai a {brl(strategyPriceCents(pack))}</p>
            </div>
            <Button disabled={!!buying} onClick={() => void buy(pack)}>{buying === pack.id ? 'Abrindo...' : 'Comprar'}</Button>
          </div>)}
          {buyError && <p role="alert" className="text-sm text-destructive">{buyError}</p>}
        </div>}
        <p className="text-xs text-muted-foreground">Créditos não expiram. Reembolso integral em até 7 dias para pacote não usado.</p>
      </DialogContent>
  </Dialog>;
}
