export interface ParsedBarcodePayload {
  raw: string;
  name: string | null;
  serial: string | null;
}

const BARCODE_PREFIX = 'SIMS|';

const normalizeValue = (value: string | null | undefined) => value?.trim() ?? '';

export const buildInventoryBarcodeValue = (name: string, serial: string) => {
  const normalizedName = normalizeValue(name);
  const normalizedSerial = normalizeValue(serial);

  const params = new URLSearchParams();
  params.set('name', normalizedName);
  params.set('serial', normalizedSerial);

  return `${BARCODE_PREFIX}${params.toString()}`;
};

export const parseInventoryBarcodeValue = (value: string): ParsedBarcodePayload => {
  const raw = normalizeValue(value);

  if (!raw.startsWith(BARCODE_PREFIX)) {
    return {
      raw,
      name: null,
      serial: raw || null,
    };
  }

  const params = new URLSearchParams(raw.slice(BARCODE_PREFIX.length));
  const name = normalizeValue(params.get('name'));
  const serial = normalizeValue(params.get('serial'));

  return {
    raw,
    name: name || null,
    serial: serial || null,
  };
};
