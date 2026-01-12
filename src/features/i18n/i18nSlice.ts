import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export type Language = "en" | "nb";

interface I18nState {
  language: Language;
}

const getInitialLanguage = (): Language => {
  // Try to get from localStorage
  const saved = localStorage.getItem("fortedle_language");
  if (saved === "en" || saved === "nb") {
    return saved;
  }
  // Try to detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("nb") || browserLang.startsWith("no")) {
    return "nb";
  }
  // Default to English
  return "en";
};

const initialState: I18nState = {
  language: getInitialLanguage(),
};

const i18nSlice = createSlice({
  name: "i18n",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      localStorage.setItem("fortedle_language", action.payload);
    },
  },
});

export const { setLanguage } = i18nSlice.actions;

export const selectLanguage = (state: RootState): Language => state.i18n.language;

export const i18nReducer = i18nSlice.reducer;
