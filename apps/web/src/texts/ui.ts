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
    loading: "Wczytuję dyskusje…",
    loadFailed: "Nie udało się wczytać dyskusji. Spróbuj odświeżyć stronę.",
    emptyTitle: "Brak publicznych dyskusji",
    emptyBody:
      "Bądź pierwszą osobą, która rozpocznie debatę widoczną dla całej społeczności.",
    emptyCta: "Rozpocznij pierwszą dyskusję",
  },
  sides: {
    pro: "Za",
    against: "Przeciw",
  },
  debates: {
    create: {
      title: "Nowa dyskusja",
      subtitle:
        "Sformułuj tezę i wybierz, kto może w niej uczestniczyć. Dobrze postawiona teza zaprasza do polemiki.",
      thesisLabel: "Teza",
      thesisPlaceholder:
        "np. Praca zdalna na stałe zwiększa produktywność zespołów inżynieryjnych.",
      thesisHint: "Od 8 do 280 znaków. Sformułuj jako jedno, klarowne stwierdzenie.",
      visibilityLabel: "Widoczność",
      visibilityPublic: "Publiczna",
      visibilityPublicHint: "Dyskusja widoczna dla wszystkich, uczestniczyć mogą zalogowani.",
      visibilityPrivate: "Prywatna",
      visibilityPrivateHint: "Dostępna tylko dla wybranej grupy.",
      visibilityPrivateLocked: "Dostępne po utworzeniu lub dołączeniu do grupy (już wkrótce).",
      submit: "Utwórz dyskusję",
      submitting: "Tworzę dyskusję…",
      cancel: "Anuluj",
      genericError: "Nie udało się utworzyć dyskusji. Spróbuj ponownie.",
      thesisTooShort: "Teza musi mieć co najmniej 8 znaków.",
      thesisTooLong: "Teza nie może przekraczać 280 znaków.",
    },
    detail: {
      backToFeed: "Wróć do listy dyskusji",
      authorEyebrow: "Autor",
      privateBadge: "Prywatna",
      publicBadge: "Publiczna",
      argumentsLabel: "Argumenty",
      proLabel: "Za",
      againstLabel: "Przeciw",
      graphLoading: "Wczytuję argumenty…",
      graphLoadFailed: "Nie udało się wczytać argumentów.",
      graphEmptyTitle: "Drzewo argumentów jest puste",
      graphEmptyBody:
        "Rozpocznij debatę — dodaj pierwszy argument Za lub Przeciw tezie.",
      loading: "Wczytuję dyskusję…",
      notFoundTitle: "Nie znaleziono dyskusji",
      notFoundBody:
        "Dyskusja mogła zostać zarchiwizowana albo nigdy nie istniała.",
      forbiddenTitle: "Brak dostępu",
      forbiddenBody:
        "Ta dyskusja jest prywatna. Poproś właściciela grupy o zaproszenie.",
      loadFailed: "Nie udało się wczytać dyskusji.",
    },
    graph: {
      thesisBadge: "Teza",
      aiBadge: "AI",
      addPro: "Dodaj argument Za",
      addAgainst: "Dodaj argument Przeciw",
      selectionHint:
        "Klikasz argument, aby przygotować kontrargument do niego.",
      thesisSelectedHint: "Argument dodajesz bezpośrednio pod tezą.",
      replyingToEyebrow: "Odpowiadasz na",
      changeParent: "Zmień",
      attachToThesis: "Wróć do tezy",
    },
    argumentForm: {
      panelTitle: "Dodaj argument",
      panelSubtitle:
        "Krótkie, rzeczowe argumenty czyta się najlepiej. Pamiętaj, że Twój głos kształtuje wagę dyskusji.",
      sideLabel: "Strona",
      sidePro: "Za",
      sideAgainst: "Przeciw",
      contentLabel: "Treść argumentu",
      contentPlaceholder:
        "np. Praca zdalna ułatwia rekrutację specjalistów z całego świata, co poszerza pulę talentów.",
      submitPro: "Dodaj argument Za",
      submitAgainst: "Dodaj argument Przeciw",
      submitting: "Dodaję…",
      cancel: "Anuluj",
      requiresLogin:
        "Zaloguj się, aby dodawać argumenty do publicznej dyskusji.",
      signIn: "Zaloguj się",
      contentTooShort: "Argument musi mieć co najmniej 4 znaki.",
      contentTooLong: "Argument nie może przekraczać 2000 znaków.",
      genericError: "Nie udało się dodać argumentu. Spróbuj ponownie.",
    },
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
