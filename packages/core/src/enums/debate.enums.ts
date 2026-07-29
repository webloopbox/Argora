export enum ArgumentSide {
  Pro = 'pro',
  Against = 'against',
}

export enum DebateVisibility {
  Public = 'public',
  Private = 'private',
}

/**
 * Language a debate is conducted in. Fixed when the debate is created and
 * never changed afterwards, because it drives the language of AI-generated
 * arguments that get persisted as nodes in the graph - letting it change
 * would leave the tree permanently mixed-language and break embedding-based
 * duplicate detection, which compares vectors across the whole debate.
 */
export enum DebateLanguage {
  Pl = 'pl',
  En = 'en',
}
