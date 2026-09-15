export type WordMeaning = { arabic: string; gloss: string };

// Pause marks and vowel signs vary between the two Quran.com text responses.
// Keep the saved Arabic word indexes intact, including standalone pause signs.
export function alignWordMeanings(text: string, meanings: WordMeaning[]): string[] {
    const letters = (value: string) => value.normalize("NFD").replace(/[\p{M}\sـ]/gu, "");
    let position = 0;
    const result: string[] = [];
    for (const word of text.split(/\s+/)) {
        const key = letters(word);
        if (!key) { result.push(""); continue; }
        const meaning = meanings[position++];
        if (!meaning || letters(meaning.arabic) !== key) return [];
        result.push(meaning.gloss);
    }
    return position === meanings.length ? result : [];
}
