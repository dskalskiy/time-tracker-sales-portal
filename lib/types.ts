export interface TariffTier {
  minUsers: number;
  maxUsers: number;
  pricePerUser: number;
}

export interface TariffConfig {
  key: string;
  name: string;
  minUsers: number;
  maxUsers: number;
  employeesLabel: string;
  calcType: 'fixed' | 'per_user';
  basePeriod: 'quarter' | 'month';
  price: number;
  tiers?: TariffTier[];
  periods: number[];
  cardPriceLabel: string;
}

export interface TariffPricing {
  tariff: string;
  period: number;
  basePrice: number;
  discount: number;
  savings: number;
  finalPrice: number;
  monthlyPrice: number;
  /** Per employee per month, before period discount */
  perEmployeeMonthlyBase: number;
  /** Per employee per month, after period discount */
  perEmployeeMonthlyFinal: number;
}

export interface IntegrationPricing {
  range: string;
  minEmployees: number;
  maxEmployees: number;
  retailPrice: number;
  discount: number;
  salePrice: number;
}

export interface Equipment {
  id: string;
  category: string;
  name: string;
  /** Original image_url from Google Sheets */
  imageUrl: string;
  /** Normalized URL for <img src> */
  image: string;
  retailPrice: number;
  discount: number;
  salePrice: number;
  comment: string;
  pdfUrl?: string;
  manufacturerUrl?: string;
}

export interface SalesData {
  tariffConfig: Record<string, TariffConfig>;
  periodDiscounts: Record<number, number>;
  integrationPricing: IntegrationPricing[];
  equipmentData: Equipment[];
  equipmentCategories: string[];
}

export type SalesDataErrorCode =
  | 'LOAD_ERROR'
  | 'SHEET_UNAVAILABLE'
  | 'NO_DATA';

export interface SalesDataError {
  code: SalesDataErrorCode;
  message: string;
}
