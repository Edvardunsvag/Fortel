import { GiftcardAdmin } from "@/features/giftcards";
import styles from "./LotteryAdmin.module.scss";

export const LotteryAdmin = () => {
  return (
    <div className={styles.content}>
      <GiftcardAdmin />
    </div>
  );
};
