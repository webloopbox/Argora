export const ui = {
  app: {
    name: "Brainstorm",
    tagline: "Wizualna przestrzeń do debat.",
  },
  nav: {
    discover: "Odkrywaj",
    groups: "Grupy",
    invitations: "Zaproszenia",
  },
  auth: {
    signIn: "Zaloguj się",
    signOut: "Wyloguj",
    account: "Moje konto",
    signInToParticipate: "Zaloguj się, aby uczestniczyć",
  },
  dashboard: {
    heroEyebrow: "Publiczne dyskusje",
    heroTitle: "Debatuj, argumentuj, zmieniaj zdania.",
    heroTitleAccent: "zmieniaj zdania.",
    heroSubtitle:
      "Otwarta przestrzeń do głośnego myślenia. Dołącz do rozmowy albo rozpocznij własną.",
    startDebate: "Rozpocznij dyskusję",
    browseFeed: "Przeglądaj feed",
    guestBanner:
      "Przeglądasz jako gość. Możesz czytać każdą publiczną dyskusję, ale dodawanie argumentów wymaga zalogowania.",
    stats: {
      activeDebates: "Aktywne dyskusje",
      participants: "Uczestnicy",
      arguments: "Argumenty",
      votes: "Oddane głosy",
    },
    filters: {
      hottest: "Najgorętsze",
      newest: "Najnowsze",
      mostDivisive: "Najbardziej sporne",
    },
    cardOpenParticipate: "Otwórz i dołącz",
    cardViewReadOnly: "Zobacz (tylko odczyt)",
  },
  sides: {
    pro: "Za",
    against: "Przeciw",
  },
  groups: {
    pageTitle: "Grupy prywatne",
    pageSubtitle:
      "Dyskusje zamknięte w gronie zaproszonych osób. Wejdź do grupy, do której należysz, albo poproś właściciela o zaproszenie.",
    emptyTitle: "Nie należysz jeszcze do żadnej grupy",
    emptyBody:
      "Poproś znajomego właściciela grupy, aby dodał Twoje konto. Zaproszenie pojawi się w zakładce Zaproszenia.",
  },
  invitations: {
    pageTitle: "Zaproszenia",
    pageSubtitle:
      "Właściciele grup mogą zaprosić Twoje konto do prywatnych dyskusji. Zaproszenie trafia tutaj i wymaga Twojego potwierdzenia.",
    emptyTitle: "Brak oczekujących zaproszeń",
    emptyBody:
      "Gdy ktoś zaprosi Cię do prywatnej grupy, pojawi się to w tym miejscu.",
  },
  common: {
    comingSoon: "W przygotowaniu",
  },
} as const;
