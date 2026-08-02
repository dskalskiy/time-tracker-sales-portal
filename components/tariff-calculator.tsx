'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  calculateTariffPricing,
  getIndividualMinEmployees,
  getTariffGridPeriodPrice,
  buildTariffGridRows,
  isTariffGridRowActive,
  showPerEmployeeDiscountBreakdown,
  TARIFF_GRID_PERIODS,
  type TariffGridRow,
} from '@/lib/pricing';
import type { TariffConfig } from '@/lib/types';
import { Users, Calculator, Check, Sparkles, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TotalPriceBlock } from '@/components/total-price-block';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
}

function formatPeriod(months: number): string {
  if (months === 1) return '1 мес.';
  if (months === 3) return '3 мес.';
  if (months === 6) return '6 мес.';
  if (months === 12) return '12 мес.';
  return `${months} мес.`;
}

function TariffGridDialog({
  title,
  tariffConfig,
  periodDiscounts,
  selectedTariff,
  employeeCount,
  individualMin,
}: {
  title: string;
  tariffConfig: Record<string, TariffConfig>;
  periodDiscounts: Record<number, number>;
  selectedTariff?: string;
  employeeCount: string;
  individualMin: number;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-fit gap-1.5 text-xs">
          <Table2 className="size-3.5" />
          Показать тарифную сетку
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 gap-3">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <TariffGridTable
          tariffConfig={tariffConfig}
          periodDiscounts={periodDiscounts}
          selectedTariff={selectedTariff}
          employeeCount={employeeCount}
          individualMin={individualMin}
        />
      </DialogContent>
    </Dialog>
  );
}

function TariffGridPeriodHeaders() {
  return (
    <>
      {TARIFF_GRID_PERIODS.map((period) => (
        <th
          key={period}
          className="text-right py-2 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap"
        >
          {period === 1
            ? '1 месяц'
            : period === 6
              ? '6 месяцев'
              : '12 месяцев'}
        </th>
      ))}
    </>
  );
}

function TariffGridSectionTable({
  rows,
  tariffConfig,
  periodDiscounts,
  selectedTariff,
  employeeCount,
  individualMin,
  showTariffName,
}: {
  rows: TariffGridRow[];
  tariffConfig: Record<string, TariffConfig>;
  periodDiscounts: Record<number, number>;
  selectedTariff?: string;
  employeeCount: string;
  individualMin: number;
  showTariffName: boolean;
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {showTariffName ? (
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                Тариф
              </th>
            ) : null}
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
              Диапазон сотрудников
            </th>
            <TariffGridPeriodHeaders />
            <th className="w-8 py-2 px-2" aria-label="Выбран" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isActive = isTariffGridRowActive(
              row,
              selectedTariff,
              employeeCount,
              individualMin
            );
            // Individual tiers: use tier min so calculateTariffPricing picks the right rate.
            // Standard fixed tariffs: omit employee count.
            const priceEmployees = row.employeeCountForPrice;

            return (
              <tr
                key={row.rowKey}
                className={cn(
                  'border-b border-border/50',
                  isActive && 'bg-primary/10'
                )}
              >
                {showTariffName ? (
                  <td className="py-2 px-3">
                    <span className="font-medium">{row.name}</span>
                  </td>
                ) : null}
                <td className="py-2 px-3 text-muted-foreground text-xs sm:text-sm tabular-nums">
                  {row.rangeLabel}
                </td>
                {TARIFF_GRID_PERIODS.map((period) => {
                  const amount = getTariffGridPeriodPrice(
                    tariffConfig,
                    periodDiscounts,
                    row.tariffKey,
                    period,
                    priceEmployees
                  );

                  return (
                    <td
                      key={period}
                      className="py-2 px-3 text-right tabular-nums whitespace-nowrap"
                    >
                      {amount == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="font-semibold text-brand-accent-bright">
                          {formatCurrency(amount)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center">
                  {isActive ? (
                    <Check
                      className="mx-auto size-3.5 text-brand-accent-bright"
                      aria-label="Выбранный тариф"
                    />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TariffGridTable({
  tariffConfig,
  periodDiscounts,
  selectedTariff,
  employeeCount,
  individualMin,
}: {
  tariffConfig: Record<string, TariffConfig>;
  periodDiscounts: Record<number, number>;
  selectedTariff?: string;
  employeeCount: string;
  individualMin: number;
}) {
  const { standard, individual } = useMemo(
    () => buildTariffGridRows(tariffConfig),
    [tariffConfig]
  );

  return (
    <div className="space-y-4">
      {standard.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="px-1 text-xs font-semibold text-foreground">
            Стандартные тарифы
          </h3>
          <TariffGridSectionTable
            rows={standard}
            tariffConfig={tariffConfig}
            periodDiscounts={periodDiscounts}
            selectedTariff={selectedTariff}
            employeeCount={employeeCount}
            individualMin={individualMin}
            showTariffName
          />
        </section>
      )}

      {individual.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="px-1 text-xs font-semibold text-foreground">
            Тариф Individual (стоимость за 1 сотрудника)
          </h3>
          <TariffGridSectionTable
            rows={individual}
            tariffConfig={tariffConfig}
            periodDiscounts={periodDiscounts}
            selectedTariff={selectedTariff}
            employeeCount={employeeCount}
            individualMin={individualMin}
            showTariffName={false}
          />
        </section>
      )}
    </div>
  );
}

export type TariffCalculatorProps = {
  tariffConfig: Record<string, TariffConfig>;
  periodDiscounts: Record<number, number>;
  /** Unique prefix for form control ids when multiple calculators are on the page */
  idPrefix?: string;
  /** Dialog title for the tariff grid modal */
  gridTitle: string;
};

/**
 * Shared tariff calculator for Time Tracker and KEDO.
 * Pricing logic lives in lib/pricing — pass only the tariff set from Sheets.
 */
export function TariffCalculator({
  tariffConfig,
  periodDiscounts,
  idPrefix = 'tariff',
  gridTitle,
}: TariffCalculatorProps) {
  const [selectedTariff, setSelectedTariff] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [employeeCount, setEmployeeCount] = useState<string>('');

  const individualMin = getIndividualMinEmployees(tariffConfig);

  const tariffOptions = useMemo(
    () =>
      Object.values(tariffConfig)
        .sort((a, b) => a.minUsers - b.minUsers)
        .map((config) => ({
          value: config.key,
          label: config.name,
          employees: config.employeesLabel,
          price: config.cardPriceLabel,
        })),
    [tariffConfig]
  );

  const availablePeriods = useMemo(() => {
    if (!selectedTariff) return [];
    return tariffConfig[selectedTariff]?.periods ?? [];
  }, [selectedTariff, tariffConfig]);

  const showEmployeeInput = selectedTariff === 'individual';

  const pricing = useMemo(() => {
    if (!selectedTariff || !selectedPeriod) return null;

    const employees = showEmployeeInput
      ? parseInt(employeeCount) || individualMin
      : undefined;

    return calculateTariffPricing(
      tariffConfig,
      periodDiscounts,
      selectedTariff,
      selectedPeriod,
      employees
    );
  }, [
    selectedTariff,
    selectedPeriod,
    employeeCount,
    showEmployeeInput,
    tariffConfig,
    periodDiscounts,
    individualMin,
  ]);

  const handleTariffChange = (value: string) => {
    const periods = tariffConfig[value]?.periods ?? [];

    let nextPeriod: number | null = null;
    if (selectedPeriod !== null && periods.includes(selectedPeriod)) {
      nextPeriod = selectedPeriod;
    } else if (periods.length > 0) {
      nextPeriod = periods[0];
    }

    setSelectedTariff(value);
    setSelectedPeriod(nextPeriod);
    setEmployeeCount('');
  };

  if (Object.keys(tariffConfig).length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 lg:gap-3.5">
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4 lg:gap-2.5">
        {tariffOptions.map((tariff) => {
          const isSelected = selectedTariff === tariff.value;

          return (
            <Card
              key={tariff.value}
              className={cn(
                'cursor-pointer transition-colors duration-150',
                isSelected
                  ? 'interactive-selected border-primary/55'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              )}
              onClick={() => handleTariffChange(tariff.value)}
            >
              <CardContent className="p-2.5">
                <div className="flex items-start justify-between gap-1">
                  <h3
                    className={cn(
                      'text-[13px] font-semibold leading-tight lg:text-[15px]',
                      isSelected && 'text-brand-accent-bright'
                    )}
                  >
                    {tariff.label}
                  </h3>
                  {isSelected && (
                    <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary lg:size-5">
                      <Check className="size-2.5 text-primary-foreground lg:size-3" />
                    </div>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground lg:text-xs">
                  {tariff.employees}
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-tight lg:text-[13px]">
                  {tariff.price}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 lg:gap-3.5 lg:items-stretch">
        <Card>
          <CardHeader className="px-4 py-2.5">
            <CardTitle className="text-sm font-semibold">Параметры</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            {!selectedTariff ? (
              <div className="space-y-3">
                <p className="py-3 text-center text-xs text-muted-foreground">
                  Выберите тариф
                </p>
                <TariffGridDialog
                  title={gridTitle}
                  tariffConfig={tariffConfig}
                  periodDiscounts={periodDiscounts}
                  selectedTariff={selectedTariff}
                  employeeCount={employeeCount}
                  individualMin={individualMin}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  {availablePeriods.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Период</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {availablePeriods.map((period) => {
                          const discount = periodDiscounts[period] || 0;
                          const isActive = selectedPeriod === period;

                          return (
                            <button
                              key={period}
                              type="button"
                              onClick={() => setSelectedPeriod(period)}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                                isActive
                                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                  : 'border-border bg-muted/40 text-foreground hover:border-primary/50 hover:bg-muted/60'
                              )}
                            >
                              {formatPeriod(period)}
                              {discount > 0 && (
                                <span
                                  className={cn(
                                    'rounded px-1 py-px text-[10px] font-bold leading-none',
                                    isActive
                                      ? 'bg-primary-foreground/20 text-primary-foreground'
                                      : 'bg-success/15 text-success'
                                  )}
                                >
                                  −{discount}%
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showEmployeeInput && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`${idPrefix}-employees`}
                        className="text-xs text-muted-foreground"
                      >
                        Количество сотрудников
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id={`${idPrefix}-employees`}
                          type="number"
                          min={individualMin}
                          placeholder={`От ${individualMin}`}
                          value={employeeCount}
                          onChange={(e) => setEmployeeCount(e.target.value)}
                          className="portal-field-input h-8 pl-8 text-sm focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <TariffGridDialog
                  title={gridTitle}
                  tariffConfig={tariffConfig}
                  periodDiscounts={periodDiscounts}
                  selectedTariff={selectedTariff}
                  employeeCount={employeeCount}
                  individualMin={individualMin}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader className="px-4 py-2.5">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Calculator className="size-3.5 text-brand-accent-bright" />
              Расчёт
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            {pricing ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between gap-2 border-b border-border/40 py-1">
                    <span className="text-muted-foreground">Тариф</span>
                    <span className="font-medium text-brand-accent-bright">{pricing.tariff}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-border/40 py-1">
                    <span className="text-muted-foreground">Период</span>
                    <span className="font-medium">{formatPeriod(pricing.period)}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-border/40 py-1">
                    <span className="text-muted-foreground">Скидка</span>
                    <Badge
                      variant={pricing.discount > 0 ? 'default' : 'secondary'}
                      className={cn(
                        'h-5 px-1.5 text-[10px]',
                        pricing.discount > 0 && 'bg-success text-success-foreground'
                      )}
                    >
                      {pricing.discount > 0 ? `−${pricing.discount}%` : '—'}
                    </Badge>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-border/40 py-1">
                    <span className="text-muted-foreground">В месяц</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(pricing.monthlyPrice)}
                    </span>
                  </div>
                  {showPerEmployeeDiscountBreakdown(pricing.period) ? (
                    <div className="col-span-2 border-b border-border/40 py-1">
                      <span className="text-muted-foreground">Стоимость за сотрудника</span>
                      <div className="mt-0.5 flex justify-between gap-2 text-[11px]">
                        <span className="text-muted-foreground">Без скидки</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatCurrency(pricing.perEmployeeMonthlyBase)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 text-[11px]">
                        <span className="text-muted-foreground">Со скидкой</span>
                        <span className="font-medium tabular-nums text-brand-accent-bright">
                          {formatCurrency(pricing.perEmployeeMonthlyFinal)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 flex justify-between gap-2 border-b border-border/40 py-1">
                      <span className="text-muted-foreground">Стоимость за сотрудника</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(pricing.perEmployeeMonthlyFinal)}
                      </span>
                    </div>
                  )}
                </div>

                {pricing.savings > 0 && (
                  <div className="flex items-center justify-between rounded-md border border-success/20 bg-success/10 px-2.5 py-1 text-xs">
                    <span className="flex items-center gap-1 font-medium text-success">
                      <Sparkles className="size-3" />
                      Экономия
                    </span>
                    <span className="font-semibold text-success">
                      {formatCurrency(pricing.savings)}
                    </span>
                  </div>
                )}

                {pricing.discount > 0 && (
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Без скидки</span>
                    <span className="line-through">{formatCurrency(pricing.basePrice)}</span>
                  </div>
                )}

                <TotalPriceBlock amount={formatCurrency(pricing.finalPrice)} />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-4 text-center">
                <Calculator className="size-4 shrink-0 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">
                  {selectedTariff
                    ? showEmployeeInput && !employeeCount
                      ? 'Введите количество сотрудников'
                      : 'Выберите период'
                    : 'Выберите тариф и период'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
