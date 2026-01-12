import { useEffect } from "react";
import { useAppSelector } from "@/app/hooks";
import { selectLanguage } from "./i18nSlice";
import i18n from "./i18n";

export const useI18nSync = () => {
  const language = useAppSelector(selectLanguage);

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);
};
