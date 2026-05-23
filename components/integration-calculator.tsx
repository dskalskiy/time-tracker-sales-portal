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
import { useSalesData } from '@/contexts/sales-data-context';
import { getIntegrationPricing } from '@/lib/pricing';
import type { IntegrationPricing } from '@/lib/types';
import { Users, Percent, Calculator, Settings, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TotalPriceBlock } from '@/components/total-price-block';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
}

function IntegrationPricingTable({
  rows,
  activeRange,
}: {
  rows: IntegrationPricing[];
  activeRange?: string;
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
              Диапазон
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
              Розница
            </th>
            <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">
              Скидка
            </th>
            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
              Продажа
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr
              key={index}
              className={cn(
                'border-b border-border/50',
                activeRange === item.range && 'bg-primary/10'
              )}
            >
              <td className="py-2 px-3">
                <span className="font-medium">{item.range}</span>
                <span className="ml-1 text-muted-foreground text-xs">сотр.</span>
              </td>
              <td className="py-2 px-3 text-right text-muted-foreground">
                {formatCurrency(item.retailPrice)}
              </td>
              <td className="py-2 px-3 text-center">
                {item.discount > 0 ? (
                  <Badge className="h-5 bg-success/20 text-success border-success/30 text-[10px]">
                    −{item.discount}%
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-2 px-3 text-right font-semibold text-brand-accent-bright">
                {formatCurrency(item.salePrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IntegrationCalculator() {
  const { data } = useSalesData();
  const [employeeCount, setEmployeeCount] = useState<string>('');

  const integrationPricing = data?.integrationPricing ?? [];
  const employees = parseInt(employeeCount) || 0;
  const pricing = useMemo(
    () => getIntegrationPricing(integrationPricing, employees),
    [integrationPricing, employees]
  );
  const totalPrice = pricing ? pricing.salePrice * employees : 0;

  if (!data) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-3.5">
        {/* Parameters */}
        <Card>
          <CardHeader className="px-4 py-2.5">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Settings className="size-3.5 text-brand-accent-bright" />
              Параметры
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="employees" className="text-xs text-muted-foreground">
                Количество сотрудников
              </Label>
              <div className="relative">
                <Users className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="employees"
                  type="number"
                  min="1"
                  placeholder="Введите количество"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className="portal-field-input h-8 pl-8 text-sm focus-visible:ring-0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border-primary/30">
          <CardHeader className="px-4 py-2.5">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Calculator className="size-3.5 text-brand-accent-bright" />
              Расчёт
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3.5 pt-0">
            {pricing && employees > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between gap-2 border-b border-border/40 py-1">
                    <span className="text-muted-foreground">Диапазон</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      {pricing.range}
                    </Badge>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-border/40 py-1">
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      <Percent className="size-3" />
                      Скидка
                    </span>
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
                    <span className="text-muted-foreground">Розница / сотрудник</span>
                    <span className="font-medium">{formatCurrency(pricing.retailPrice)}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-border/40 py-1">
                    <span className="text-muted-foreground">Продажа / сотрудник</span>
                    <span className="font-semibold text-brand-accent-bright">
                      {formatCurrency(pricing.salePrice)}
                    </span>
                  </div>
                </div>

                <p className="text-center text-sm font-medium text-foreground/90 pt-0.5">
                  {employees} сотрудников × {formatCurrency(pricing.salePrice)}
                </p>

                <TotalPriceBlock amount={formatCurrency(totalPrice)} />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-6 text-center">
                <Calculator className="size-4 shrink-0 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">
                  Введите количество сотрудников
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-fit gap-1.5 text-xs">
            <Table2 className="size-3.5" />
            Показать тарифную сетку
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-base">Тарифная сетка интеграции</DialogTitle>
          </DialogHeader>
          <IntegrationPricingTable
            rows={integrationPricing}
            activeRange={pricing?.range}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
