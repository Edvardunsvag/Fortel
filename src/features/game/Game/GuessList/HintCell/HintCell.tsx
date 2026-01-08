import type { Guess } from '@/features/game/types';
import { HintType } from '@/features/game/types';
import { FlipBox } from '../../FlipBox';
import { calculateBoxDelay, getHintArrow, getHintResult, getHintValue } from '../utils';
import styles from './HintCell.module.scss';

interface HintCellProps {
  guess: Guess;
  hintType: HintType;
  guessIndex: number;
  boxIndex: number;
  isAnimated: boolean;
  t: (key: string) => string;
}

export const HintCell = ({
  guess,
  hintType,
  guessIndex,
  boxIndex,
  isAnimated,
  t,
}: HintCellProps) => {
  const delay = calculateBoxDelay(guessIndex, boxIndex, isAnimated);
  const value = getHintValue(guess, hintType);
  const result = getHintResult(guess, hintType);
  const arrow = getHintArrow(guess, hintType);

  return (
    <td className={styles.hintCell}>
      <FlipBox
        label={t(`guessList.${hintType}`)}
        value={value}
        result={result}
        delay={delay}
        showArrow={hintType === HintType.Age ? arrow.show : false}
        arrowDirection={arrow.direction}
      />
    </td>
  );
};

