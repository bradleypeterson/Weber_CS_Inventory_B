import { useEffect, useState } from "react";
import type { AssetAnalytics, AssetCountGroup } from "../../../../@types/analytics";
import { fetchAssetAnalytics } from "../../api/analytics";
import { Button } from "../../elements/Button/Button";
import styles from "./AnalyticsDashboard.module.css";

function CountChart({ title, label, groups, total }: { title: string; label: string; groups: AssetCountGroup[]; total: number }) {
  const maximum = Math.max(1, ...groups.map(group => group.count));
  return <section className={styles.panel} aria-label={title}>
    <h2>{title}</h2>
    <p className={styles.caption}>Active assets / bars scaled to the largest group</p>
    <ul className={styles.chart} tabIndex={0} aria-label={title}>
      {groups.map(group => <li key={group.id ?? "unassigned"}>
        <div className={styles.barLabel}>
          <span>{group.name}</span>
          <span className={styles.barValue}>{group.count.toLocaleString()} <small>({total > 0 ? (group.count / total * 100).toFixed(1) : "0.0"}%)</small></span>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.bar} style={{ width: `${group.count / maximum * 100}%` }} />
        </div>
      </li>)}
    </ul>
    <details className={styles.details}>
      <summary>View data table</summary>
      <table className={styles.table}>
      <caption>{title}</caption>
      <thead><tr><th scope="col">{label}</th><th scope="col">Active assets</th></tr></thead>
      <tbody>{groups.map(group => <tr key={group.id ?? "unassigned"}>
        <th scope="row">{group.name}</th><td>{group.count.toLocaleString()}</td>
      </tr>)}</tbody>
      </table>
    </details>
  </section>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AssetAnalytics>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(undefined);
    setError("");
    fetchAssetAnalytics().then(result => {
      if (active) setData(result);
    }).catch(() => {
      if (active) setError("Unable to load asset analytics. Please try again.");
    });
    return () => { active = false; };
  }, [attempt]);

  return <main className={styles.dashboard}>
    <h1>Analytics</h1>
    <p className={styles.description}>Active assets within your access permissions. Archived and deleted assets are excluded.</p>
    {error ? <div role="alert"><p>{error}</p><Button variant="secondary" onClick={() => setAttempt(value => value + 1)}>Retry</Button></div>
      : !data ? <p role="status">Loading analytics...</p>
      : <>
        <dl className={styles.cards} aria-label="Asset summary">
          <div className={`${styles.card} ${styles.primaryCard}`}>
            <dt>Total active assets</dt><dd>{data.totalActiveAssets.toLocaleString()}</dd>
            <dd className={styles.hint}>Assets you can access</dd>
          </div>
          <div className={styles.card}>
            <dt>Departments with assets</dt><dd>{data.byDepartment.filter(group => group.id !== null).length.toLocaleString()}</dd>
            <dd className={styles.hint}>Excludes unassigned departments</dd>
          </div>
          <div className={styles.card}>
            <dt>Device types with assets</dt><dd>{data.byDeviceType.filter(group => group.id !== null).length.toLocaleString()}</dd>
            <dd className={styles.hint}>Excludes unassigned device types</dd>
          </div>
        </dl>
        {data.totalActiveAssets === 0 ? <p className={styles.empty}>No active assets are available within your access permissions.</p> : <div className={styles.breakdowns}>
          <CountChart title="Assets by department" label="Department" groups={data.byDepartment} total={data.totalActiveAssets} />
          <CountChart title="Assets by device type" label="Device type" groups={data.byDeviceType} total={data.totalActiveAssets} />
        </div>}
      </>}
  </main>;
}
