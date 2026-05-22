import { normalizeImageUrl } from '@/lib/normalize-image-url';
import { parseNumber } from '@/services/googleSheets';
import type { SheetRow } from '@/services/googleSheets';
import type {
  Equipment,
  IntegrationPricing,
  SalesData,
  TariffConfig,
  TariffTier,
} from '@/lib/types';

function formatUsersRange(min: number, max: number): string {
  if (max >= 999999) return `${min}+ сотрудников`;
  return `${min}–${max} сотрудников`;
}

function formatPriceLabel(amount: number, suffix: string): string {
  return (
    new Intl.NumberFormat('ru-RU').format(amount) + ' ₸ / ' + suffix
  );
}

function tariffKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Available payment periods per tariff (business rules). */
export function getPeriodsForTariff(key: string): number[] {
  if (key === 'light') {
    return [3, 6, 12];
  }
  if (key === 'base' || key === 'medium' || key === 'individual') {
    return [1, 6, 12];
  }
  return [1, 6, 12];
}

export function mapDiscounts(rows: SheetRow[]): Record<number, number> {
  const discounts: Record<number, number> = {};

  rows.forEach((row) => {
    const period = parseNumber(row.period_months);
    if (period > 0) {
      discounts[period] = parseNumber(row.discount_percent);
    }
  });

  return discounts;
}

export function mapTariffConfig(
  rows: SheetRow[],
  _periodDiscounts: Record<number, number>
): Record<string, TariffConfig> {
  const grouped = new Map<string, SheetRow[]>();

  rows.forEach((row) => {
    const name = String(row.tariff_name ?? '').trim();
    if (!name) return;
    const list = grouped.get(name) ?? [];
    list.push(row);
    grouped.set(name, list);
  });

  const config: Record<string, TariffConfig> = {};

  grouped.forEach((tariffRows, name) => {
    const key = tariffKey(name);
    const sorted = [...tariffRows].sort(
      (a, b) => parseNumber(a.min_users) - parseNumber(b.min_users)
    );
    const first = sorted[0];
    const minUsers = parseNumber(first.min_users);
    const maxUsers = parseNumber(sorted[sorted.length - 1].max_users);
    const calcType = String(first.calc_type ?? 'fixed') as 'fixed' | 'per_user';
    const basePeriod = String(first.base_period ?? 'month') as 'quarter' | 'month';

    if (calcType === 'per_user') {
      const tiers: TariffTier[] = sorted.map((row) => ({
        minUsers: parseNumber(row.min_users),
        maxUsers: parseNumber(row.max_users),
        pricePerUser: parseNumber(row.price),
      }));
      const minTierPrice = Math.min(...tiers.map((t) => t.pricePerUser));

      config[key] = {
        key,
        name,
        minUsers,
        maxUsers,
        employeesLabel: formatUsersRange(minUsers, maxUsers),
        calcType,
        basePeriod,
        price: minTierPrice,
        tiers,
        periods: getPeriodsForTariff(key),
        cardPriceLabel: `от ${new Intl.NumberFormat('ru-RU').format(minTierPrice)} ₸ / сотрудник`,
      };
    } else {
      const price = parseNumber(first.price);
      const periodSuffix = basePeriod === 'quarter' ? 'квартал' : 'месяц';

      config[key] = {
        key,
        name,
        minUsers,
        maxUsers,
        employeesLabel: formatUsersRange(minUsers, maxUsers),
        calcType,
        basePeriod,
        price,
        periods: getPeriodsForTariff(key),
        cardPriceLabel: formatPriceLabel(price, periodSuffix),
      };
    }
  });

  return config;
}

export function mapIntegrationPricing(rows: SheetRow[]): IntegrationPricing[] {
  return rows
    .map((row) => {
      const minEmployees = parseNumber(row.min_users);
      const maxEmployees = parseNumber(row.max_users);
      const retailPrice = parseNumber(row.retail_price);
      const discount = parseNumber(row.partner_discount_percent);
      const salePrice = parseNumber(row.sale_price) || retailPrice;

      return {
        range:
          maxEmployees >= 999999
            ? `${minEmployees}+`
            : `${minEmployees}–${maxEmployees}`,
        minEmployees,
        maxEmployees,
        retailPrice,
        discount,
        salePrice,
      };
    })
    .filter((row) => row.minEmployees > 0)
    .sort((a, b) => a.minEmployees - b.minEmployees);
}

export function mapEquipment(rows: SheetRow[]): Equipment[] {
  return rows
    .filter((row) => {
      const active = String(row.active ?? 'true').trim().toUpperCase();
      return active === 'TRUE' || active === '1' || active === 'YES';
    })
    .map((row, index) => {
      const retailPrice = parseNumber(row.retail_price);
      const discount = parseNumber(row.discount_percent);
      const salePrice = parseNumber(row.sale_price) || retailPrice;
      const pdfUrl = String(row.pdf_url ?? '').trim();
      const manufacturerUrl = String(row.manufacturer_url ?? '').trim();
      const imageUrl = String(row.image_url ?? '').trim();
      const image = normalizeImageUrl(imageUrl);

      return {
        id: String(index + 1),
        category: String(row.category ?? '').trim(),
        name: String(row.name ?? '').trim(),
        imageUrl,
        image,
        retailPrice,
        discount,
        salePrice,
        comment: String(row.comment ?? '').trim(),
        ...(pdfUrl ? { pdfUrl } : {}),
        ...(manufacturerUrl ? { manufacturerUrl } : {}),
      };
    })
    .filter((item) => item.name.length > 0);
}

export function buildSalesData(raw: {
  tariffs: SheetRow[];
  integration: SheetRow[];
  equipment: SheetRow[];
  discounts: SheetRow[];
}): SalesData {
  const periodDiscounts = mapDiscounts(raw.discounts);
  const tariffConfig = mapTariffConfig(raw.tariffs, periodDiscounts);
  const integrationPricing = mapIntegrationPricing(raw.integration);
  const equipmentData = mapEquipment(raw.equipment);

  const categories = [
    'Все',
    ...Array.from(new Set(equipmentData.map((item) => item.category))).filter(Boolean),
  ];

  return {
    tariffConfig,
    periodDiscounts,
    integrationPricing,
    equipmentData,
    equipmentCategories: categories,
  };
}

export function validateSalesData(data: SalesData): void {
  if (Object.keys(data.tariffConfig).length === 0) {
    throw new Error('No tariff data found in TimeTracker_Tariffs');
  }
  if (data.integrationPricing.length === 0) {
    throw new Error('No integration pricing data found');
  }
  if (data.equipmentData.length === 0) {
    throw new Error('No equipment data found');
  }
}
