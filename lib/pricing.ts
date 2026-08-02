import type {
  IntegrationPricing,
  TariffConfig,
  TariffPricing,
  TariffTier,
} from '@/lib/types';

function findIndividualTier(
  tiers: TariffTier[],
  employeeCount: number
): TariffTier | null {
  return (
    tiers.find(
      (tier) =>
        employeeCount >= tier.minUsers && employeeCount <= tier.maxUsers
    ) ?? null
  );
}

/** Upper employee bound for per-employee breakdown on fixed tariffs. */
const STANDARD_TARIFF_EMPLOYEE_MAX: Record<string, number> = {
  light: 10,
  base: 30,
  medium: 60,
};

function getTariffEmployeeCount(
  config: TariffConfig,
  employeeCount?: number
): number {
  if (config.calcType === 'per_user') {
    return employeeCount ?? config.minUsers;
  }

  const standardMax = STANDARD_TARIFF_EMPLOYEE_MAX[config.key];
  if (standardMax) return standardMax;

  if (config.maxUsers > 0 && config.maxUsers < 999999) {
    return config.maxUsers;
  }

  return config.minUsers;
}

function calculatePerEmployeeMonthly(
  totalForPeriod: number,
  periodMonths: number,
  employees: number
): number {
  if (employees <= 0 || periodMonths <= 0) return 0;
  return Math.round(totalForPeriod / periodMonths / employees);
}

function calculateBaseAmount(
  config: TariffConfig,
  period: number,
  employeeCount?: number
): number {
  if (config.calcType === 'per_user' && config.tiers) {
    const employees = employeeCount ?? config.minUsers;
    const tier = findIndividualTier(config.tiers, employees);
    if (!tier) return 0;
    return tier.pricePerUser * employees * period;
  }

  if (config.basePeriod === 'quarter') {
    const quarters = period / 3;
    return config.price * quarters;
  }

  return config.price * period;
}

export function calculateTariffPricing(
  tariffConfig: Record<string, TariffConfig>,
  periodDiscounts: Record<number, number>,
  tariffKey: string,
  period: number,
  employeeCount?: number
): TariffPricing | null {
  const config = tariffConfig[tariffKey];
  if (!config) return null;

  if (config.calcType === 'per_user' && config.tiers) {
    const employees = employeeCount ?? config.minUsers;
    if (!findIndividualTier(config.tiers, employees)) return null;
  }

  const employees = getTariffEmployeeCount(config, employeeCount);
  const basePrice = calculateBaseAmount(config, period, employeeCount);
  const discount = periodDiscounts[period] ?? 0;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));
  const monthlyPrice = Math.round(finalPrice / period);
  const savings = basePrice - finalPrice;
  let perEmployeeMonthlyBase: number;
  let perEmployeeMonthlyFinal: number;

  if (config.calcType === 'per_user' && config.tiers) {
    const tier = findIndividualTier(config.tiers, employees);
    if (!tier) return null;
    perEmployeeMonthlyBase = tier.pricePerUser;
    perEmployeeMonthlyFinal = Math.round(
      tier.pricePerUser * (1 - discount / 100)
    );
  } else {
    perEmployeeMonthlyBase = calculatePerEmployeeMonthly(
      basePrice,
      period,
      employees
    );
    perEmployeeMonthlyFinal = calculatePerEmployeeMonthly(
      finalPrice,
      period,
      employees
    );
  }

  return {
    tariff: config.name,
    period,
    basePrice,
    discount,
    savings,
    finalPrice,
    monthlyPrice,
    perEmployeeMonthlyBase,
    perEmployeeMonthlyFinal,
  };
}

/** Show base + discounted per-employee rows for long billing periods. */
export function showPerEmployeeDiscountBreakdown(period: number): boolean {
  return period === 6 || period === 12;
}

export function getIntegrationPricing(
  integrationPricing: IntegrationPricing[],
  employeeCount: number
): IntegrationPricing | null {
  return (
    integrationPricing.find(
      (p) =>
        employeeCount >= p.minEmployees && employeeCount <= p.maxEmployees
    ) ?? null
  );
}

export function getIndividualMinEmployees(
  tariffConfig: Record<string, TariffConfig>
): number {
  return tariffConfig.individual?.minUsers ?? 61;
}

/** Columns for the tariff grid modal (full period totals). */
export const TARIFF_GRID_PERIODS = [1, 6, 12] as const;

export function formatTariffGridUsersRange(minUsers: number, maxUsers: number): string {
  if (maxUsers >= 999999) return `${minUsers}+`;
  return `${minUsers}–${maxUsers}`;
}

export type TariffGridRow = {
  rowKey: string;
  tariffKey: string;
  name: string;
  minUsers: number;
  maxUsers: number;
  rangeLabel: string;
  /** Employee count passed into calculateTariffPricing (tier min for per_user). */
  employeeCountForPrice?: number;
};

/** One grid row per sheet entry — Individual tiers are not merged. */
export function buildTariffGridRows(
  tariffConfig: Record<string, TariffConfig>
): TariffGridRow[] {
  const rows: TariffGridRow[] = [];

  const tariffs = Object.values(tariffConfig).sort(
    (a, b) => a.minUsers - b.minUsers
  );

  for (const tariff of tariffs) {
    if (tariff.calcType === 'per_user' && tariff.tiers && tariff.tiers.length > 0) {
      const tiers = [...tariff.tiers].sort((a, b) => a.minUsers - b.minUsers);
      for (const tier of tiers) {
        rows.push({
          rowKey: `${tariff.key}-${tier.minUsers}-${tier.maxUsers}`,
          tariffKey: tariff.key,
          name: tariff.name,
          minUsers: tier.minUsers,
          maxUsers: tier.maxUsers,
          rangeLabel: formatTariffGridUsersRange(tier.minUsers, tier.maxUsers),
          employeeCountForPrice: tier.minUsers,
        });
      }
      continue;
    }

    rows.push({
      rowKey: tariff.key,
      tariffKey: tariff.key,
      name: tariff.name,
      minUsers: tariff.minUsers,
      maxUsers: tariff.maxUsers,
      rangeLabel: formatTariffGridUsersRange(tariff.minUsers, tariff.maxUsers),
    });
  }

  return rows;
}

/**
 * Final price for a tariff grid cell — same calculateTariffPricing as the main calculator.
 * Returns null when the period is not available for that tariff (show "—").
 */
export function getTariffGridPeriodPrice(
  tariffConfig: Record<string, TariffConfig>,
  periodDiscounts: Record<number, number>,
  tariffKey: string,
  period: number,
  employeeCount?: number
): number | null {
  const config = tariffConfig[tariffKey];
  if (!config || !config.periods.includes(period)) return null;

  const pricing = calculateTariffPricing(
    tariffConfig,
    periodDiscounts,
    tariffKey,
    period,
    employeeCount
  );

  return pricing?.finalPrice ?? null;
}

function resolveGridEmployeeCount(
  employeeCountInput: string,
  individualMin: number
): number {
  const count = parseInt(employeeCountInput, 10);
  return Number.isFinite(count) && count > 0 ? count : individualMin;
}

/**
 * Employee count for grid pricing via calculateTariffPricing.
 * Matching Individual tier uses the calculator input; other tiers use tier min.
 */
export function getTariffGridRowEmployeeCount(
  row: TariffGridRow,
  employeeCountInput: string,
  individualMin: number
): number | undefined {
  if (row.employeeCountForPrice == null) return undefined;

  const employees = resolveGridEmployeeCount(
    employeeCountInput,
    individualMin
  );
  if (employees >= row.minUsers && employees <= row.maxUsers) {
    return employees;
  }

  return row.employeeCountForPrice;
}

export function isTariffGridRowActive(
  row: TariffGridRow,
  selectedTariff: string | undefined,
  employeeCountInput: string,
  individualMin: number
): boolean {
  if (!selectedTariff || selectedTariff !== row.tariffKey) return false;

  if (row.employeeCountForPrice == null) return true;

  const employees = resolveGridEmployeeCount(
    employeeCountInput,
    individualMin
  );

  return employees >= row.minUsers && employees <= row.maxUsers;
}
