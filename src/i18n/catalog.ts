/** One UI string in every language. English is the source; the other two are translations of it. */
export interface Msg {
  en: string;
  hi: string;
  gu: string;
}

export type Catalog = Record<string, Msg>;

/**
 * Declares a group of messages. Keys are `area.name` (plural forms end in `.one` / `.other`). Placeholders are
 * `{name}` and must appear in all three languages. Returns the object unchanged so its keys stay typed.
 */
export const defineCatalog = <T extends Catalog>(c: T): T => c;
