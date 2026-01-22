# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2026-01-22]

### Changed
- Simplified PR command documentation in `.cursor/commands/pr-command.md`
- Consolidated giftcard transaction migrations (removed duplicate migrations, added consolidated migration)
- Made weekly winner giftcard amount configurable via `Glede:WeeklyWinnerAmount` in appsettings

### Fixed
- Added validation for minimum giftcard amount (50 NOK) in `GiftcardService`
- Added validation for required employee name fields (FirstName and Surname) before sending giftcards
- Improved null handling in giftcard service with proper fallback values

### Added
- Enhanced logging in `GledeApiService` for API request debugging
- Enhanced logging in `LotteryDrawingService` for giftcard sending operations

## [2026-01-20]

### Added
- **Glede Giftcard Integration** - Automated giftcard sending for lottery winners ([#19](https://github.com/Edvardunsvag/Fortedle/pull/19))
  - **Backend Services**:
    - `GledeApiService` - HTTP client for Glede API integration
    - `GiftcardService` - Business logic for sending and tracking giftcards
    - `GiftcardTransactionRepository` - Data access for giftcard transactions
  - **Database**:
    - `GiftcardTransaction` entity with full tracking (user, amount, status, Glede order IDs, error handling)
    - Database migrations for giftcard transactions table with indexed columns
    - Foreign key relationships to Employee, WinningTicket, and MonthlyWinningTicket entities
  - **API Endpoints** (`GiftcardsController`):
    - `POST /api/giftcards/send` - Send giftcard to a user
    - `GET /api/giftcards` - Get all giftcard transactions
    - `GET /api/giftcards/user/{userId}` - Get transactions for specific user
    - `GET /api/giftcards/{id}` - Get specific transaction by ID
  - **Frontend Admin Panel**:
    - `GiftcardAdmin` component with transaction list table
    - Manual giftcard sending form with employee selector
    - Status badges (pending/sent/failed) and formatted dates
    - Full i18n support (English and Norwegian)
  - **Automated Giftcard Sending**:
    - Weekly lottery winners automatically receive 500 NOK giftcards
    - Giftcard transactions linked to winning tickets for traceability
    - Integration with existing `LotteryDrawingService`
    - Comprehensive error handling and logging for failed sends
  - **Configuration**:
    - Glede API settings in `appsettings.json` (ApiKey, BaseUrl, SenderName, amounts)
    - Support for different amounts based on reason (weekly/monthly/manual)
    - Configurable sender name and custom messages
  - **DTOs and Models**:
    - `GledeCreateOrderRequest/Response` for API communication
    - `SendGiftcardRequest/Response` for application layer
    - `GiftcardTransactionDto` with mapping extensions
    - Full support for Glede API v1 specification
- **CLAUDE.md** - Agent rules file for Claude Code integration
  - References Cursor rules files for frontend and backend patterns
  - Quick reference for commands, directories, and critical patterns
- Pull request template for standardized PR descriptions ([#18](https://github.com/Edvardunsvag/Fortedle/pull/18))

### Changed
- Restored cursor PR command file that was accidentally removed
- **Cursor IDE PR Command** ([#17](https://github.com/Edvardunsvag/Fortedle/pull/17))
  - Added `.cursor/commands/pr-command.md` for automated PR creation workflow
  - Command follows Conventional Commits 1.0.0 specification
  - Includes CHANGELOG.md update automation
  - Supports branch creation, commit, and PR creation in one workflow
- Updated `.gitignore` to allow tracking `CLAUDE.md` for shared agent configuration
- `LotteryDrawingService` now sends giftcards to winners with winning ticket ID linkage
- `Program.cs` updated with dependency injection for giftcard services
- `AppDbContext` includes new `GiftcardTransactions` DbSet with proper indexes

### Removed
- `AGENTS.md` - Replaced by `CLAUDE.md` which references Cursor rules files directly

## [2026-01-19]

### Added
- **Lottery UI Enhancements** ([#15](https://github.com/Edvardunsvag/Fortel/pull/15), [#16](https://github.com/Edvardunsvag/Fortel/pull/16))
  - Added festive winner celebration animations with rainbow gradient text
  - Implemented blur effect and 'check weekly winner' button for current week when winner is drawn
  - Refactored `YourHours` component to `YourTickets` with improved layout
  - Added Redux state management for auto-opening specific weeks
  - Show clear ticket status indicators (✓/✗) for each week
  - Added detailed eligibility reason messages for non-eligible weeks
  - Enhanced SCSS animations for winner celebrations
  - Improved accessibility with proper ARIA labels and keyboard navigation
  - Updated translations for new UI elements in English and Norwegian

### Changed
- Improved ukeslotteri UI

### Fixed
- CI build failure caused by missing dependencies ([#13](https://github.com/Edvardunsvag/Fortel/pull/13))
- Removed unused project assignments hook and fixed translation key ([#12](https://github.com/Edvardunsvag/Fortel/pull/12))
  - Changed `timebank.availableForBilling` → `timebank.possibleOvertime` to match existing i18n keys

### Refactored
- Full backend refactoring with improved type usage in frontend
- **Code Quality Improvements** ([#11](https://github.com/Edvardunsvag/Fortel/pull/11))
  - Extracted `calculateTimeBalance()` into smaller pure functions in `calculations/` directory
  - Created `useAiEncouragement` hook for AI/TTS logic separation (280 lines → 64 lines component)
  - Added `absencePatterns.ts` with regex word boundaries for accurate matching
  - Centralized Harvest constants in `shared/constants/harvest.ts`
  - Renamed `possibleOvertimeHours` → `availableForBilling` for clarity
  - Fixed query cache invalidation to refresh all data after OAuth
  - Fixed hardcoded `colSpan` in WeeklyBreakdown
  - Expanded project colors from 8 to 16+ with golden angle generator
  - Added lazy TTS prefetch using `requestIdleCallback`

### CI/CD
- Disabled staging environment creation on pull requests

## [2026-01-19] - Employee Weeks & Harvest Sync

### Added
- **Employee Weeks Tracking with Harvest Sync** ([#14](https://github.com/Edvardunsvag/Fortel/pull/14))
  - Added `EmployeeWeek` database model and migration
  - Added `EmployeeWeeksController` with sync and get endpoints
  - Added `EmployeeWeekService` and `EmployeeWeekRepository` for data management
  - Enhanced `HarvestApiService` with `GetCurrentUserAsync` and improved ID handling (int → long)
  - Updated `LotteryDrawingService` to use employee weeks data
  - Added `WeekDetails` component for displaying weekly hour breakdowns
  - Regenerated API client with new endpoints
  - Updated cursor rules for API client usage and build validation

### Removed
- Deprecated lottery utilities (`useGroupEntriesByWeek`, `groupEntriesByWeek.test.ts`, `consts.ts`)

## [2026-01-17]

### Added
- Available for billing calculation in timebank

### Fixed
- Lottery: prevent auto-reveal after triggering draw
- Lottery: use API client instead of raw fetch for admin endpoints

## [2026-01-16]

### Added
- **Time Bank Feature Updates** ([#10](https://github.com/Edvardunsvag/Fortel/pull/10))
  - Deduct Avspasering hours from total timesaldo (weekly balance stays correct at 40t/40t)
  - Green confetti animation for positive/zero balance
  - Shake animation for negative balance
  - Added `isAvspaseringsEntry()` function and modified balance calculation
  - Added `avspaseringsHours` to `WeekBalance` type
- Weekly winners and employees tab for lottery statistics
- Countdown for ukeslotteri
- Console logging for debugging wheel alignment
- More fields to employee database
- **Grand Finale Lucky Wheel Feature**
  - Wheel and monthly draw API endpoints
  - Interactive lucky wheel for grand finale draws
- Admin page for Fortedle
- Hangfire to production environment

### Fixed
- Eddie avatar AI encouragement
- Reset wheel after winner reveal to fix alignment
- Reset ALL lottery tickets and fix duplicate key warning
- Possible game fixes
- Removed infinite loop
- Improved Eddi fetch logic and TTS caching

### Refactored
- Cleanup and formatting of timelotteriet

### Changed
- Regenerated API client

## [2026-01-15]

### Added
- **Eddi AI Avatar with TTS Support** ([#9](https://github.com/Edvardunsvag/Fortel/pull/9))
  - AiEncouragement component with streaming AI responses
  - Eddi comments on time balance and fagtimer with edgy humor
  - Support for Norwegian and English (with Norwegian expressions)
  - Text-to-speech playback using Azure OpenAI gpt-4o-mini-tts
  - Show Edvard Unsvåg's avatar from Huma database
  - Typing animation while streaming response
  - Project breakdown and stats components
  - Floating particles animation
- **Lottery Drawing Job** ([#8](https://github.com/Edvardunsvag/Fortel/pull/8))
  - Hangfire packages (Core, ASP.NET Core, PostgreSQL storage)
  - WinningTicket entity with user_id, lottery_ticket_id, week, and created_at
  - Migration for winning_tickets table with indexes and foreign key
  - LotteryDrawingService to randomly select 3 winning tickets
  - Configured Hangfire with PostgreSQL storage and dashboard
  - Recurring job to run every Friday at 15:00 UTC
  - Mark selected lottery tickets as used when drawn
- **Time Bank Feature** ([#7](https://github.com/Edvardunsvag/Fortel/pull/7))
  - New Time Bank page showing logged hours vs expected hours balance
  - Display competency hours (fagtimer) tracking with progress bar
  - Timeframe selector (year-to-date, month, 3 months, custom date range)
  - Weekly breakdown with expandable cards showing project details
  - Rules tab with working hours, overtime and flextime policies
  - Smooth sliding animation for tab navigation
  - Support for both English and Norwegian translations
- **Lottery Tickets Functionality** ([#6](https://github.com/Edvardunsvag/Fortel/pull/6))
  - LotteryTicket entity and database migration
  - LotteryTicketsController with sync endpoint
  - LotteryTicketService with Harvest API integration
  - Frontend API client and TanStack Query hooks
  - Updated lottery UI to display and sync tickets
  - i18n translations for lottery tickets
- Winner section to lottery with images
- i18n support for hours and week labels
- Sliding tab animation to navigation chips
- Seed lottery controller
- Environment example file and updated dependencies
- Tests to pre-commit hooks

### Fixed
- Tests in lottery functionality
- Improved Eddi TTS caching and responsive rules layout
- Small changes to lottery display

### Documentation
- **AGENTS.md for AI Assistants** ([#4](https://github.com/Edvardunsvag/Fortel/pull/4))
  - Shared documentation for AI assistants (Claude, Cursor, etc.)
  - Contains project commands, architecture, patterns, and git workflow
  - Updated `.gitignore` to exclude local Claude config

### Changed
- AI environment variables configuration
- Run build process
- Reverted lottery drawing job temporarily

### Removed
- Unused public assets (favicon, fonts, logo files) ([#5](https://github.com/Edvardunsvag/Fortel/pull/5))

### Chore
- **Conventional Commit PR Rule for Cursor** ([#3](https://github.com/Edvardunsvag/Fortel/pull/3))
  - Added Cursor IDE rule for creating conventional commits and PRs
  - Updated .gitignore to track .cursor/rules/
  - Rule follows Conventional Commits 1.0.0 specification
- Format lottery slice exports
- Made repository structure cleaner

## [2026-01-13-2026-01-14]

### Added
- Tabs in lottery page
- Weekly data hook for reusable lottery data
- Navigation with game chips

### Changed
- Moved add and from date to constants
- Structured subtabs into folders
- Fetch all weeks for current year
- Use absolute paths for variable.scss
- Avoid infinite render issues
- Rules configuration
- New week npm package and style changes

### Refactored
- **Redux Hooks Update** ([#2](https://github.com/Edvardunsvag/Fortel/pull/2))
  - Updated typed hooks to use withTypes API
  - Renamed from harvest to lottery

## [2026-01-12]

### Added
- Harvest/Lottery feature with OAuth integration
- TanStack Query for API state management
- Email field to backend
- Prettier formatting across entire codebase

### Changed
- Redirect URL configuration
- Workflow improvements

## [2026-01-05-2026-01-08]

### Added
- **Fun Fact Feature** ([#1](https://github.com/Edvardunsvag/Fortel/pull/1))
  - Fun fact and buying interest fields to database and frontend
  - Resolved MSAL tenant profile serialization warning

### Changed
- Large refactor of frontend and backend with new game endpoints
- Petter Sommerseth fix
- DTO logic separation (ToDto/FromDto) for clearer type boundaries

### Fixed
- Correct can guess logic
- Remove sync from regular user, always allow sync
- Run migration successfully

## [2026-01-06-2026-01-07]

### Added
- Test setup with Vitest and Husky hooks
- Generate types and API client from Swagger
- Swagger in production environment
- Round logic and support for storing rounds
- Leaderboard date styling

### Changed
- Rewrite to .NET backend and refactor frontend
- Update to modern Sass API to remove warnings
- Use imports from generated barrel files
- Environment variable access pattern
- Commit generated folder to version control

### Fixed
- Quick fixes to make guessing possible
- Workflow changes for deployment

### Removed
- Dead code cleanup
- Moved sidebar folder

## [2025-12-26-2025-12-27]

### Added
- Login screen with authentication
- Norwegian language support (i18n)
- Employees tab
- Image to leaderboard
- Better game finish state

### Changed
- CORS configuration for multiple origins (dev and production)
- Build output to dist folder
- Better canGuess logic
- Style improvements
- Forte design implementation
- Flip all cards on tab switch
- Prevent multiple attempt commits

### CI/CD
- Azure Static Web Apps workflow
- Azure deployment workflow for backend
- Frontend deployment workflow

### Fixed
- Preflight CORS issues
- Various deployment workflow issues
- Sync functionality
- Logging issues

## [2025-12-25-2025-12-26]

### Added
- Backend and database setup
- Sidebar navigation
- Initial project structure
- Styling framework
- Data visualization improvements

### Changed
- Renamed to Fortedle (from previous name)
- Use teams instead of skills
- Layout improvements

### Removed
- Unused code cleanup
