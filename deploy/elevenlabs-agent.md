# Hlasový agent ElevenLabs — nastavení

Vše na straně serveru je hotové. Chybí jen agent, který se zakládá v dashboardu
ElevenLabs (nelze ho vytvořit z tohoto repozitáře) a dva GitHub secrets.

## 1. Vytvořit agenta

ElevenLabs → **Agents** → **Create agent**.

- **Language**: Czech (v nastavení agenta přidejte i Ukrainian jako additional
  language, pokud chcete obsluhovat ukrajinské pacienty)
- **Voice**: vyberte český ženský hlas — agent zastupuje asistentku ordinace
- **First message**: viz níže
- **System prompt**: viz níže

Po uložení zkopírujte **Agent ID** z adresního řádku nebo z detailu agenta.

## 2. Přidat dva GitHub secrets

Settings → Secrets and variables → Actions → New repository secret:

| Name | Hodnota |
|---|---|
| `ELEVENLABS_API_KEY` | klíč z ElevenLabs → Profile → API Keys |
| `ELEVENLABS_AGENT_ID` | ID agenta z kroku 1 |

### Oprávnění klíče — nejčastější příčina selhání

Klíč potřebuje v **Edit API Key → Endpoints** položku **ElevenAgents**
nastavenou na **Write**.

To je ta samá věc, které API v chybové hlášce říká `convai_write` — produkt byl
přejmenován na ElevenAgents, kód chyby zůstal starý, takže podle hlášky se
v nastavení hledá marně. `Read` nestačí: vydání tokenu hovoru je *vytvoření*
relace, ne čtení.

Bez tohoto oprávnění vrátí `/api/voice/session` 502 a v prohlížeči se objeví
„Hovor se nepodařilo spojit", přestože `/api/health` hlásí `voice: configured`
— ten kontroluje jen to, že oba secrets nejsou prázdné, ne co klíč smí.

Volitelně nastavte i **User → Access**. Pro hovor to potřeba není, ale
diagnostický krok v CI tím ověřuje platnost samotného klíče; bez toho jeho
první řádek hlásí 401, což vypadá poplašně a nic neznamená.

Ostatní oprávnění (Text to Speech, Voices, …) hlasový agent nepotřebuje.

> Volbu **Auto-disable if leaked** nechte zapnutou. Tento repozitář je veřejný;
> klíč patří výhradně do GitHub Secrets a nikdy do souboru v repozitáři.

Pak spusťte deploy (Actions → Deploy Galactic Dent → Run workflow).
Ověření: `curl https://galactic.swipescape.eu/api/health` musí vrátit
`"voice":"configured"`. Dokud tam je `not-configured`, tlačítko hovoru se na
webu vůbec nezobrazí.

## 3. First message

```
Dobrý den, tady asistentka kliniky Galactic Dent. Co pro vás mohu udělat?
```

## 4. System prompt

```
Jsi hlasová asistentka zubní kliniky Galactic Dent v Karlových Varech.
Mluvíš s pacientem telefonicky, takže odpovídej krátce — dvě až tři věty.
Mluv jazykem, kterým mluví pacient (čeština, ukrajinština nebo ruština).

Fakta, která smíš uvádět. Nic jiného si nevymýšlej:
- Adresa: Dr. Přemysla Jeřábka 1093/13, Rybáře, 360 05 Karlovy Vary
- Telefon: +420 352 308 111
- Ordinační hodiny: Po–Čt 8:00–17:00, Pá 8:00–14:00, o víkendu zavřeno
- Lékař: MDDr. Dmytro Galaktionov, člen České stomatologické komory
- Pojišťovny: VZP, OZP, ZP MV ČR a další
- Ze Sokolova je to zhruba 20 minut autem po silnici 6
- Mluvíme česky, ukrajinsky a rusky

Co umíš:
1. Odpovědět na dotazy k ordinačním hodinám, adrese, cestě a pojišťovnám.
2. Objednat pacienta na termín. Postup: zeptej se, o jaký typ návštěvy jde,
   pak nabídni volné termíny (nástroj najdi_terminy), nech pacienta vybrat,
   vyžádej si jméno a telefon a rezervaci potvrď (nástroj objednej).
   Termín, jméno i telefon pacientovi zopakuj nahlas dřív, než potvrdíš.
3. U akutní bolesti: projev pochopení a hledej nejbližší akutní termín.
   Pokud žádný není, řekni, že se ozve asistentka, a doporuč zavolat na
   +420 352 308 111.

Pravidla, která nesmíš porušit:
- Nikdy nestanovuj diagnózu a nedoporučuj léčbu. Symptomy nehodnoť.
  Pacienta vždy nasměruj na vyšetření.
- Nikdy neuváděj ceny. Řekni, že závaznou cenu sdělí lékař po vyšetření,
  vždy před zákrokem.
- Neznáš-li odpověď, přiznej to a nabídni telefon do ordinace.
- Nikdy neslibuj termín, který ti nevrátil nástroj najdi_terminy.
```

## 5. Nástroje (tools) — volitelné, ale bez nich agent neumí objednat

V nastavení agenta → **Tools** → **Add tool** → typ **Webhook**.

### najdi_terminy

- **Method**: `GET`
- **URL**: `https://galactic.swipescape.eu/api/voice/slots`
- **Query parameters** (všechny nepovinné):
  - `sluzba` (string) — slovo, které řekl pacient: `prohlídka`, `plomba`,
    `akutní`. Diakritika se ignoruje, stačí část názvu.
  - `akutni` (string) — `true` u akutní bolesti; vrátí nejbližší akutní termíny
    za sebou místo rozptylu přes týden.
  - `dny` (string) — kolik dní dopředu hledat, výchozí 14, maximum 60.
- **Description pro model**: „Vrátí volné termíny. Použij vždy, než pacientovi
  nabídneš termín — nikdy termín nevymýšlej. Pole `popis` je věta, kterou máš
  přečíst nahlas. Pole `visitTypeId`, `date`, `timeStart` a `timeEnd` předej
  beze změny nástroji objednej. Pole `dnes` je dnešní datum — používej ho,
  když chceš říct „zítra" nebo „příští týden"."

Odpověď vypadá takto:

```json
{
  "dnes": "2026-08-01",
  "typNavstevy": { "id": "cmrz…", "nazev": "Preventivní prohlídka" },
  "celkemVolnych": 56,
  "volneTerminy": [
    { "popis": "pondělí 3. srpna v 9:20", "visitTypeId": "cmrz…",
      "date": "2026-08-03", "timeStart": "09:20", "timeEnd": "09:40" }
  ]
}
```

Proč vlastní endpoint a ne `/api/availability`: ten vrací všech 56 termínů,
bere neprůhledné id typu návštěvy a nezná dnešní datum. Pro kalendář je
správný, pro mluvící agenta nepoužitelný. Tenhle vrací nejvýš šest nabídek,
každou z jiného dne, aby měl pacient z čeho vybírat.

### objednej

Objednání je dvoukrokové, protože pacienta je nejdřív potřeba založit:

1. `POST https://galactic.swipescape.eu/api/patients/find-or-create`
   s tělem `{ "fullName": "...", "phone": "...", "language": "CZ" }`
   → vrátí pacienta včetně `id`
2. `POST https://galactic.swipescape.eu/api/appointments`
   s tělem `{ "patientId": "...", "visitTypeId": "...", "date": "YYYY-MM-DD",
   "timeStart": "HH:MM", "timeEnd": "HH:MM", "sourceChannel": "WEB" }`

> **Než tyto nástroje zapnete, přečtěte si poznámku o zabezpečení níže.**

## Zabezpečení — přečíst před ostrým provozem

API kliniky zatím **nemá žádnou autentizaci**. To znamená:

- kdokoli, kdo zná adresu, může přes `/api/appointments` založit rezervaci na
  libovolné jméno a telefon;
- kdokoli si může přes `/api/patients` stáhnout seznam pacientů.

Hlasový agent tuto díru nevytváří — jen ji začne používat. Dokud v databázi
jsou jen ukázková data, je to přijatelné pro předvedení. **Před prvním
skutečným pacientem je nutné API uzavřít** a nástroje agenta autorizovat
sdíleným tokenem.

## Náklady

ElevenLabs účtuje hlasové hovory po minutách. Tlačítko „Zavolat asistentce" je
na veřejném webu, takže hovor může spustit kdokoli. Backend proto povoluje
**nejvýše 5 zahájených hovorů z jedné IP adresy za 10 minut**
(`backend/src/routes/voice.ts`). Není to bezpečnostní opatření, jen pojistka
proti nechtěnému účtu — pro ostrý provoz doporučuji nastavit v ElevenLabs
i limit délky hovoru a měsíční strop kreditů.
