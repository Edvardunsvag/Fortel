import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { Game } from './Game';
import { FeatureKey } from '@/shared/redux/enums';
import type { RootState } from '@/app/store';
import type { Employee } from '@/features/employees/types';
import { AsyncStatus } from '@/shared/redux/enums';
import { ActiveTab } from '@/features/navigation/navigationSlice';
import { hashEmployeeId } from '@/shared/utils/hashUtils';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock date utilities to return consistent dates for testing
vi.mock('@/shared/utils/dateUtils', () => ({
  getTodayDateString: () => '2024-01-01',
  getDateSeed: vi.fn((dateString: string) => {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }),
  selectIndexBySeed: vi.fn((seed: number, arrayLength: number) => seed % arrayLength),
}));

describe('Game - Input Field Visibility', () => {
  const mockEmployees: Employee[] = [
    {
      id: '1',
      name: 'John Doe',
      firstName: 'John',
      surname: 'Doe',
      department: 'Engineering',
      office: 'Oslo',
      teams: ['Frontend'],
      age: 30,
      supervisor: 'Jane Manager',
      avatarImageUrl: '',
      funfact: 'Loves coding',
      interests: [],
    },
  ];

  const testDate = '2024-01-01';
  const hashedEmployeeId = hashEmployeeId(mockEmployees[0].id, testDate);

  const createMockState = (overrides?: Partial<RootState>): RootState => ({
    [FeatureKey.Employees]: {
      employees: mockEmployees,
      status: AsyncStatus.Succeeded,
      error: null,
    },
    [FeatureKey.Game]: {
      employeeOfTheDayId: hashedEmployeeId,
      guesses: [],
      status: 'playing',
      currentDate: testDate,
      attemptedByUserId: null,
      attemptDate: null,
      funfactRevealed: false,
    },
    [FeatureKey.Auth]: {
      account: {
        localAccountId: 'user-1',
        username: 'john.doe',
        name: 'John Doe',
      },
      accessToken: null,
      isAuthenticated: true,
    },
    [FeatureKey.Leaderboard]: {
      data: {
        leaderboard: [],
        date: '2024-01-01',
      },
      status: AsyncStatus.Idle,
      error: null,
      submitStatus: AsyncStatus.Idle,
      submitError: null,
    },
    [FeatureKey.Navigation]: {
      activeTab: ActiveTab.Play,
    },
    [FeatureKey.I18n]: {
      language: 'en',
    },
    ...overrides,
  } as RootState);

  it('should show input field when canGuess is true', () => {
    const mockState = createMockState();
    const { getByLabelText } = renderWithProviders(<Game />, {
      preloadedState: mockState,
    });

    // Input should be visible when canGuess is true
    const input = getByLabelText(/game.enterEmployeeName/i);
    expect(input).toBeInTheDocument();
  });

  it('should not show input field when canGuess is false', () => {
    const mockState = createMockState({
      [FeatureKey.Game]: {
        employeeOfTheDayId: hashedEmployeeId,
        guesses: [],
        status: 'won', // This makes canGuess false
        currentDate: testDate,
        attemptedByUserId: null,
        attemptDate: null,
        funfactRevealed: false,
      },
    });

    const { queryByLabelText } = renderWithProviders(<Game />, {
      preloadedState: mockState,
    });

    // Input should not be visible when canGuess is false
    const input = queryByLabelText(/game.enterEmployeeName/i);
    expect(input).not.toBeInTheDocument();
  });
});

