// "Novidades" in the account menu. Newest first; plain language for users, one entry per release.
export interface ChangelogEntry { version: string; date: string; items: string[] }

export const APP_VERSION = '0.8.0';

export const CHANGELOG: ChangelogEntry[] = [
  { version: '0.8.0', date: '2026-10-20', items: [
    'O app agora se chama ThinkPost, com logo e ícone novos.',
    'Ao planejar Stories, você escolhe o dia de início da semana.',
    'O painel pede confirmação antes de adicionar TPs.',
  ] },
  { version: '0.7.0', date: '2026-10-16', items: [
    'Menu da conta: saldo, compra de TPs, uso, personalização da empresa, novidades, ajuda e envio de feedback.',
    'Personalização da empresa: tom de voz, palavras a usar e a evitar e uso de emojis valem para todas as gerações.',
  ] },
  { version: '0.6.0', date: '2026-10-16', items: [
    'Stories organizados por dia, em abas, com o roteiro de cada story aberto só quando você quiser.',
    'Calendário de 30 dias mais compacto, com o status do conteúdo e edição no próprio dia.',
    'Plano de ação com edição e marcação de tarefa concluída.',
  ] },
  { version: '0.5.0', date: '2026-10-15', items: [
    'Nova seção Conteúdos: tudo o que você gerou, com o status Gerado ou Postado.',
    'Copiar cada parte do conteúdo ou tudo de uma vez, para usar em outras ferramentas.',
    'Renomear, duplicar e arquivar estratégias.',
  ] },
  { version: '0.4.0', date: '2026-10-12', items: [
    'Pacotes de TPs, a moeda do app, sem assinatura e sem prazo de validade.',
  ] },
  { version: '0.3.0', date: '2026-10-12', items: [
    'A matriz traz só as ideias; você escolhe o formato ao criar o conteúdo.',
    'O calendário sugere formato e ideia para cada dia.',
    'O gerador entrega o passo a passo de produção e a legenda pronta.',
  ] },
];
