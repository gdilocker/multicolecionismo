/**
 * Formata valores monetários em Reais (BRL)
 *
 * @param cents - Valor em centavos de BRL
 * @param showDecimals - Se deve mostrar os centavos (padrão: true)
 * @returns String formatada como R$ X.XXX,XX
 */
export function formatBRL(cents: number, showDecimals: boolean = true): string {
  const reais = cents / 100;

  if (!showDecimals && reais % 1 === 0) {
    return `R$ ${Math.floor(reais).toLocaleString('pt-BR')}`;
  }

  return `R$ ${reais.toLocaleString('pt-BR', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Converte centavos para reais
 */
export function centsToReais(cents: number): number {
  return cents / 100;
}

/**
 * Converte reais para centavos
 */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}
