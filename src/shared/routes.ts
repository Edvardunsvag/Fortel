/**
 * Route paths for the application
 */
export const routes = {
  hjem: "/hjem",
  play: "/",
  leaderboard: "/leaderboard",
  rules: "/rules",
  employees: "/employees",
  lottery: "/time-lottery",
  sync: "/sync",
  timebank: "/timebank",
  admin: "/admin",
} as const;

/**
 * Map ActiveTab enum to route paths
 */
export const tabToRoute: Record<string, string> = {
  hjem: routes.hjem,
  play: routes.play,
  leaderboard: routes.leaderboard,
  rules: routes.rules,
  employees: routes.employees,
  lottery: routes.lottery,
  sync: routes.sync,
  timebank: routes.timebank,
  admin: routes.admin,
};

/**
 * Map route paths to ActiveTab enum
 */
export const routeToTab: Record<string, string> = {
  [routes.hjem]: "hjem",
  [routes.play]: "play",
  [routes.leaderboard]: "leaderboard",
  [routes.rules]: "rules",
  [routes.employees]: "employees",
  [routes.lottery]: "lottery",
  [routes.sync]: "sync",
  [routes.timebank]: "timebank",
  [routes.admin]: "admin",
};
