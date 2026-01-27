import styles from "./OptimizelyPage.module.scss";

export const OptimizelyPage = () => {

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Optimizely Playground</h1>
        <p className={styles.description}>
          This is your experimental space for learning and working with Optimizely CMS SaaS.
          All Optimizely-related code lives in the <code>src/features/optimizely/</code> folder.
        </p>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Getting Started</h2>
          <p className={styles.text}>
            Start by setting up your Optimizely CMS SaaS account and obtaining your Single Key
            authentication token. Then you can begin experimenting with GraphQL queries!
          </p>
        </div>
      </div>
    </div>
  );
};
