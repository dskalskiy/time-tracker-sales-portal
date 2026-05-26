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
