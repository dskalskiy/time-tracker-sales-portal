'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function TariffCardSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="space-y-2 p-2.5 lg:p-3.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3.5 w-1/2" />
      </CardContent>
    </Card>
  );
}

function ParamsCardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="px-4 py-2.5">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TimeTrackerLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 lg:gap-3.5">
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4 lg:gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <TariffCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-3.5">
        <ParamsCardSkeleton lines={2} />
        <ParamsCardSkeleton lines={3} />
      </div>
    </div>
  );
}

export function IntegrationLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-3.5">
        <ParamsCardSkeleton lines={1} />
        <ParamsCardSkeleton lines={3} />
      </div>
      <Skeleton className="h-8 w-44 rounded-md" />
      <Card className="border-border shadow-sm">
        <CardHeader className="px-4 py-2.5">
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <IntegrationTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}

export function IntegrationTableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex gap-3 border-b border-border pb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16 ml-auto" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function EquipmentCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="h-[200px] w-full shrink-0 md:h-auto md:min-h-[220px] md:w-[200px] lg:w-[240px] rounded-none" />
        <CardContent className="flex flex-1 flex-col gap-4 p-4 md:p-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="space-y-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function EquipmentLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center">
        <Skeleton className="h-8 w-full rounded-md" />
        <Skeleton className="h-8 w-full rounded-md sm:w-[160px]" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <EquipmentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
