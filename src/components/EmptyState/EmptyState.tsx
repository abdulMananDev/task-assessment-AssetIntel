import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      {hint !== undefined && <p className={styles.hint}>{hint}</p>}
      {action !== undefined && <div className={styles.action}>{action}</div>}
    </div>
  );
}
