import { cx } from "../../lib/cx";
import { isOneOf } from "../../lib/guards";
import { HEALTH_STATUSES, type HealthStatus } from "../../types";
import styles from "./StatusControl.module.css";

const STATUS_CLASS: Record<HealthStatus, string | undefined> = {
  Healthy: styles.healthy,
  "Attention Required": styles.attention,
  Critical: styles.critical,
};

interface StatusControlProps {
  assetId: string;
  value: HealthStatus;
  onStatusChange: (assetId: string, next: HealthStatus) => void;
}

/**
 * The one inline health-status control, shared by table rows and the
 * detail drawer. A styled native <select> keeps full keyboard and mobile
 * behaviour for free.
 */
export function StatusControl({ assetId, value, onStatusChange }: StatusControlProps) {
  return (
    <span className={cx(styles.wrapper, STATUS_CLASS[value])}>
      <span className={styles.dot} aria-hidden="true" />
      <select
        className={styles.select}
        value={value}
        aria-label={`Health status for ${assetId}`}
        onChange={(event) => {
          const next = event.target.value;
          if (isOneOf(HEALTH_STATUSES, next)) onStatusChange(assetId, next);
        }}
      >
        {HEALTH_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <span className={styles.chevron} aria-hidden="true" />
    </span>
  );
}
