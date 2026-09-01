import isEqual from "lodash.isequal";
import { Fragment, useMemo } from "react";
import { Button } from "../../elements/Button/Button";
import { useDashboardFilterConfigurations } from "../../filters/useDashboardFilterConfigurations";
import { useFilters } from "../../filters/useFilters";
import styles from "./FilterPanel.module.css";

export function FilterPanel() {
  const { filterConfigurations } = useDashboardFilterConfigurations();
  const { filters, selectedFilters, apply, resetFilters } = useFilters();

  const applyDisabled = useMemo(() => isEqual(filters, selectedFilters), [filters, selectedFilters]);

  return (
    <aside className={styles.filterPanel}>
      {filterConfigurations && filterConfigurations.map((filter, i) => <Fragment key={i}>{filter.Edit}</Fragment>)}
      {filterConfigurations && (
        <div className={styles.row}>
          <Button variant="secondary" onClick={resetFilters}>
            Reset
          </Button>
          <Button variant="primary" disabled={applyDisabled} onClick={apply}>
            Apply
          </Button>
        </div>
      )}
    </aside>
  );
}
