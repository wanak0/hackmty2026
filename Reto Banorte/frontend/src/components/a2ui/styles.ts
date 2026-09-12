// Explicit styles keep this catalog independent of the surrounding app theme.
export const panel = 'rounded-2xl border border-[#DED6D0] bg-[#FFFFFF] p-5 text-base leading-relaxed text-[#222222] sm:p-6';
export const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EC0000]';
export const secondaryButton = 'min-h-[48px] rounded-xl border border-[#8A817B] bg-[#FFFFFF] px-4 py-3 text-base font-semibold text-[#222222] hover:bg-[#FBF1EA] disabled:cursor-not-allowed disabled:opacity-60 ' + focus;
export const input = 'min-h-[48px] w-full rounded-xl border border-[#8A817B] bg-[#FFFFFF] px-4 py-3 text-base text-[#222222] placeholder:text-[#68605B] ' + focus;

export const money = (value: number) => Number.isFinite(value)
  ? value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN'
  : 'No disponible';

// Display without decorative emoji; original event payloads remain intact.
export const plainText = (value: string = '') => value.replace(/\p{Extended_Pictographic}|[\uFE0F\u200D\u20E3]/gu, '').trim();
