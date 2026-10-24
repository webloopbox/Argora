// Labelled submission set for evaluating duplicate detection.
//
// Each submission carries the text of a new argument, the side it declares,
// the debate it is filed in, and the expected outcome: either a fragment of
// the argument the system should point at (`expected`), or `null` when it
// should detect nothing.
//
// Categories:
//   "easy_positive"    - a close paraphrase of an existing argument
//   "easy_negative"    - content unrelated to any existing argument
//   "hard_negative"    - a topic adjacent to an existing argument, but a
//                        separate claim of its own; this probes false alarms,
//                        where cosine similarity is weakest
//   "multiple_similar" - the debate holds more than one similar argument
//                        (D1/D2 in the "Studenci" debate), so this probes
//                        WHICH argument gets named, not only that one was
//
// `expected` is a unique fragment of the content rather than the whole text.
// eval-duplicate-detection.mjs uses it to find the right row in the database.

export const DEBATES = {
  studenci: "9d4f85f8-723c-4bc3-9506-e103f7a261ce",
  pracaZdalna: "70d2279c-4614-4bd8-b5ee-19d717a7f3bf",
  energiaJadrowa: "8b8230e5-6b18-4b04-9c2b-39602b4bc77e",
};

export const submissions = [
  // ─── Debate: students and generative AI ──────────────────────────────────
  {
    debate: "studenci",
    side: "pro",
    content:
      "AI to zwyczajne narzędzie pracy badawczej, podobne do wyszukiwarki internetowej - usprawnia zbieranie materiałów, dzięki czemu student może poświęcić więcej uwagi analizie krytycznej zamiast technicznemu formatowaniu tekstu.",
    expected: "Generatywna AI to po prostu kolejne narzędzie pracy",
    category: "easy_positive",
  },
  {
    debate: "studenci",
    side: "against",
    content:
      "Modele językowe potrafią z przekonaniem podawać źródła naukowe, które w rzeczywistości nie istnieją, co niszczy rzetelność warsztatu badawczego młodych naukowców.",
    expected: "Modele generują przekonująco brzmiące, ale nieistniejące źródła",
    category: "easy_positive",
  },
  {
    debate: "studenci",
    side: "pro",
    content:
      "Praca z AI uczy studentów formułowania precyzyjnych poleceń (prompt engineering), co samo w sobie jest kompetencją cenioną dziś na rynku pracy, niezależnie od samej pracy dyplomowej.",
    expected: null,
    category: "easy_negative",
  },
  {
    debate: "studenci",
    side: "against",
    content:
      "Zakaz używania AI trudno wyegzekwować, bo detektory tekstu generowanego dają zbyt wiele fałszywych alarmów, przez co niesłusznie oskarżają uczciwych studentów o oszustwo.",
    expected: null,
    category: "hard_negative",
  },
  {
    debate: "studenci",
    side: "pro",
    content:
      "Generatywna AI pomaga podzielić pisanie pracy dyplomowej na konkretne, mniejsze etapy i zbudować realistyczny harmonogram, co ułatwia zarządzanie tak dużym projektem badawczym.",
    expected: "pomaga rozbić pracę dyplomową na mniejsze, zarządzalne etapy",
    decoyExpected: "łatwiej zaplanować harmonogram pisania pracy dyplomowej",
    category: "multiple_similar",
  },
  {
    debate: "studenci",
    side: "against",
    content:
      "Nie sposób ustalić, czy dyplom odzwierciedla umiejętności absolwenta, skoro nie wiadomo, w jakim stopniu tekst powstał bez udziału maszyny.",
    expected: "Korzystanie z AI podważa rzetelność oceny",
    category: "easy_positive",
    note: "vocabulary almost disjoint from the original, leaving cosine little lexical overlap to lean on",
  },

  // ─── Debate: remote work ────────────────────────────────────────────────
  {
    debate: "pracaZdalna",
    side: "pro",
    content:
      "Zdalny tryb pracy podnosi wydajność deweloperów, bo eliminuje ciągłe przerywanie charakterystyczne dla biur typu open space i umożliwia dłuższe okresy nieprzerwanej koncentracji.",
    expected: "Praca zdalna zwiększa produktywność programistów",
    category: "easy_positive",
  },
  {
    debate: "pracaZdalna",
    side: "against",
    content:
      "Zdalna organizacja pracy utrudnia kształtowanie wspólnej kultury firmowej i sprawia, że wdrożenie mniej doświadczonych pracowników staje się trudniejsze.",
    expected: "Praca zdalna osłabia budowanie kultury organizacyjnej",
    category: "easy_positive",
  },
  {
    debate: "pracaZdalna",
    side: "against",
    content:
      "Praca zdalna utrudnia egzekwowanie jednolitych standardów bezpieczeństwa danych, ponieważ firma traci kontrolę nad siecią domową i sprzętem, z którego korzysta pracownik.",
    expected: null,
    category: "easy_negative",
  },
  {
    debate: "pracaZdalna",
    side: "against",
    content: "Zdalna praca niszczy kulturę firmy.",
    expected: "Praca zdalna osłabia budowanie kultury organizacyjnej",
    category: "easy_positive",
    note: "very short submission, five words, which probes how stable the representation stays",
  },
  {
    debate: "pracaZdalna",
    side: "pro",
    content:
      "Możliwość pracy z dowolnego miejsca pozwala pracownikom przenieść się do tańszych lokalizacji, co realnie zwiększa ich siłę nabywczą przy tej samej pensji.",
    expected: null,
    category: "hard_negative",
  },
  {
    debate: "pracaZdalna",
    side: "pro",
    content:
      "Zespoły rozproszone geograficznie mogą pracować w trybie 'follow the sun', przekazując zadania między strefami czasowymi i skracając czas realizacji krytycznych poprawek.",
    expected: null,
    category: "easy_negative",
  },

  // ─── Debate: nuclear power ─────────────────────────────────────────────
  {
    debate: "energiaJadrowa",
    side: "against",
    content:
      "Nie ma dziś rozwiązanego problemu długoterminowego, bezpiecznego składowania wysoce radioaktywnych odpadów pojądrowych - kwestia ta pozostaje otwarta na tysiąclecia.",
    expected: "Problem składowania odpadów wysokoaktywnych pozostaje nierozwiązany",
    category: "easy_positive",
  },
  {
    debate: "energiaJadrowa",
    side: "pro",
    content:
      "Elektrownia jądrowa podczas normalnej pracy nie wytwarza emisji CO2, dzięki czemu stanowi wiarygodną alternatywę wobec elektrowni opalanych węglem.",
    expected: "Reaktor jądrowy nie emituje dwutlenku węgla podczas pracy",
    category: "easy_positive",
  },
  {
    debate: "energiaJadrowa",
    side: "against",
    content:
      "Budowa elektrowni jądrowej wymaga dostępu do dużych ilości wody chłodzącej, co w warunkach coraz częstszych susz może w przyszłości ograniczać jej dostępną moc.",
    expected: null,
    category: "easy_negative",
  },
  {
    debate: "energiaJadrowa",
    side: "pro",
    content:
      "Elektrownie jądrowe dają wysokopłatne miejsca pracy wymagające wieloletnich kwalifikacji, co wspiera rozwój lokalnego zaplecza naukowo-technicznego wokół inwestycji.",
    expected: null,
    category: "easy_negative",
  },
  {
    debate: "energiaJadrowa",
    side: "against",
    content:
      "Elektrownie jądrowe finansowane długiem publicznym generują ryzyko dla ratingu kredytowego państwa, niezależnie od tego, czy finalny koszt budowy zmieści się w pierwotnym budżecie.",
    expected: null,
    category: "hard_negative",
  },
];
