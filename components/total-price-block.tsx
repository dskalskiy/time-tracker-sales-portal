import { cn } from '@/lib/utils';

type TotalPriceBlockProps = {
  label?: string;
  amount: string;
  className?: string;
};

export function TotalPriceBlock({
  label = 'Итого',
  amount,
  className,
}: TotalPriceBlockProps) {
  return (
    <div
      className={cn(
        'total-price-block flex items-end justify-between rounded-md px-3 py-2.5',
        className
      )}
    >
      <span className="text-sm font-medium text-foreground/90">{label}</span>
      <span className="total-price text-xl lg:text-2xl">{amount}</span>
    </div>
  );
}
