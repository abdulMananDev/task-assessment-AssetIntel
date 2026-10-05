import { useEffect, useRef } from "react";
import { formatDate, formatTimestamp } from "../../lib/format";
import { cx } from "../../lib/cx";
import type {
  Asset,
  HealthStatus,
  MaintenanceLog,
} from "../../types";
import { StatusControl } from "../StatusControl";
import styles from "./DetailDrawer.module.css";

interface DetailDrawerProps {
  open: boolean;
  asset: Asset | null;
  logs: MaintenanceLog[];
  onClose: () => void;
  onStatusChange: (assetId: string, next: HealthStatus) => void;
}

/**
 * Sliding detail panel. Focus moves to the close button on open and back
 * to the table row trigger (`open-asset-{id}`) on close. The page content
 * is made `inert` by the parent while the drawer is open, so focus cannot
 * escape behind the backdrop.
 */
export function DetailDrawer({
  open,
  asset,
  logs,
  onClose,
  onStatusChange,
}: DetailDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastAssetIdRef = useRef<string | null>(null);
  if (asset !== null) {
    lastAssetIdRef.current = asset.id;
  }

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else if (lastAssetIdRef.current !== null) {
      document
        .getElementById(`open-asset-${lastAssetIdRef.current}`)
        ?.focus();
      lastAssetIdRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        className={cx(styles.backdrop, open && styles.backdropOpen)}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cx(styles.panel, open && styles.panelOpen)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-hidden={!open}
      >
        {asset !== null && (
          <>
            <header className={styles.header}>
              <div className={styles.heading}>
                <p className={styles.assetId}>{asset.id}</p>
                <h2 id="drawer-title" className={styles.title}>
                  {asset.name}
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close asset details"
              >
                ✕
              </button>
            </header>

            <div className={styles.body}>
              <dl className={styles.meta}>
                <div className={styles.metaRow}>
                  <dt className={styles.metaLabel}>Type</dt>
                  <dd className={styles.metaValue}>{asset.type}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt className={styles.metaLabel}>Zone</dt>
                  <dd className={styles.metaValue}>{asset.zone}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt className={styles.metaLabel}>Last inspected</dt>
                  <dd className={styles.metaValue}>{formatDate(asset.lastInspected)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt className={styles.metaLabel}>Health status</dt>
                  <dd className={styles.metaValue}>
                    <StatusControl
                      assetId={asset.id}
                      value={asset.healthStatus}
                      onStatusChange={onStatusChange}
                    />
                  </dd>
                </div>
              </dl>

              <section className={styles.logsSection} aria-label="Maintenance logs">
                <h3 className={styles.logsTitle}>Maintenance log</h3>
                {logs.length === 0 ? (
                  <p className={styles.logsEmpty}>No maintenance recorded yet.</p>
                ) : (
                  <ol className={styles.logList}>
                    {logs.map((log) => (
                      <li key={log.id} className={styles.logItem}>
                        <p className={styles.logSummary}>{log.summary}</p>
                        <p className={styles.logMeta}>
                          <span className={styles.logSource} data-source={log.source}>
                            {log.source}
                          </span>
                          <time dateTime={log.date}>{formatTimestamp(log.date)}</time>
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
