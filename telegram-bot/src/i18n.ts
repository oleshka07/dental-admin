export type Lang = 'CZ' | 'UA';

const dict = {
  chooseLanguage: { CZ: 'Vyberte jazyk / Оберіть мову', UA: 'Vyberte jazyk / Оберіть мову' },
  askName: { CZ: 'Jak se jmenujete? (jméno a příjmení)', UA: 'Як вас звати? (ім’я та прізвище)' },
  askPhone: { CZ: 'Zadejte prosím telefonní číslo (např. +420...)', UA: 'Вкажіть, будь ласка, номер телефону (напр. +420...)' },
  mainMenu: { CZ: 'Co potřebujete?', UA: 'Що вам потрібно?' },
  menuBook: { CZ: '📅 Objednat se', UA: '📅 Записатися' },
  menuAcute: { CZ: '🦷 Akutní bolest', UA: '🦷 Гострий біль' },
  menuMy: { CZ: '🗓 Moje návštěvy', UA: '🗓 Мої записи' },
  chooseVisitType: { CZ: 'Vyberte typ návštěvy:', UA: 'Оберіть тип візиту:' },
  noSlots: {
    CZ: 'Bohužel v nejbližší době není volný termín. Chcete se zapsat na čekací listinu?',
    UA: 'На жаль, найближчим часом немає вільних термінів. Записати вас у лист очікування?',
  },
  chooseSlot: { CZ: 'Vyberte volný termín:', UA: 'Оберіть вільний час:' },
  confirmSlot: { CZ: 'Potvrdit tento termín?', UA: 'Підтвердити цей запис?' },
  slotTaken: {
    CZ: 'Omlouváme se, tento termín byl právě obsazen. Vyberte prosím jiný.',
    UA: 'Вибачте, цей час щойно зайняли. Оберіть, будь ласка, інший.',
  },
  booked: {
    CZ: 'Vaše návštěva byla zarezervována. Těšíme se na vás!',
    UA: 'Ваш візит заброньовано. Чекаємо на вас!',
  },
  yes: { CZ: '✅ Ano', UA: '✅ Так' },
  no: { CZ: '❌ Ne', UA: '❌ Ні' },
  acuteAskPain: {
    CZ: 'Popište prosím krátce, co vás bolí (kde, jak dlouho, zda je otok nebo horečka).',
    UA: 'Опишіть, будь ласка, коротко що болить (де, як довго, чи є набряк або температура).',
  },
  acuteFoundSlot: {
    CZ: 'Máme pro vás volný termín na akutní bolest co nejdříve:',
    UA: 'Маємо для вас найближчий вільний час для гострого болю:',
  },
  acuteEscalated: {
    CZ: 'Váš požadavek jsme předali asistentce, ozve se vám co nejdříve. Pokud jde o silnou bolest a nikdo se neozve do 15 minut, zavolejte prosím přímo do ordinace.',
    UA: 'Ваш запит передано асистентці, з вами зв’яжуться найближчим часом. Якщо біль сильний і ніхто не відповість протягом 15 хвилин, зателефонуйте, будь ласка, напряму в клініку.',
  },
  myAppointmentsEmpty: { CZ: 'Nemáte žádné nadcházející návštěvy.', UA: 'У вас немає майбутніх записів.' },
  cancelled: { CZ: 'Návštěva byla zrušena.', UA: 'Запис скасовано.' },
  cancelButton: { CZ: 'Zrušit', UA: 'Скасувати' },
  consentPrompt: {
    CZ: 'Souhlasíte se zpracováním osobních údajů pro účely rezervace?',
    UA: 'Чи погоджуєтесь ви на обробку персональних даних для цілей запису?',
  },
  needConsent: {
    CZ: 'Bez souhlasu se zpracováním údajů bohužel nemůžeme pokračovat v rezervaci.',
    UA: 'Без згоди на обробку даних, на жаль, не можемо продовжити запис.',
  },
} as const;

export type Key = keyof typeof dict;

export function t(key: Key, lang: Lang): string {
  return dict[key][lang];
}
