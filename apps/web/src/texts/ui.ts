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
    login: {
      title: "Zaloguj się",
      subtitle: "Wróć do swoich dyskusji.",
      emailLabel: "Adres e-mail",
      emailPlaceholder: "ty@example.com",
      passwordLabel: "Hasło",
      passwordPlaceholder: "Twoje hasło",
      submit: "Zaloguj się",
      submitting: "Logowanie…",
      switchPrompt: "Nie masz jeszcze konta?",
      switchAction: "Zarejestruj się",
      invalidCredentials: "Niepoprawny e-mail lub hasło.",
      genericError: "Nie udało się zalogować. Spróbuj ponownie.",
    },
    register: {
      title: "Załóż konto",
      subtitle: "Stwórz miejsce dla swoich debat w kilka sekund.",
      displayNameLabel: "Nazwa wyświetlana",
      displayNamePlaceholder: "np. Ola Kowalska",
      emailLabel: "Adres e-mail",
      emailPlaceholder: "ty@example.com",
      passwordLabel: "Hasło",
      passwordPlaceholder: "Minimum 8 znaków",
      submit: "Załóż konto",
      submitting: "Tworzenie konta…",
      switchPrompt: "Masz już konto?",
      switchAction: "Zaloguj się",
      emailTaken: "Konto z tym adresem e-mail już istnieje.",
      genericError: "Nie udało się utworzyć konta. Spróbuj ponownie.",
    },
    validation: {
      required: "To pole jest wymagane.",
      emailInvalid: "Podaj poprawny adres e-mail.",
      passwordTooShort: "Hasło musi mieć co najmniej 8 znaków.",
      displayNameTooShort: "Nazwa musi mieć co najmniej 2 znaki.",
    },
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
