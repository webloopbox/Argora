export interface PublicDebatePreview {
  id: string;
  thesis: string;
  authorName: string;
  proCount: number;
  againstCount: number;
  updatedLabel: string;
}

export const mockPublicDebates: PublicDebatePreview[] = [
  {
    id: "d-1",
    thesis:
      "Praca zdalna na stałe zwiększa produktywność zespołów inżynieryjnych.",
    authorName: "Marta K.",
    proCount: 12,
    againstCount: 8,
    updatedLabel: "2 godz. temu",
  },
  {
    id: "d-2",
    thesis:
      "Argumenty generowane przez AI w debatach muszą być oznaczone etykietą.",
    authorName: "Jan P.",
    proCount: 34,
    againstCount: 5,
    updatedLabel: "30 min temu",
  },
  {
    id: "d-3",
    thesis:
      "Energia jądrowa jest niezbędna, aby Polska osiągnęła neutralność klimatyczną do 2050 roku.",
    authorName: "Aneta L.",
    proCount: 47,
    againstCount: 31,
    updatedLabel: "wczoraj",
  },
  {
    id: "d-4",
    thesis:
      "Czterodniowy tydzień pracy powinien stać się standardem w sektorze publicznym.",
    authorName: "Piotr W.",
    proCount: 21,
    againstCount: 14,
    updatedLabel: "4 godz. temu",
  },
  {
    id: "d-5",
    thesis:
      "Centra dużych miast powinny być całkowicie wolne od ruchu samochodowego.",
    authorName: "Zuzanna M.",
    proCount: 18,
    againstCount: 22,
    updatedLabel: "wczoraj",
  },
  {
    id: "d-6",
    thesis:
      "Obowiązkowy code review w projektach publicznych zwiększa zaufanie do technologii państwa.",
    authorName: "Tomasz B.",
    proCount: 9,
    againstCount: 3,
    updatedLabel: "6 godz. temu",
  },
];

export const dashboardStats = {
  activeDebates: 1247,
  participants: 18_930,
  arguments: 58_412,
  votes: 182_301,
} as const;
