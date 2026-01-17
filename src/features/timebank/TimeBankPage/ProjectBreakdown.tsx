import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WeekBalance } from "../types";
import styles from "./TimeBankPage.module.scss";

interface ProjectBreakdownProps {
  weeks: WeekBalance[];
}

interface TaskSummary {
  name: string;
  hours: number;
  percentage: number;
}

interface ProjectSummary {
  name: string;
  hours: number;
  percentage: number;
  color: string;
  tasks: TaskSummary[];
}

// Colors for the project bars (expanded palette)
const PROJECT_COLORS = [
  "#6b4c35", // Primary brown
  "#8b6b4f", // Light brown
  "#4a7c59", // Green
  "#5a8fa8", // Blue
  "#9b7653", // Tan
  "#7a6b5a", // Gray brown
  "#6b8e7a", // Sage
  "#8b7355", // Khaki
  "#7b5e57", // Dusty rose
  "#5c7a6a", // Muted teal
  "#8a7b6b", // Taupe
  "#6a7b8a", // Steel blue
  "#7c6b5b", // Warm gray
  "#5b6b7c", // Slate
  "#6b7c5b", // Olive
  "#8b6b8a", // Mauve
];

/**
 * Generate a color using the golden angle for even distribution
 * Falls back to this when we run out of predefined colors
 */
const generateColor = (index: number): string => {
  // Use golden angle (137.5°) for even hue distribution
  const hue = (index * 137.5) % 360;
  // Keep saturation and lightness muted for professional look
  return `hsl(${hue}, 35%, 45%)`;
};

/**
 * Get color for a project by index
 */
const getProjectColor = (index: number): string => {
  if (index < PROJECT_COLORS.length) {
    return PROJECT_COLORS[index];
  }
  return generateColor(index);
};

export const ProjectBreakdown = ({ weeks }: ProjectBreakdownProps) => {
  const { t } = useTranslation();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const projectData = useMemo(() => {
    // Map: projectName -> { totalHours, tasks: Map<taskName, hours> }
    const projectMap = new Map<string, { totalHours: number; tasks: Map<string, number> }>();

    weeks.forEach((week) => {
      week.entries.forEach((entry) => {
        if (entry.isAbsence) return; // Skip absence entries

        const projectName = entry.projectName;
        const taskName = entry.taskName;

        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, { totalHours: 0, tasks: new Map() });
        }

        const project = projectMap.get(projectName)!;
        project.totalHours += entry.totalHours;

        const currentTaskHours = project.tasks.get(taskName) || 0;
        project.tasks.set(taskName, currentTaskHours + entry.totalHours);
      });
    });

    const totalHours = Array.from(projectMap.values()).reduce((sum, p) => sum + p.totalHours, 0);

    const projects: ProjectSummary[] = Array.from(projectMap.entries())
      .map(([name, data], index) => {
        // Convert tasks map to sorted array - percentage is of TOTAL hours, not project hours
        const tasks: TaskSummary[] = Array.from(data.tasks.entries())
          .map(([taskName, taskHours]) => ({
            name: taskName,
            hours: taskHours,
            percentage: totalHours > 0 ? (taskHours / totalHours) * 100 : 0,
          }))
          .sort((a, b) => b.hours - a.hours);

        return {
          name,
          hours: data.totalHours,
          percentage: totalHours > 0 ? (data.totalHours / totalHours) * 100 : 0,
          color: getProjectColor(index),
          tasks,
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8); // Top 8 projects

    return { projects, totalHours };
  }, [weeks]);

  const handleProjectClick = (projectName: string) => {
    setExpandedProject(expandedProject === projectName ? null : projectName);
  };

  if (projectData.projects.length === 0) {
    return null;
  }

  return (
    <div className={styles.projectBreakdown}>
      <h3 className={styles.projectBreakdownTitle}>{t("timebank.projectBreakdown.title")}</h3>
      <div className={styles.projectList}>
        {projectData.projects.map((project) => {
          const isExpanded = expandedProject === project.name;

          return (
            <div key={project.name} className={styles.projectItemWrapper}>
              <div
                className={`${styles.projectItem} ${styles.projectItemClickable}`}
                onClick={() => handleProjectClick(project.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleProjectClick(project.name);
                  }
                }}
              >
                <div className={styles.projectInfo}>
                  <span className={styles.projectName}>
                    <span className={`${styles.projectChevron} ${isExpanded ? styles.projectChevronOpen : ""}`}>
                      ▶
                    </span>
                    {project.name}
                  </span>
                  <span className={styles.projectHours}>
                    {project.hours.toFixed(1)}{t("timebank.hourSuffix")} ({project.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className={styles.projectBarContainer}>
                  <div
                    className={styles.projectBar}
                    style={{
                      width: `${project.percentage}%`,
                      backgroundColor: project.color,
                    }}
                  />
                </div>
              </div>

              {/* Expanded tasks */}
              <div className={`${styles.projectTasks} ${isExpanded ? styles.projectTasksOpen : ""}`}>
                <div className={styles.projectTasksInner}>
                  {project.tasks.map((task) => (
                    <div key={task.name} className={styles.taskItem}>
                      <div className={styles.taskInfo}>
                        <span className={styles.taskName}>{task.name}</span>
                        <span className={styles.taskHours}>
                          {task.hours.toFixed(1)}{t("timebank.hourSuffix")} ({task.percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className={styles.taskBarContainer}>
                        <div
                          className={styles.taskBar}
                          style={{
                            width: `${task.percentage}%`,
                            backgroundColor: project.color,
                            opacity: 0.6,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
