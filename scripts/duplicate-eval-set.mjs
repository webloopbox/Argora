// Zbiór zgłoszeń do ewaluacji detekcji duplikatów (praca_pisemna.md, §7.2/7.3).
//
// Każde zgłoszenie: treść nowej wypowiedzi + deklarowana strona sporu +
// debata, w której jest składana, oraz wynik oczekiwany - albo fragment
// treści argumentu, który system powinien wskazać jako pierwowzór (expected),
// albo `null`, gdy oczekiwany jest brak wykrycia.
//
// Kategorie:
//   "latwy_pozytywny"    - bliska parafraza istniejącego argumentu
//   "latwy_negatywny"    - treść niezwiązana z żadnym istniejącym argumentem
//   "trudny_negatywny"   - temat pokrewny istniejącemu argumentowi, ale
//                          odrębna, samodzielna teza; test fałszywego alarmu
//                          (ograniczenie miary kosinusowej, §2.6.2)
//   "wielokrotne_podobienstwo" - debata zawiera więcej niż jeden podobny
//                          argument (D1/D2 w debacie "Studenci"); testuje
//                          poprawność WSKAZANIA, nie tylko wykrycia
//
// `expected` to unikalny fragment treści (nie cały tekst), używany przez
// eval-duplicate-detection.mjs do odnalezienia właściwego wiersza w bazie.

export const DEBATES = {
  studenci: "9d4f85f8-723c-4bc3-9506-e103f7a261ce",
  pracaZdalna: "70d2279c-4614-4bd8-b5ee-19d717a7f3bf",
  energiaJadrowa: "8b8230e5-6b18-4b04-9c2b-39602b4bc77e",
};

export const submissions = [
  // ─── Debata: Studenci i generatywna AI ──────────────────────────────────
  {
    debate: "studenci",
    side: "pro",
    content:
      "AI to zwyczajne narzędzie pracy badawczej, podobne do wyszukiwarki internetowej - usprawnia zbieranie materiałów, dzięki czemu student może poświęcić więcej uwagi analizie krytycznej zamiast technicznemu formatowaniu tekstu.",
    expected: "Generatywna AI to po prostu kolejne narzędzie pracy",
    category: "latwy_pozytywny",
  },
  {
    debate: "studenci",
    side: "against",
    content:
      "Modele językowe potrafią z przekonaniem podawać źródła naukowe, które w rzeczywistości nie istnieją, co niszczy rzetelność warsztatu badawczego młodych naukowców.",
    expected: "Modele generują przekonująco brzmiące, ale nieistniejące źródła",
    category: "latwy_pozytywny",
  },
  {
    debate: "studenci",
    side: "pro",
    content:
      "Praca z AI uczy studentów formułowania precyzyjnych poleceń (prompt engineering), co samo w sobie jest kompetencją cenioną dziś na rynku pracy, niezależnie od samej pracy dyplomowej.",
    expected: null,
    category: "latwy_negatywny",
  },
  {
    debate: "studenci",
    side: "against",
    content:
      "Zakaz używania AI trudno wyegzekwować, bo detektory tekstu generowanego dają zbyt wiele fałszywych alarmów, przez co niesłusznie oskarżają uczciwych studentów o oszustwo.",
    expected: null,
    category: "trudny_negatywny",
  },
  {
    debate: "studenci",
    side: "pro",
    content:
      "Generatywna AI pomaga podzielić pisanie pracy dyplomowej na konkretne, mniejsze etapy i zbudować realistyczny harmonogram, co ułatwia zarządzanie tak dużym projektem badawczym.",
    expected: "pomaga rozbić pracę dyplomową na mniejsze, zarządzalne etapy",
    decoyExpected: "łatwiej zaplanować harmonogram pisania pracy dyplomowej",
    category: "wielokrotne_podobienstwo",
  },
  {
    debate: "studenci",
    side: "against",
    content:
      "Nie sposób ustalić, czy dyplom odzwierciedla umiejętności absolwenta, skoro nie wiadomo, w jakim stopniu tekst powstał bez udziału maszyny.",
    expected: "Korzystanie z AI podważa rzetelność oceny",
    category: "latwy_pozytywny",
    note: "słownictwo niemal całkowicie rozłączne z pierwowzorem - test §2.6.2",
  },

  // ─── Debata: Praca zdalna ────────────────────────────────────────────────
  {
    debate: "pracaZdalna",
    side: "pro",
    content:
      "Zdalny tryb pracy podnosi wydajność deweloperów, bo eliminuje ciągłe przerywanie charakterystyczne dla biur typu open space i umożliwia dłuższe okresy nieprzerwanej koncentracji.",
    expected: "Praca zdalna zwiększa produktywność programistów",
    category: "latwy_pozytywny",
  },
  {
    debate: "pracaZdalna",
    side: "against",
    content:
      "Zdalna organizacja pracy utrudnia kształtowanie wspólnej kultury firmowej i sprawia, że wdrożenie mniej doświadczonych pracowników staje się trudniejsze.",
    expected: "Praca zdalna osłabia budowanie kultury organizacyjnej",
    category: "latwy_pozytywny",
  },
  {
    debate: "pracaZdalna",
    side: "against",
    content:
      "Praca zdalna utrudnia egzekwowanie jednolitych standardów bezpieczeństwa danych, ponieważ firma traci kontrolę nad siecią domową i sprzętem, z którego korzysta pracownik.",
    expected: null,
    category: "latwy_negatywny",
  },
  {
    debate: "pracaZdalna",
    side: "against",
    content: "Zdalna praca niszczy kulturę firmy.",
    expected: "Praca zdalna osłabia budowanie kultury organizacyjnej",
    category: "latwy_pozytywny",
    note: "bardzo krótka wypowiedź (5 słów) - test stabilności reprezentacji, §2.6.2",
  },
  {
    debate: "pracaZdalna",
    side: "pro",
    content:
      "Możliwość pracy z dowolnego miejsca pozwala pracownikom przenieść się do tańszych lokalizacji, co realnie zwiększa ich siłę nabywczą przy tej samej pensji.",
    expected: null,
    category: "trudny_negatywny",
  },
  {
    debate: "pracaZdalna",
    side: "pro",
    content:
      "Zespoły rozproszone geograficznie mogą pracować w trybie 'follow the sun', przekazując zadania między strefami czasowymi i skracając czas realizacji krytycznych poprawek.",
    expected: null,
    category: "latwy_negatywny",
  },

  // ─── Debata: Energia jądrowa ─────────────────────────────────────────────
  {
    debate: "energiaJadrowa",
    side: "against",
    content:
      "Nie ma dziś rozwiązanego problemu długoterminowego, bezpiecznego składowania wysoce radioaktywnych odpadów pojądrowych - kwestia ta pozostaje otwarta na tysiąclecia.",
    expected: "Problem składowania odpadów wysokoaktywnych pozostaje nierozwiązany",
    category: "latwy_pozytywny",
  },
  {
    debate: "energiaJadrowa",
    side: "pro",
    content:
      "Elektrownia jądrowa podczas normalnej pracy nie wytwarza emisji CO2, dzięki czemu stanowi wiarygodną alternatywę wobec elektrowni opalanych węglem.",
    expected: "Reaktor jądrowy nie emituje dwutlenku węgla podczas pracy",
    category: "latwy_pozytywny",
  },
  {
    debate: "energiaJadrowa",
    side: "against",
    content:
      "Budowa elektrowni jądrowej wymaga dostępu do dużych ilości wody chłodzącej, co w warunkach coraz częstszych susz może w przyszłości ograniczać jej dostępną moc.",
    expected: null,
    category: "latwy_negatywny",
  },
  {
    debate: "energiaJadrowa",
    side: "pro",
    content:
      "Elektrownie jądrowe dają wysokopłatne miejsca pracy wymagające wieloletnich kwalifikacji, co wspiera rozwój lokalnego zaplecza naukowo-technicznego wokół inwestycji.",
    expected: null,
    category: "latwy_negatywny",
  },
  {
    debate: "energiaJadrowa",
    side: "against",
    content:
      "Elektrownie jądrowe finansowane długiem publicznym generują ryzyko dla ratingu kredytowego państwa, niezależnie od tego, czy finalny koszt budowy zmieści się w pierwotnym budżecie.",
    expected: null,
    category: "trudny_negatywny",
  },
];
