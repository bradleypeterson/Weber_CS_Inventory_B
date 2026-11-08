import { useEffect, useState } from "react";
import type { AssetAnalytics, AssetCountGroup } from "../../../../@types/analytics";
import { fetchAssetAnalytics } from "../../api/analytics";
import { Button } from "../../elements/Button/Button";
import styles from "./AnalyticsDashboard.module.css";
import { useLinkTo } from "../../navigation/useLinkTo";

function CountChart({ title, label, groups, total, onSelect }: { title: string; label: string; groups: AssetCountGroup[]; total: number; onSelect: (group: AssetCountGroup) => void }) {
  const maximum = Math.max(1, ...groups.map(group => group.count));
  return <section className={styles.panel} aria-label={title}>
    <h2>{title}</h2>
    <p className={styles.caption}>Active assets / bars scaled to the largest group</p>
    <ul className={styles.chart} tabIndex={0} aria-label={title}>
      {groups.map(group => <li key={group.id ?? "unassigned"}>
        <button type="button" className={styles.chartButton} onClick={() => onSelect(group)} aria-label={`View ${group.name} assets (${group.count})`}>
        <div className={styles.barLabel}>
          <span>{group.name}</span>
          <span className={styles.barValue}>{group.count.toLocaleString()} <small>({total > 0 ? (group.count / total * 100).toFixed(1) : "0.0"}%)</small></span>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.bar} style={{ width: `${group.count / maximum * 100}%` }} />
        </div>
        </button>
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
  const linkTo = useLinkTo();
  const [data, setData] = useState<AssetAnalytics>();
  const [options, setOptions] = useState<AssetAnalytics>();
  const [department, setDepartment] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  function openAssets(key: string, group: AssetCountGroup) {
    const query = new URLSearchParams({ from: "analytics" });
    if (department) query.set("departmentId", department);
    if (deviceType) query.set("deviceTypeId", deviceType);
    query.set(key, group.id === null ? "unassigned" : String(group.id));
    query.set("group", group.name);
    linkTo("Search", ["Assets"], query.toString());
  }
  useEffect(() => {
    let active = true;
    setData(undefined);
    setError("");
    const parse = (value: string) => value === "" ? undefined : value === "unassigned" ? null : Number(value);
    const load = async () => {
      const available = options ?? await fetchAssetAnalytics();
      if (active && !options) setOptions(available);
      const result = department || deviceType
        ? await fetchAssetAnalytics({ departmentId: parse(department), deviceTypeId: parse(deviceType) })
        : available;
      if (active) setData(result);
    };
    load().catch(() => {
      if (active) setError("Unable to load asset analytics. Please try again.");
    });
    return () => { active = false; };
  }, [attempt, department, deviceType, options]);

  return <main className={styles.dashboard}>
    <h1>Analytics</h1>
    <p className={styles.description}>Active assets within your access permissions. Archived and deleted assets are excluded.</p>
    <div className={styles.filters} aria-label="Analytics filters">
      <label>Department
        <select value={department} onChange={event => setDepartment(event.target.value)}>
          <option value="">All departments</option>
          {options?.byDepartment.map(group => <option key={group.id ?? "unassigned"} value={group.id ?? "unassigned"}>{group.name}</option>)}
        </select>
      </label>
      <label>Device type
        <select value={deviceType} onChange={event => setDeviceType(event.target.value)}>
          <option value="">All device types</option>
          {options?.byDeviceType.map(group => <option key={group.id ?? "unassigned"} value={group.id ?? "unassigned"}>{group.name}</option>)}
        </select>
      </label>
      <Button variant="secondary" onClick={() => { setDepartment(""); setDeviceType(""); }}>Clear filters</Button>
    </div>
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
        {data.totalActiveAssets === 0 ? <p className={styles.empty}>No active assets match these filters within your access permissions.</p> : <div className={styles.breakdowns}>
          <CountChart title="Assets by department" label="Department" groups={data.byDepartment} total={data.totalActiveAssets} onSelect={group => openAssets("departmentId", group)} />
          <CountChart title="Assets by device type" label="Device type" groups={data.byDeviceType} total={data.totalActiveAssets} onSelect={group => openAssets("deviceTypeId", group)} />
          <CountChart title="Assets by condition" label="Condition" groups={data.byCondition} total={data.totalActiveAssets} onSelect={group => openAssets("conditionId", group)} />
        </div>}
      </>}
  </main>;
}
