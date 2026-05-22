'use client';

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSalesData } from '@/contexts/sales-data-context';
import type { Equipment } from '@/lib/types';
import {
  Search,
  FileText,
  ExternalLink,
  Percent,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  IMAGE_PLACEHOLDER,
  buildCacheBustedImageUrl,
  normalizeImageUrl,
} from '@/lib/normalize-image-url';

function EquipmentImage({
  name,
  originalImageUrl,
  className,
  style,
}: {
  name: string;
  originalImageUrl: string;
  className?: string;
  style?: CSSProperties;
}) {
  const normalizedUrl = useMemo(
    () => normalizeImageUrl(originalImageUrl),
    [originalImageUrl]
  );
  const finalImageUrl = useMemo(
    () => buildCacheBustedImageUrl(normalizedUrl, name),
    [normalizedUrl, name]
  );

  const [useFallback, setUseFallback] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    setUseFallback(false);
    loadedRef.current = false;
  }, [finalImageUrl]);

  const displaySrc = useFallback ? IMAGE_PLACEHOLDER : finalImageUrl;
  const imgKey = useFallback ? `fallback-${finalImageUrl}` : finalImageUrl;

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col items-center justify-center">
      <img
        key={imgKey}
        src={displaySrc}
        alt={name}
        className={className}
        style={style}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => {
          loadedRef.current = true;
        }}
        onError={(event) => {
          if (useFallback || loadedRef.current) return;

          const img = event.currentTarget;
          if (img.naturalWidth > 0) return;

          console.log('Equipment image load error:', {
            name,
            originalImageUrl: originalImageUrl || '(empty)',
            normalizedUrl,
            finalImageUrl,
            event,
          });

          setUseFallback(true);
        }}
      />
      {useFallback && (
        <p className="absolute bottom-1 left-1 right-1 z-[3] break-all px-1 text-center text-[9px] leading-tight text-muted-foreground/90">
          {finalImageUrl}
        </p>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
}

const imageBackdropClass = cn(
  'relative',
  'bg-gradient-to-br from-brand/35 via-brand-muted/25 to-background',
  'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.08),transparent_62%)]'
);

function ImagePreviewModal({
  item,
  open,
  onOpenChange,
}: {
  item: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [zoom, setZoom] = useState(1);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setZoom(1);
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden border-border/60 bg-background p-0 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">{item.name}</DialogTitle>

        <div
          className={cn(
            'relative flex min-h-[50vh] items-center justify-center overflow-auto p-4 sm:min-h-[60vh]',
            imageBackdropClass
          )}
        >
          <EquipmentImage
            key={`${item.name}-${item.imageUrl}`}
            name={item.name}
            originalImageUrl={item.imageUrl}
            className="relative z-[1] max-h-[70vh] w-auto max-w-full object-contain transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/50 bg-card/80 px-4 py-3">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9"
              onClick={zoomOut}
              disabled={zoom <= 1}
              title="Уменьшить"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9"
              onClick={zoomIn}
              disabled={zoom >= 3}
              title="Увеличить"
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="ml-1 h-9"
              onClick={() => setZoom(1)}
              disabled={zoom === 1}
            >
              Сброс
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EquipmentCard({ item }: { item: Equipment }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden border-border shadow-sm transition-colors hover:border-primary/40">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className={cn(
              'group/img relative shrink-0 overflow-hidden text-left',
              'w-full md:w-[200px] lg:w-[240px] xl:w-[260px]',
              'h-[200px] md:h-auto md:min-h-[220px] md:self-stretch',
              imageBackdropClass,
              'cursor-zoom-in border-b border-border/30 md:border-b-0 md:border-r'
            )}
            aria-label={`Увеличить: ${item.name}`}
          >
            <EquipmentImage
              key={`${item.name}-${item.imageUrl}`}
              name={item.name}
              originalImageUrl={item.imageUrl}
              className="relative z-[1] h-full w-full object-contain p-4 transition-transform duration-200 group-hover/img:scale-[1.02]"
            />
            <div className="absolute bottom-2 right-2 z-[2] flex items-center gap-1 rounded-md bg-background/60 px-2 py-1 text-[11px] text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover/img:opacity-100 md:opacity-70">
              <Maximize2 className="size-3" />
              Увеличить
            </div>
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 z-[2] border-0 bg-background/75 backdrop-blur-sm"
            >
              {item.category}
            </Badge>
          </button>

          {/* Info */}
          <CardContent className="flex flex-1 flex-col gap-4 p-4 md:p-5 lg:p-6">
            <div className="space-y-2">
              <h3 className="text-base font-semibold leading-snug md:text-lg">
                {item.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.comment}
              </p>
            </div>

            <div className="space-y-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Розничная цена</span>
                <span
                  className={cn(
                    'font-medium',
                    item.discount > 0 && 'text-muted-foreground line-through'
                  )}
                >
                  {formatCurrency(item.retailPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Скидка</span>
                {item.discount > 0 ? (
                  <Badge className="bg-success/20 text-success border-success/30 px-2.5 py-0.5">
                    <Percent className="mr-1 size-3.5" />
                    −{item.discount}%
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              <div className="total-price-block flex items-center justify-between gap-3 border-0 pt-2.5">
                <span className="font-medium text-foreground/90">Цена продажи</span>
                <span className="total-price text-xl md:text-2xl">
                  {formatCurrency(item.salePrice)}
                </span>
              </div>
            </div>

            {(item.pdfUrl || item.manufacturerUrl) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {item.pdfUrl && (
                  <Button
                    variant="outline"
                    size="default"
                    className="h-10 gap-2 px-4"
                    onClick={() => window.open(item.pdfUrl, '_blank')}
                  >
                    <FileText className="size-4" />
                    PDF
                  </Button>
                )}
                {item.manufacturerUrl && (
                  <Button
                    variant="outline"
                    size="default"
                    className="h-10 gap-2 px-4"
                    onClick={() => window.open(item.manufacturerUrl, '_blank')}
                  >
                    <ExternalLink className="size-4" />
                    Сайт
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      <ImagePreviewModal
        item={item}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  );
}

export function EquipmentCatalog() {
  const { data } = useSalesData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');

  const equipmentData = data?.equipmentData ?? [];
  const equipmentCategories = data?.equipmentCategories ?? ['Все'];

  const filteredEquipment = useMemo(() => {
    return equipmentData.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.comment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'Все' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, equipmentData]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Все: equipmentData.length };
    equipmentData.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [equipmentData]);

  const hasFilters = searchQuery.length > 0 || selectedCategory !== 'Все';

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Search & filter — compact */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-border/60 bg-background/50 pl-8 text-sm"
          />
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 w-full border-border/60 bg-background/50 text-sm sm:w-[160px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              {equipmentCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  <span className="flex w-full items-center justify-between gap-2">
                    {category}
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {categoryCounts[category] || 0}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 px-2 text-xs"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Все');
              }}
            >
              Сбросить
            </Button>
          )}
        </div>
      </div>

      {/* 2 cards per row on desktop */}
      {filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          {filteredEquipment.map((item) => (
            <EquipmentCard
              key={`${item.name}-${item.imageUrl}`}
              item={item}
            />
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Search className="mx-auto mb-3 size-8 text-muted-foreground/50" />
            <h3 className="text-base font-semibold">Ничего не найдено</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Измените параметры поиска
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
