'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSalesData } from '@/contexts/sales-data-context';
import {
  calculateTariffPricing,
  getIndividualMinEmployees,
  showPerEmployeeDiscountBreakdown,
} from '@/lib/pricing';
import { Users, Calculator, Check, Sparkles } from 'lucide-react';
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

export function TimeTrackerCalculator() {
  const { data } = useSalesData();
  const [selectedTariff, setSelectedTariff] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [employeeCount, setEmployeeCount] = useState<string>('');

  const tariffConfig = data?.tariffConfig ?? {};
  const periodDiscounts = data?.periodDiscounts ?? {};
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

  if (!data) return null;

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
              <CardContent className="p-2.5 lg:p-3.5">
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
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground lg:mt-1 lg:text-xs">
                  {tariff.employees}
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-tight lg:mt-2 lg:text-[13px]">
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
          <CardContent className="space-y-3 px-4 pb-4 pt-0">
            {!selectedTariff ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Выберите тариф
              </p>
            ) : (
              <>
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
                    <Label htmlFor="employees" className="text-xs text-muted-foreground">
                      Количество сотрудников
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="employees"
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
              </>
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
          <CardContent className="px-4 pb-4 pt-0">
            {pricing ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
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
                    <div className="col-span-2 space-y-0.5 border-b border-border/40 py-1.5">
                      <span className="text-muted-foreground">Стоимость за сотрудника</span>
                      <div className="flex justify-between gap-2 pl-0 text-[11px]">
                        <span className="text-muted-foreground">Без скидки</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatCurrency(pricing.perEmployeeMonthlyBase)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
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
                  <div className="flex items-center justify-between rounded-md border border-success/20 bg-success/10 px-2.5 py-1.5 text-xs">
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
              <div className="flex items-center justify-center gap-2 py-6 text-center">
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
