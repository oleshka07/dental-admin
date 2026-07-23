import { CLINIC } from '@/lib/content';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <strong>{CLINIC.name}</strong>
          <p>{CLINIC.legalName}, IČO: {CLINIC.ico}</p>
          <p>{CLINIC.address}</p>
        </div>
        <div>
          <p>{CLINIC.phone}</p>
          <p>{CLINIC.email}</p>
        </div>
        <div>
          {CLINIC.hours.map((h) => (
            <p key={h.day}>
              {h.day}: {h.time}
            </p>
          ))}
        </div>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} {CLINIC.name}. Všechna práva vyhrazena.</p>
    </footer>
  );
}
