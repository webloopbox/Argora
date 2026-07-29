// ---------------------------------------------------------------------------
// ui.ts – all UI strings for both Polish (pl) and English (en).
// The exported `ui` object is a deep Proxy that reads from the active locale.
// Switch locale at runtime with setGlobalLanguage() and re-render React tree.
// ---------------------------------------------------------------------------

export type Lang = "pl" | "en";

const STORAGE_KEY = "brainstorm.lang";

function detectInitialLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "pl" || stored === "en") return stored;
  } catch {
    /* ignored */
  }
  return "pl";
}

let _lang: Lang = detectInitialLang();

export function getGlobalLanguage(): Lang {
  return _lang;
}

export function setGlobalLanguage(lang: Lang): void {
  _lang = lang;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignored */
  }
}

// ---------------------------------------------------------------------------
// Contract – define the shape first, both locales implement it independently.
// ---------------------------------------------------------------------------
export interface UiDict {
  app: {
    name: string;
    tagline: string;
  };
  nav: {
    discover: string;
    groups: string;
    invitations: string;
  };
  auth: {
    signIn: string;
    signOut: string;
    account: string;
    signInToParticipate: string;
    login: {
      title: string;
      subtitle: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submit: string;
      submitting: string;
      switchPrompt: string;
      switchAction: string;
      invalidCredentials: string;
      genericError: string;
    };
    register: {
      title: string;
      subtitle: string;
      displayNameLabel: string;
      displayNamePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submit: string;
      submitting: string;
      switchPrompt: string;
      switchAction: string;
      emailTaken: string;
      genericError: string;
    };
    validation: {
      required: string;
      emailInvalid: string;
      passwordTooShort: string;
      displayNameTooShort: string;
    };
  };
  dashboard: {
    heroEyebrow: string;
    heroTitle: string;
    heroTitleAccent: string;
    heroSubtitle: string;
    startDebate: string;
    browseFeed: string;
    guestBanner: string;
    stats: {
      activeDebates: string;
      participants: string;
      arguments: string;
      votes: string;
    };
    filters: {
      hottest: string;
      newest: string;
      mostDivisive: string;
    };
    cardOpenParticipate: string;
    cardManage: string;
    cardViewReadOnly: string;
    loading: string;
    loadFailed: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
  };
  sides: {
    pro: string;
    against: string;
  };
  debates: {
    create: {
      title: string;
      subtitle: string;
      thesisLabel: string;
      thesisPlaceholder: string;
      thesisHint: string;
      visibilityLabel: string;
      visibilityPublic: string;
      visibilityPublicHint: string;
      visibilityPrivate: string;
      visibilityPrivateHint: string;
      visibilityPrivateLocked: string;
      languageLabel: string;
      languageHint: string;
      languagePl: string;
      languageEn: string;
      submit: string;
      submitting: string;
      cancel: string;
      genericError: string;
      thesisTooShort: string;
      thesisTooLong: string;
      backToGroup: string;
      inGroupEyebrow: string;
      inGroupHint: string;
      groupContextFailed: string;
      privateNeedsGroup: string;
    };
    detail: {
      backToFeed: string;
      authorEyebrow: string;
      privateBadge: string;
      publicBadge: string;
      argumentsLabel: string;
      proLabel: string;
      againstLabel: string;
      graphLoading: string;
      graphLoadFailed: string;
      graphEmptyTitle: string;
      graphEmptyBody: string;
      loading: string;
      notFoundTitle: string;
      notFoundBody: string;
      forbiddenTitle: string;
      forbiddenBody: string;
      loadFailed: string;
      deleteAriaLabel: string;
      deleteConfirm: string;
      deleteFailed: string;
    };
    graph: {
      thesisBadge: string;
      aiBadge: string;
      addPro: string;
      addAgainst: string;
      selectionHint: string;
      thesisSelectedHint: string;
      replyingToEyebrow: string;
      changeParent: string;
      attachToThesis: string;
      parentShowMore: string;
      parentShowLess: string;
      sentimentPro: string;
      sentimentAgainst: string;
      sentimentControversy: string;
      sentimentNeutral: string;
      weightAriaLabel: string;
      voteWidgetAriaLabel: string;
      voteProActive: string;
      voteProInactive: string;
      voteAgainstActive: string;
      voteAgainstInactive: string;
      voteRequiresLogin: string;
      voteFailed: string;
      weightTooltip: string;
      deleteAriaLabel: string;
      deleteTooltipCan: string;
      deleteTooltipHasChildren: string;
      deleteConfirm: string;
      deleteFailed: string;
    };
    argumentForm: {
      panelTitle: string;
      panelSubtitle: string;
      sideLabel: string;
      sidePro: string;
      sideAgainst: string;
      contentLabel: string;
      contentPlaceholder: string;
      submitPro: string;
      submitAgainst: string;
      submitting: string;
      cancel: string;
      requiresLogin: string;
      signIn: string;
      contentTooShort: string;
      contentTooLong: string;
      genericError: string;
      aiToggleLabel: string;
      aiModelLabel: string;
      aiNoProviders: string;
      aiGenerateButton: string;
      aiGenerating: string;
      aiGenerateError: string;
      checkingDuplicate: string;
    };
    ai: {
      lassoToggle: string;
      lassoCancel: string;
      synthesizeButton: string;
      synthesisTitle: string;
      synthesisModelLabel: string;
      synthesisStart: string;
      synthesisSending: string;
      synthesisEmpty: string;
      synthesisError: string;
      synthesisClose: string;
      synthesisAgain: string;
      summarizeAll: string;
      synthesisFullTitle: string;
      summarizeAllSubtitle: string;
      argumentsSelectedSubtitle: string;
      duplicateTitle: string;
      duplicateSubtitle: string;
      duplicateOriginalLabel: string;
      duplicateNewLabel: string;
      duplicateMerge: string;
      duplicateNuance: string;
      duplicateMerging: string;
      sideMismatchTitle: string;
      sideMismatchSubtitle: string;
      sideMismatchYourContent: string;
      sideMismatchSelectedLabel: string;
      sideMismatchSuggestedLabel: string;
      sideMismatchSwitchToPro: string;
      sideMismatchSwitchToAgainst: string;
      sideMismatchKeep: string;
    };
  };
  groups: {
    pageTitle: string;
    pageSubtitle: string;
    createCta: string;
    createFirst: string;
    ownerBadge: string;
    ownerEyebrow: string;
    membersShort: string;
    debatesShort: string;
    openCta: string;
    loading: string;
    loadFailed: string;
    emptyTitle: string;
    emptyBody: string;
    create: {
      title: string;
      subtitle: string;
      nameLabel: string;
      namePlaceholder: string;
      submit: string;
      submitting: string;
      nameTooShort: string;
      nameTooLong: string;
      genericError: string;
    };
    detail: {
      eyebrow: string;
      backToList: string;
      ownedBy: string;
      createdAt: string;
      createDebate: string;
      archive: string;
      confirmArchive: string;
      archiveFailed: string;
      loading: string;
      notFoundTitle: string;
      notFoundBody: string;
      forbiddenTitle: string;
      forbiddenBody: string;
      errorTitle: string;
      errorBody: string;
      membersTitle: string;
      debatesTitle: string;
      debatesEmpty: string;
      argumentsShort: string;
      invitationsTitle: string;
      invitationsSubtitle: string;
      invitationsListTitle: string;
      invitationsListEmpty: string;
      inviteSubmit: string;
      inviteSubmitting: string;
      inviteConflict: string;
      inviteNoUser: string;
      inviteFailed: string;
    };
  };
  invitations: {
    pageTitle: string;
    pageSubtitle: string;
    emptyTitle: string;
    emptyBody: string;
    goToGroups: string;
    fromEyebrow: string;
    accept: string;
    decline: string;
    responding: string;
    respondError: string;
    loading: string;
    loadFailed: string;
    status: {
      pending: string;
      accepted: string;
      declined: string;
    };
  };
  users: {
    searchPlaceholder: string;
    searching: string;
    noResults: string;
    searchError: string;
    clearSelection: string;
  };
  common: {
    comingSoon: string;
    cancel: string;
    close: string;
  };
  toast: {
    networkError: string;
    serverError: string;
    forbidden: string;
    notFound: string;
    validationError: string;
    rateLimited: string;
    unknownError: string;
  };
  theme: {
    toggle: string;
    light: string;
    dark: string;
  };
  nav_aria: {
    openMenu: string;
    closeMenu: string;
  };
  language: {
    toggle: string;
    pl: string;
    en: string;
  };
}

// ---------------------------------------------------------------------------
// Polish
// ---------------------------------------------------------------------------
const pl: UiDict = {
  app: {
    name: "Argora",
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
      hottest: "Najbardziej dyskutowane",
      newest: "Najnowsze",
      mostDivisive: "Najbardziej sporne",
    },
    cardOpenParticipate: "Otwórz i dołącz",
    cardManage: "Zarządzaj",
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
      thesisHint:
        "Od 8 do 280 znaków. Sformułuj jako jedno, klarowne stwierdzenie.",
      visibilityLabel: "Widoczność",
      visibilityPublic: "Publiczna",
      visibilityPublicHint:
        "Dyskusja widoczna dla wszystkich, uczestniczyć mogą zalogowani.",
      visibilityPrivate: "Prywatna",
      visibilityPrivateHint: "Dostępna tylko dla wybranej grupy.",
      visibilityPrivateLocked:
        "Dostępne po utworzeniu lub dołączeniu do grupy (już wkrótce).",
      languageLabel: "Język dyskusji",
      languageHint:
        "Decyduje o języku argumentów i streszczeń tworzonych przez AI. Nie da się go później zmienić.",
      languagePl: "Polski",
      languageEn: "Angielski",
      submit: "Utwórz dyskusję",
      submitting: "Tworzę dyskusję…",
      cancel: "Anuluj",
      genericError: "Nie udało się utworzyć dyskusji. Spróbuj ponownie.",
      thesisTooShort: "Teza musi mieć co najmniej 8 znaków.",
      thesisTooLong: "Teza nie może przekraczać 280 znaków.",
      backToGroup: "Wróć do grupy",
      inGroupEyebrow: "Dyskusja w grupie prywatnej",
      inGroupHint: "Zostanie dodana do",
      groupContextFailed:
        "Nie udało się wczytać grupy. Możesz utworzyć dyskusję publiczną albo wrócić i spróbować ponownie.",
      privateNeedsGroup:
        "Dyskusję prywatną można utworzyć tylko z poziomu wybranej grupy.",
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
        "Rozpocznij debatę - dodaj pierwszy argument Za lub Przeciw tezie.",
      loading: "Wczytuję dyskusję…",
      notFoundTitle: "Nie znaleziono dyskusji",
      notFoundBody:
        "Dyskusja mogła zostać zarchiwizowana albo nigdy nie istniała.",
      forbiddenTitle: "Brak dostępu",
      forbiddenBody:
        "Ta dyskusja jest prywatna. Poproś właściciela grupy o zaproszenie.",
      loadFailed: "Nie udało się wczytać dyskusji.",
      deleteAriaLabel: "Usuń dyskusję",
      deleteConfirm:
        "Na pewno usunąć tę dyskusję? Usunięte zostaną również wszystkie umieszczone w niej argumenty.",
      deleteFailed: "Nie udało się usunąć dyskusji. Spróbuj ponownie.",
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
      parentShowMore: "Pokaż całość",
      parentShowLess: "Zwiń",
      sentimentPro: "Za przeważa",
      sentimentAgainst: "Przeciw przeważa",
      sentimentControversy: "Sporne",
      sentimentNeutral: "Brak głosów",
      weightAriaLabel: "waga",
      voteWidgetAriaLabel: "Głosy i waga argumentu",
      voteProActive: "Cofnij głos Za",
      voteProInactive: "Zagłosuj Za",
      voteAgainstActive: "Cofnij głos Przeciw",
      voteAgainstInactive: "Zagłosuj Przeciw",
      voteRequiresLogin: "Zaloguj się, aby głosować.",
      voteFailed: "Nie udało się oddać głosu.",
      weightTooltip:
        "Waga argumentu = głosy Za + głosy Przeciw. Każda reakcja zwiększa widoczność - niezależnie od kierunku. Kolor pokazuje dominujący sentyment.",
      deleteAriaLabel: "Usuń argument",
      deleteTooltipCan: "Usuń swój argument",
      deleteTooltipHasChildren:
        "Nie można usunąć argumentu, który ma już odpowiedzi. Najpierw usuń wszystkie odpowiedzi.",
      deleteConfirm: "Na pewno usunąć ten argument?",
      deleteFailed: "Nie udało się usunąć argumentu.",
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
      aiToggleLabel: "Wygeneruj przez AI",
      aiModelLabel: "Model",
      aiNoProviders: "Brak dostępnych modeli AI",
      aiGenerateButton: "Generuj",
      aiGenerating: "Generuję…",
      aiGenerateError: "Nie udało się wygenerować argumentu. Spróbuj ponownie.",
      checkingDuplicate: "Sprawdzam duplikaty…",
    },
    ai: {
      lassoToggle: "Zaznacz argumenty",
      lassoCancel: "Anuluj zaznaczenie",
      synthesizeButton: "Streść zaznaczony kontekst",
      synthesisTitle: "Streszczenie zaznaczonego kontekstu",
      synthesisModelLabel: "Model",
      synthesisStart: "Streść zaznaczony kontekst",
      synthesisSending: "Streszczam…",
      synthesisEmpty:
        "Zaznacz argumenty na grafie (lasso), a AI streści wybrany fragment dyskusji.",
      synthesisError:
        "Nie udało się przygotować streszczenia. Spróbuj ponownie.",
      synthesisClose: "Zamknij",
      synthesisAgain: "Streść ponownie",
      summarizeAll: "Streść całą dyskusję",
      synthesisFullTitle: "Pełne podsumowanie",
      summarizeAllSubtitle: "argumentów w dyskusji",
      argumentsSelectedSubtitle: "argumentów zaznaczonych",
      duplicateTitle: "Podobny argument już istnieje",
      duplicateSubtitle:
        "Wykryto argument o zbliżonym znaczeniu. Możesz wzmocnić istniejący głosem lub dodać swój argument jako nowy niuans.",
      duplicateOriginalLabel: "Istniejący argument",
      duplicateNewLabel: "Twój argument",
      duplicateMerge: "Połącz (dodaj głos)",
      duplicateNuance: "Dodaj jako niuans",
      duplicateMerging: "Łączę…",
      sideMismatchTitle: "Argument po drugiej stronie?",
      sideMismatchSubtitle:
        "AI wykryło, że treść Twojego argumentu logicznie odpowiada innej stronie debaty niż ta, którą zaznaczyłeś.",
      sideMismatchYourContent: "Twój argument",
      sideMismatchSelectedLabel: "Wybrana strona",
      sideMismatchSuggestedLabel: "Sugerowana strona",
      sideMismatchSwitchToPro: "Zmień na Za i dodaj",
      sideMismatchSwitchToAgainst: "Zmień na Przeciw i dodaj",
      sideMismatchKeep: "Zachowaj pierwotny wybór i dodaj",
    },
  },
  groups: {
    pageTitle: "Grupy prywatne",
    pageSubtitle:
      "Dyskusje zamknięte w gronie zaproszonych osób. Wejdź do grupy, do której należysz, albo utwórz własną.",
    createCta: "Utwórz grupę",
    createFirst: "Utwórz pierwszą grupę",
    ownerBadge: "Właściciel",
    ownerEyebrow: "Właściciel:",
    membersShort: "członków",
    debatesShort: "dyskusji",
    openCta: "Otwórz",
    loading: "Wczytuję grupy…",
    loadFailed:
      "Nie udało się wczytać grup. Odśwież stronę albo spróbuj ponownie za chwilę.",
    emptyTitle: "Nie należysz jeszcze do żadnej grupy",
    emptyBody:
      "Utwórz własną grupę albo poczekaj na zaproszenie - pojawi się w zakładce Zaproszenia.",
    create: {
      title: "Nowa grupa",
      subtitle:
        "Krótka nazwa pomoże członkom rozpoznać grupę na liście dyskusji.",
      nameLabel: "Nazwa grupy",
      namePlaceholder: "np. Zespół projektowy 2026",
      submit: "Utwórz grupę",
      submitting: "Tworzę grupę…",
      nameTooShort: "Nazwa musi mieć co najmniej 3 znaki.",
      nameTooLong: "Nazwa nie może przekraczać 64 znaków.",
      genericError: "Nie udało się utworzyć grupy. Spróbuj ponownie.",
    },
    detail: {
      eyebrow: "Grupa prywatna",
      backToList: "Wróć do listy grup",
      ownedBy: "Założyciel:",
      createdAt: "Utworzono:",
      createDebate: "Utwórz dyskusję w grupie",
      archive: "Usuń grupę",
      confirmArchive:
        "Usunąć grupę? Wszystkie dyskusje wewnątrz zostaną zarchiwizowane.",
      archiveFailed: "Nie udało się usunąć grupy. Spróbuj ponownie.",
      loading: "Wczytuję grupę…",
      notFoundTitle: "Grupa nie istnieje",
      notFoundBody:
        "Grupa mogła zostać usunięta przez właściciela albo nigdy nie istniała.",
      forbiddenTitle: "Brak dostępu",
      forbiddenBody:
        "Nie należysz do tej grupy. Aby zobaczyć jej dyskusje, poproś właściciela o zaproszenie.",
      errorTitle: "Coś poszło nie tak",
      errorBody: "Nie udało się wczytać grupy. Spróbuj odświeżyć stronę.",
      membersTitle: "Członkowie",
      debatesTitle: "Dyskusje w grupie",
      debatesEmpty:
        "W tej grupie nie ma jeszcze dyskusji. Rozpocznij pierwszą i zaproś członków do polemiki.",
      argumentsShort: "argumentów",
      invitationsTitle: "Zaproś użytkownika",
      invitationsSubtitle:
        "Wyszukaj konto po nazwie lub adresie e-mail. Zaproszenie czeka, aż osoba je przyjmie.",
      invitationsListTitle: "Wysłane zaproszenia",
      invitationsListEmpty: "Brak wysłanych zaproszeń.",
      inviteSubmit: "Wyślij zaproszenie",
      inviteSubmitting: "Wysyłam…",
      inviteConflict:
        "Ta osoba ma już oczekujące zaproszenie albo jest członkiem grupy.",
      inviteNoUser: "Wybrane konto nie istnieje.",
      inviteFailed: "Nie udało się wysłać zaproszenia. Spróbuj ponownie.",
    },
  },
  invitations: {
    pageTitle: "Zaproszenia",
    pageSubtitle:
      "Właściciele grup mogą zaprosić Twoje konto do prywatnych dyskusji. Zaproszenie trafia tutaj i wymaga Twojego potwierdzenia.",
    emptyTitle: "Brak oczekujących zaproszeń",
    emptyBody:
      "Gdy ktoś zaprosi Cię do prywatnej grupy, pojawi się to w tym miejscu.",
    goToGroups: "Zobacz moje grupy",
    fromEyebrow: "Zaproszenie do grupy",
    accept: "Przyjmij",
    decline: "Odrzuć",
    responding: "Przetwarzam…",
    respondError:
      "Nie udało się odpowiedzieć na zaproszenie. Spróbuj ponownie.",
    loading: "Wczytuję zaproszenia…",
    loadFailed:
      "Nie udało się wczytać zaproszeń. Odśwież stronę albo spróbuj ponownie za chwilę.",
    status: {
      pending: "Oczekuje",
      accepted: "Przyjęte",
      declined: "Odrzucone",
    },
  },
  users: {
    searchPlaceholder: "Szukaj po nazwie lub adresie e-mail (min. 2 znaki)",
    searching: "Szukam…",
    noResults: "Brak pasujących użytkowników.",
    searchError: "Nie udało się wyszukać użytkowników. Spróbuj ponownie.",
    clearSelection: "Wyczyść wybór",
  },
  common: {
    comingSoon: "W przygotowaniu",
    cancel: "Anuluj",
    close: "Zamknij",
  },
  toast: {
    networkError:
      "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.",
    serverError: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę.",
    forbidden: "Brak dostępu do tego zasobu.",
    notFound: "Nie znaleziono żądanego zasobu.",
    validationError: "Niepoprawne dane. Sprawdź formularz i spróbuj ponownie.",
    rateLimited: "Zbyt wiele żądań. Odczekaj chwilę.",
    unknownError: "Wystąpił nieoczekiwany błąd.",
  },
  theme: {
    toggle: "Przełącz motyw",
    light: "Jasny",
    dark: "Ciemny",
  },
  nav_aria: {
    openMenu: "Otwórz menu",
    closeMenu: "Zamknij menu",
  },
  language: {
    toggle: "Zmień język",
    pl: "Polski",
    en: "English",
  },
};

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------
const en: UiDict = {
  app: {
    name: "Argora",
    tagline: "A visual space for debates.",
  },
  nav: {
    discover: "Discover",
    groups: "Groups",
    invitations: "Invitations",
  },
  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    account: "My account",
    signInToParticipate: "Sign in to participate",
    login: {
      title: "Sign in",
      subtitle: "Welcome back to your debates.",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Your password",
      submit: "Sign in",
      submitting: "Signing in…",
      switchPrompt: "Don't have an account yet?",
      switchAction: "Sign up",
      invalidCredentials: "Incorrect email or password.",
      genericError: "Sign in failed. Please try again.",
    },
    register: {
      title: "Create an account",
      subtitle: "Set up your debate space in seconds.",
      displayNameLabel: "Display name",
      displayNamePlaceholder: "e.g. Alex Johnson",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 8 characters",
      submit: "Create account",
      submitting: "Creating account…",
      switchPrompt: "Already have an account?",
      switchAction: "Sign in",
      emailTaken: "An account with this email already exists.",
      genericError: "Account creation failed. Please try again.",
    },
    validation: {
      required: "This field is required.",
      emailInvalid: "Please enter a valid email address.",
      passwordTooShort: "Password must be at least 8 characters.",
      displayNameTooShort: "Name must be at least 2 characters.",
    },
  },
  dashboard: {
    heroEyebrow: "Public debates",
    heroTitle: "Debate, argue, change minds.",
    heroTitleAccent: "change minds.",
    heroSubtitle:
      "An open space for thinking out loud. Join a conversation or start your own.",
    startDebate: "Start a debate",
    browseFeed: "Browse feed",
    guestBanner:
      "You're browsing as a guest. You can read any public debate, but adding arguments requires signing in.",
    stats: {
      activeDebates: "Active debates",
      participants: "Participants",
      arguments: "Arguments",
      votes: "Votes cast",
    },
    filters: {
      hottest: "Most debated",
      newest: "Newest",
      mostDivisive: "Most divisive",
    },
    cardOpenParticipate: "Open & join",
    cardManage: "Manage",
    cardViewReadOnly: "View (read-only)",
    loading: "Loading debates…",
    loadFailed: "Failed to load debates. Try refreshing the page.",
    emptyTitle: "No public debates yet",
    emptyBody:
      "Be the first to start a debate visible to the entire community.",
    emptyCta: "Start the first debate",
  },
  sides: {
    pro: "For",
    against: "Against",
  },
  debates: {
    create: {
      title: "New debate",
      subtitle:
        "Formulate a thesis and choose who can participate. A well-stated thesis invites discussion.",
      thesisLabel: "Thesis",
      thesisPlaceholder:
        "e.g. Remote work permanently increases the productivity of engineering teams.",
      thesisHint:
        "8 to 280 characters. State it as a single, clear assertion.",
      visibilityLabel: "Visibility",
      visibilityPublic: "Public",
      visibilityPublicHint:
        "Debate visible to everyone; signed-in users can participate.",
      visibilityPrivate: "Private",
      visibilityPrivateHint: "Available only to a selected group.",
      visibilityPrivateLocked:
        "Available after creating or joining a group (coming soon).",
      languageLabel: "Debate language",
      languageHint:
        "Sets the language of AI-generated arguments and summaries. It cannot be changed later.",
      languagePl: "Polish",
      languageEn: "English",
      submit: "Create debate",
      submitting: "Creating debate…",
      cancel: "Cancel",
      genericError: "Failed to create debate. Please try again.",
      thesisTooShort: "Thesis must be at least 8 characters.",
      thesisTooLong: "Thesis cannot exceed 280 characters.",
      backToGroup: "Back to group",
      inGroupEyebrow: "Debate in private group",
      inGroupHint: "Will be added to",
      groupContextFailed:
        "Failed to load group. You can create a public debate or go back and try again.",
      privateNeedsGroup:
        "A private debate can only be created from within a selected group.",
    },
    detail: {
      backToFeed: "Back to debates",
      authorEyebrow: "Author",
      privateBadge: "Private",
      publicBadge: "Public",
      argumentsLabel: "Arguments",
      proLabel: "For",
      againstLabel: "Against",
      graphLoading: "Loading arguments…",
      graphLoadFailed: "Failed to load arguments.",
      graphEmptyTitle: "The argument tree is empty",
      graphEmptyBody:
        "Start the debate — add the first For or Against argument to the thesis.",
      loading: "Loading debate…",
      notFoundTitle: "Debate not found",
      notFoundBody:
        "The debate may have been archived or never existed.",
      forbiddenTitle: "Access denied",
      forbiddenBody:
        "This debate is private. Ask the group owner for an invitation.",
      loadFailed: "Failed to load debate.",
      deleteAriaLabel: "Delete debate",
      deleteConfirm:
        "Are you sure you want to delete this debate? All arguments inside will also be deleted.",
      deleteFailed: "Failed to delete debate. Please try again.",
    },
    graph: {
      thesisBadge: "Thesis",
      aiBadge: "AI",
      addPro: "Add For argument",
      addAgainst: "Add Against argument",
      selectionHint:
        "Click an argument to prepare a counter-argument to it.",
      thesisSelectedHint: "You're adding an argument directly under the thesis.",
      replyingToEyebrow: "Replying to",
      changeParent: "Change",
      attachToThesis: "Back to thesis",
      parentShowMore: "Show more",
      parentShowLess: "Collapse",
      sentimentPro: "For dominates",
      sentimentAgainst: "Against dominates",
      sentimentControversy: "Controversial",
      sentimentNeutral: "No votes",
      weightAriaLabel: "weight",
      voteWidgetAriaLabel: "Votes and argument weight",
      voteProActive: "Undo For vote",
      voteProInactive: "Vote For",
      voteAgainstActive: "Undo Against vote",
      voteAgainstInactive: "Vote Against",
      voteRequiresLogin: "Sign in to vote.",
      voteFailed: "Failed to cast vote.",
      weightTooltip:
        "Argument weight = For votes + Against votes. Every reaction increases visibility — regardless of direction. Color shows the dominant sentiment.",
      deleteAriaLabel: "Delete argument",
      deleteTooltipCan: "Delete your argument",
      deleteTooltipHasChildren:
        "Cannot delete an argument that already has replies. Delete all replies first.",
      deleteConfirm: "Are you sure you want to delete this argument?",
      deleteFailed: "Failed to delete argument.",
    },
    argumentForm: {
      panelTitle: "Add argument",
      panelSubtitle:
        "Short, focused arguments are the most readable. Remember, your vote shapes the weight of the debate.",
      sideLabel: "Side",
      sidePro: "For",
      sideAgainst: "Against",
      contentLabel: "Argument content",
      contentPlaceholder:
        "e.g. Remote work makes it easier to recruit specialists from around the world, broadening the talent pool.",
      submitPro: "Add For argument",
      submitAgainst: "Add Against argument",
      submitting: "Adding…",
      cancel: "Cancel",
      requiresLogin:
        "Sign in to add arguments to a public debate.",
      signIn: "Sign in",
      contentTooShort: "Argument must be at least 4 characters.",
      contentTooLong: "Argument cannot exceed 2000 characters.",
      genericError: "Failed to add argument. Please try again.",
      aiToggleLabel: "Generate with AI",
      aiModelLabel: "Model",
      aiNoProviders: "No AI models available",
      aiGenerateButton: "Generate",
      aiGenerating: "Generating…",
      aiGenerateError: "Failed to generate argument. Please try again.",
      checkingDuplicate: "Checking for duplicates…",
    },
    ai: {
      lassoToggle: "Select arguments",
      lassoCancel: "Cancel selection",
      synthesizeButton: "Summarize selected context",
      synthesisTitle: "Summary of selected context",
      synthesisModelLabel: "Model",
      synthesisStart: "Summarize selected context",
      synthesisSending: "Summarizing…",
      synthesisEmpty:
        "Select arguments on the graph (lasso) and AI will summarize the chosen part of the debate.",
      synthesisError:
        "Failed to prepare the summary. Please try again.",
      synthesisClose: "Close",
      synthesisAgain: "Summarize again",
      summarizeAll: "Summarize entire debate",
      synthesisFullTitle: "Full summary",
      summarizeAllSubtitle: "arguments in the debate",
      argumentsSelectedSubtitle: "arguments selected",
      duplicateTitle: "Similar argument already exists",
      duplicateSubtitle:
        "An argument with a similar meaning was detected. You can strengthen the existing one with a vote, or add yours as a new nuance.",
      duplicateOriginalLabel: "Existing argument",
      duplicateNewLabel: "Your argument",
      duplicateMerge: "Merge (add vote)",
      duplicateNuance: "Add as nuance",
      duplicateMerging: "Merging…",
      sideMismatchTitle: "Argument on the wrong side?",
      sideMismatchSubtitle:
        "AI detected that the content of your argument logically corresponds to a different side of the debate than the one you selected.",
      sideMismatchYourContent: "Your argument",
      sideMismatchSelectedLabel: "Selected side",
      sideMismatchSuggestedLabel: "Suggested side",
      sideMismatchSwitchToPro: "Switch to For and add",
      sideMismatchSwitchToAgainst: "Switch to Against and add",
      sideMismatchKeep: "Keep original choice and add",
    },
  },
  groups: {
    pageTitle: "Private groups",
    pageSubtitle:
      "Closed debates within invited members. Enter a group you belong to or create your own.",
    createCta: "Create group",
    createFirst: "Create first group",
    ownerBadge: "Owner",
    ownerEyebrow: "Owner:",
    membersShort: "members",
    debatesShort: "debates",
    openCta: "Open",
    loading: "Loading groups…",
    loadFailed:
      "Failed to load groups. Refresh the page or try again in a moment.",
    emptyTitle: "You don't belong to any group yet",
    emptyBody:
      "Create your own group or wait for an invitation — it will appear in the Invitations tab.",
    create: {
      title: "New group",
      subtitle:
        "A short name will help members recognize the group in the debate list.",
      nameLabel: "Group name",
      namePlaceholder: "e.g. Project team 2026",
      submit: "Create group",
      submitting: "Creating group…",
      nameTooShort: "Name must be at least 3 characters.",
      nameTooLong: "Name cannot exceed 64 characters.",
      genericError: "Failed to create group. Please try again.",
    },
    detail: {
      eyebrow: "Private group",
      backToList: "Back to groups",
      ownedBy: "Founded by:",
      createdAt: "Created:",
      createDebate: "Create debate in group",
      archive: "Delete group",
      confirmArchive:
        "Delete group? All debates inside will be archived.",
      archiveFailed: "Failed to delete group. Please try again.",
      loading: "Loading group…",
      notFoundTitle: "Group not found",
      notFoundBody:
        "The group may have been deleted by the owner or never existed.",
      forbiddenTitle: "Access denied",
      forbiddenBody:
        "You don't belong to this group. To see its debates, ask the owner for an invitation.",
      errorTitle: "Something went wrong",
      errorBody: "Failed to load group. Try refreshing the page.",
      membersTitle: "Members",
      debatesTitle: "Debates in group",
      debatesEmpty:
        "No debates in this group yet. Start the first one and invite members to discuss.",
      argumentsShort: "arguments",
      invitationsTitle: "Invite a user",
      invitationsSubtitle:
        "Search for an account by name or email. The invitation waits until the person accepts.",
      invitationsListTitle: "Sent invitations",
      invitationsListEmpty: "No sent invitations.",
      inviteSubmit: "Send invitation",
      inviteSubmitting: "Sending…",
      inviteConflict:
        "This person already has a pending invitation or is a member of the group.",
      inviteNoUser: "The selected account does not exist.",
      inviteFailed: "Failed to send invitation. Please try again.",
    },
  },
  invitations: {
    pageTitle: "Invitations",
    pageSubtitle:
      "Group owners can invite your account to private debates. Invitations land here and require your confirmation.",
    emptyTitle: "No pending invitations",
    emptyBody:
      "When someone invites you to a private group, it will appear here.",
    goToGroups: "View my groups",
    fromEyebrow: "Invitation to group",
    accept: "Accept",
    decline: "Decline",
    responding: "Processing…",
    respondError:
      "Failed to respond to invitation. Please try again.",
    loading: "Loading invitations…",
    loadFailed:
      "Failed to load invitations. Refresh the page or try again in a moment.",
    status: {
      pending: "Pending",
      accepted: "Accepted",
      declined: "Declined",
    },
  },
  users: {
    searchPlaceholder: "Search by name or email (min. 2 characters)",
    searching: "Searching…",
    noResults: "No matching users.",
    searchError: "Failed to search users. Please try again.",
    clearSelection: "Clear selection",
  },
  common: {
    comingSoon: "Coming soon",
    cancel: "Cancel",
    close: "Close",
  },
  toast: {
    networkError:
      "No server connection. Check your internet and try again.",
    serverError: "A server error occurred. Please try again in a moment.",
    forbidden: "You don't have access to this resource.",
    notFound: "The requested resource was not found.",
    validationError: "Invalid data. Check the form and try again.",
    rateLimited: "Too many requests. Please wait a moment.",
    unknownError: "An unexpected error occurred.",
  },
  theme: {
    toggle: "Toggle theme",
    light: "Light",
    dark: "Dark",
  },
  nav_aria: {
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  language: {
    toggle: "Change language",
    pl: "Polski",
    en: "English",
  },
};

// ---------------------------------------------------------------------------
// Translations map
// ---------------------------------------------------------------------------
const translations: Record<Lang, typeof pl> = { pl, en };

// ---------------------------------------------------------------------------
// Deep Proxy factory
// Creates a proxy that reads from the currently active language at the time
// of property access, so every component always gets fresh strings.
// ---------------------------------------------------------------------------
function makeProxy<T extends object>(path: string[] = []): T {
  return new Proxy({} as T, {
    get(_target, prop: string) {
      const root = translations[_lang] as unknown as Record<string, unknown>;
      // Walk the path to the current level
      let node: unknown = root;
      for (const segment of path) {
        if (node && typeof node === "object") {
          node = (node as Record<string, unknown>)[segment];
        } else {
          node = undefined;
          break;
        }
      }
      // Now get the prop on the current node
      if (node && typeof node === "object") {
        const value = (node as Record<string, unknown>)[prop];
        if (value && typeof value === "object") {
          // Return another proxy for nested objects
          return makeProxy([...path, prop]);
        }
        return value;
      }
      return undefined;
    },
  });
}

// The exported `ui` object – used everywhere in the app unchanged.
export const ui: UiDict = makeProxy<UiDict>();
