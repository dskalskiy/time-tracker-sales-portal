'use client';

import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeTrackerCalculator } from '@/components/time-tracker-calculator';
import { IntegrationCalculator } from '@/components/integration-calculator';
import { EquipmentCatalog } from '@/components/equipment-catalog';
import { Clock, Settings, Package } from 'lucide-react';
import { SalesDataProvider, useSalesData } from '@/contexts/sales-data-context';
import { DataError, useDataLoading } from '@/components/data-state';
import {
  TimeTrackerLoadingSkeleton,
  IntegrationLoadingSkeleton,
  EquipmentLoadingSkeleton,
} from '@/components/data-loading-skeletons';
import { PortalGate } from '@/components/portal-gate';

function PortalMain() {
  const { status } = useSalesData();
  const isLoading = useDataLoading();

  if (status === 'error') {
    return <DataError />;
  }

  return (
    <Tabs defaultValue="timetracker" className="space-y-3 lg:space-y-4">
      <TabsList className="grid h-9 w-full grid-cols-3 border border-border bg-muted/60 p-0.5 sm:inline-flex sm:w-auto">
        <TabsTrigger value="timetracker" className="gap-1.5 text-xs sm:text-sm">
          <Clock className="size-3.5 sm:size-4" />
          Тарифы
        </TabsTrigger>
        <TabsTrigger value="integration" className="gap-1.5 text-xs sm:text-sm">
          <Settings className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Интеграция</span>
          <span className="sm:hidden">Интегр.</span>
        </TabsTrigger>
        <TabsTrigger value="equipment" className="gap-1.5 text-xs sm:text-sm">
          <Package className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Оборудование</span>
          <span className="sm:hidden">Оборуд.</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="timetracker" className="mt-3 outline-none">
        <div className="space-y-3">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h2 className="text-base font-semibold lg:text-lg">Калькулятор тарифов</h2>
            <p className="text-xs text-muted-foreground">
              Расчёт стоимости подписки Time Tracker
            </p>
          </div>
          {isLoading ? <TimeTrackerLoadingSkeleton /> : <TimeTrackerCalculator />}
        </div>
      </TabsContent>

      <TabsContent value="integration" className="mt-3 outline-none">
        <div className="space-y-3">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h2 className="text-base font-semibold lg:text-lg">Интеграция оборудования</h2>
            <p className="text-xs text-muted-foreground">
              Расчёт стоимости ПО для интеграции
            </p>
          </div>
          {isLoading ? <IntegrationLoadingSkeleton /> : <IntegrationCalculator />}
        </div>
      </TabsContent>

      <TabsContent value="equipment" className="mt-3 outline-none">
        <div className="space-y-3">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <h2 className="text-base font-semibold lg:text-lg">Каталог оборудования</h2>
            <p className="text-xs text-muted-foreground">
              Терминалы, считыватели, контроллеры
            </p>
          </div>
          {isLoading ? <EquipmentLoadingSkeleton /> : <EquipmentCatalog />}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function SalesPortal() {
  return (
    <PortalGate>
      <SalesDataProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <header className="sticky top-0 z-50 border-b border-border/80 bg-gradient-to-r from-[#2A2766]/45 via-[#15152a]/98 to-card/98 backdrop-blur-md">
            <div className="container mx-auto flex items-center px-4 py-2 lg:px-6">
              <div className="flex flex-col items-start gap-0.5 leading-none">
                <Image
                  src="/time-tracker-logo.png"
                  alt="Time Tracker"
                  width={120}
                  height={40}
                  className="h-7 w-auto shrink-0 object-contain object-left sm:h-8"
                  priority
                />
                <span className="text-[11px] text-muted-foreground">Портал продаж</span>
              </div>
            </div>
          </header>

          <main className="container mx-auto flex-1 px-4 py-4 lg:px-6 lg:py-5">
            <PortalMain />
          </main>

          <footer className="mt-auto hidden border-t border-border/50 lg:block">
            <div className="container mx-auto px-4 py-2 lg:px-6">
              <p className="text-center text-xs text-muted-foreground">
                Time Tracker · Портал продаж © 2026
              </p>
            </div>
          </footer>
        </div>
      </SalesDataProvider>
    </PortalGate>
  );
}
