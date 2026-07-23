import { useMainButton } from '../telegram/hooks';
import { Screen } from '../types';
import { TelegramWebApp } from '../telegram/webapp';

export default function ConfirmationScreen({
  screen,
  onDone,
  webApp,
}: {
  screen: Extract<Screen, { name: 'confirmation' }>;
  onDone: () => void;
  webApp: TelegramWebApp | null;
}) {
  const booked = screen.kind === 'booked';

  useMainButton({
    text: 'Zavřít aplikaci',
    onClick: () => webApp?.close(),
  });

  return (
    <div className="screen center-state">
      <div className="emoji">{booked ? '✅' : '📞'}</div>
      <h2 className="screen-title">{booked ? 'Návštěva byla zarezervována' : 'Váš požadavek jsme přijali'}</h2>
      <p className="screen-subtitle">
        {booked
          ? 'Těšíme se na vás! Potvrzení a případná připomenutí dostanete i přes tohoto bota.'
          : 'Naše asistentka se vám ozve co nejdříve. Při silné bolesti nebo otoku prosím rovnou zavolejte do ordinace.'}
      </p>
      <button className="tg-list-item" onClick={onDone} style={{ textAlign: 'center' }}>
        Zpět na hlavní nabídku
      </button>
    </div>
  );
}
