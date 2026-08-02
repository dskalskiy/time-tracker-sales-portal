'use client';

import { useSalesData } from '@/contexts/sales-data-context';
import { TariffCalculator } from '@/components/tariff-calculator';

/** Time Tracker tariffs — data from TimeTracker_Tariffs */
export function TimeTrackerCalculator() {
  const { data } = useSalesData();
  if (!data) return null;

  return (
    <TariffCalculator
      tariffConfig={data.timeTrackerTariffConfig}
      periodDiscounts={data.periodDiscounts}
      idPrefix="tt"
    />
  );
}

/** KEDO tariffs — data from KEDO_Tariffs (never falls back to Time Tracker) */
export function KedoCalculator() {
  const { data } = useSalesData();
  if (!data) return null;

  return (
    <TariffCalculator
      tariffConfig={data.kedoTariffConfig}
      periodDiscounts={data.periodDiscounts}
      idPrefix="kedo"
    />
  );
}
