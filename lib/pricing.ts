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

  const basePrice = calculateBaseAmount(config, period, employeeCount);
  const discount = periodDiscounts[period] ?? 0;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));
  const monthlyPrice = Math.round(finalPrice / period);
  const savings = basePrice - finalPrice;

  return {
    tariff: config.name,
    period,
    basePrice,
    discount,
    savings,
    finalPrice,
    monthlyPrice,
  };
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
