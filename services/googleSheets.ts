const SPREADSHEET_ID = '1jvcCcCKm3FPFLT3KK6b8j5sKMwS1L0ZAwOghIZf2i1E';

export const SHEET_NAMES = {
  tariffs: 'TimeTracker_Tariffs',
  integration: 'Integration_Prices',
  equipment: 'Equipment',
  discounts: 'Discounts',
} as const;

type SheetName = (typeof SHEET_NAMES)[keyof typeof SHEET_NAMES];

export type SheetRow = Record<string, string | number | null>;

interface GvizCell {
  v: string | number | null;
  f?: string;
}

interface GvizResponse {
  status: string;
  table?: {
    cols: { label: string }[];
    rows: { c: (GvizCell | null)[] }[];
  };
}

function getSheetUrl(sheetName: SheetName): string {
  const params = new URLSearchParams({
    tqx: 'out:json',
    sheet: sheetName,
  });
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?${params}`;
}

function parseGvizResponse(text: string): GvizResponse {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Invalid Google Sheets response format');
  }
  return JSON.parse(text.slice(start, end + 1)) as GvizResponse;
}

export function parseNumber(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  const normalized = String(value).replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function cellValue(cell: GvizCell | null | undefined): string | number | null {
  if (!cell) return null;
  return cell.v ?? null;
}

export async function fetchSheetRows(sheetName: SheetName): Promise<SheetRow[]> {
  const response = await fetch(getSheetUrl(sheetName), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Sheet "${sheetName}" unavailable (${response.status})`);
  }

  const text = await response.text();
  const data = parseGvizResponse(text);

  if (data.status !== 'ok' || !data.table) {
    throw new Error(`Sheet "${sheetName}" returned invalid data`);
  }

  const headers = data.table.cols
    .map((col) => col.label?.trim() ?? '')
    .filter(Boolean);

  if (headers.length === 0) {
    return [];
  }

  return data.table.rows
    .map((row) => {
      const record: SheetRow = {};
      headers.forEach((header, index) => {
        record[header] = cellValue(row.c[index]);
      });
      return record;
    })
    .filter((row) =>
      Object.values(row).some((value) => value != null && String(value).trim() !== '')
    );
}

export async function fetchAllSheets(): Promise<{
  tariffs: SheetRow[];
  integration: SheetRow[];
  equipment: SheetRow[];
  discounts: SheetRow[];
}> {
  const [tariffs, integration, equipment, discounts] = await Promise.all([
    fetchSheetRows(SHEET_NAMES.tariffs),
    fetchSheetRows(SHEET_NAMES.integration),
    fetchSheetRows(SHEET_NAMES.equipment),
    fetchSheetRows(SHEET_NAMES.discounts),
  ]);

  return { tariffs, integration, equipment, discounts };
}
