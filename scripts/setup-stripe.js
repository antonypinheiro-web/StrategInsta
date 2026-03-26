#!/usr/bin/env node
/**
 * StrategInsta — Setup Stripe Products & Prices
 * Executa uma vez para criar todos os produtos e preços no Stripe.
 * Uso: node scripts/setup-stripe.js
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não encontrada. Exporte a variável ou adicione ao .env');
  process.exit(1);
}

const BASE_URL = 'https://api.stripe.com/v1';

async function stripeRequest(endpoint, method, body) {
  const params = body ? new URLSearchParams(body).toString() : null;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const data = await res.json();
  if (data.error) throw new Error(`Stripe error: ${data.error.message}`);
  return data;
}

async function createProduct(name, description) {
  return stripeRequest('/products', 'POST', { name, description });
}

async function createPrice(productId, unitAmount, currency, interval) {
  return stripeRequest('/prices', 'POST', {
    product: productId,
    unit_amount: unitAmount,
    currency,
    'recurring[interval]': interval,
  });
}

const PLANS = [
  {
    key: 'individual',
    name: 'Individual',
    description: 'Para criadores de conteúdo solo. 15 estratégias por mês.',
    monthly: 4700,   // R$47,00 em centavos
    yearly: 39700,   // R$397,00 em centavos
  },
  {
    key: 'professional',
    name: 'Professional',
    description: 'Para profissionais e consultores. 60 estratégias por mês.',
    monthly: 9700,   // R$97,00 em centavos
    yearly: 79700,   // R$797,00 em centavos
  },
  {
    key: 'agency',
    name: 'Agency',
    description: 'Para agências e equipes. 250 estratégias por mês.',
    monthly: 24700,  // R$247,00 em centavos
    yearly: 199700,  // R$1.997,00 em centavos
  },
];

async function main() {
  console.log('🚀 Iniciando setup do Stripe...\n');

  const results = {};

  for (const plan of PLANS) {
    console.log(`📦 Criando produto: ${plan.name}`);
    const product = await createProduct(plan.name, plan.description);
    console.log(`   ✓ Produto criado: ${product.id}`);

    console.log(`   💳 Criando preço mensal: R$${plan.monthly / 100}`);
    const monthlyPrice = await createPrice(product.id, plan.monthly, 'brl', 'month');
    console.log(`   ✓ Preço mensal: ${monthlyPrice.id}`);

    console.log(`   💳 Criando preço anual: R$${plan.yearly / 100}`);
    const yearlyPrice = await createPrice(product.id, plan.yearly, 'brl', 'year');
    console.log(`   ✓ Preço anual: ${yearlyPrice.id}\n`);

    results[plan.key] = {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      yearlyPriceId: yearlyPrice.id,
    };
  }

  console.log('✅ Setup concluído!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Adicione as variáveis abaixo ao seu .env e ao Vercel:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const [key, ids] of Object.entries(results)) {
    const k = key.toUpperCase();
    console.log(`STRIPE_PRICE_${k}_MONTHLY=${ids.monthlyPriceId}`);
    console.log(`STRIPE_PRICE_${k}_YEARLY=${ids.yearlyPriceId}`);
  }

  console.log('');
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
