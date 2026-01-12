/**
 * Route paths for the application
 */
export const routes = {
  play: "/",
  leaderboard: "/leaderboard",
  rules: "/rules",
  employees: "/employees",
  harvest: "/time-lottery",
  sync: "/sync",
} as const;

/**
 * Map ActiveTab enum to route paths
 */
export const tabToRoute: Record<string, string> = {
  play: routes.play,
  leaderboard: routes.leaderboard,
  rules: routes.rules,
  employees: routes.employees,
  harvest: routes.harvest,
  sync: routes.sync,
};

/**
 * Map route paths to ActiveTab enum
 */
export const routeToTab: Record<string, string> = {
  [routes.play]: "play",
  [routes.leaderboard]: "leaderboard",
  [routes.rules]: "rules",
  [routes.employees]: "employees",
  [routes.harvest]: "time-lottery",
  [routes.sync]: "sync",
};
