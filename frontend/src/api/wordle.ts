import apiClient from "./client";

export interface WordleWordsResponse {
  words: string[];
}

export function getWordleWords() {
  return apiClient.get<WordleWordsResponse>("/wordle/words");
}
