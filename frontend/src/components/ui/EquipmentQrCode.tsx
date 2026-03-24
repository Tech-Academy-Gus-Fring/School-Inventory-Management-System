import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, QrCode } from 'lucide-react';
import { toDataURL } from 'qrcode';
import type { Equipment } from '@/types/auth';

type QrVariant = 'thumb' | 'panel';

interface Props {
  item: Pick<Equipment, 'id' | 'name' | 'qr_code_value'>;
  variant?: QrVariant;
}

const THUMB_SIZE = {
  wrapper: 'w-10 h-10 rounded-lg',
  icon: 'w-4 h-4',
  pixels: 56,
};

const PANEL_SIZE = {
  wrapper: 'w-full rounded-2xl',
  icon: 'w-8 h-8',
  pixels: 224,
};

const sanitizeFileName = (value: string) => {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'equipment';
};

export const EquipmentQrCode: React.FC<Props> = ({ item, variant = 'thumb' }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrValue = item.qr_code_value || null;
  const size = variant === 'panel' ? PANEL_SIZE : THUMB_SIZE;

  useEffect(() => {
    let active = true;

    if (!qrValue) {
      setQrDataUrl(null);
      return () => {
        active = false;
      };
    }

    toDataURL(qrValue, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size.pixels,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((dataUrl: string) => {
        if (active) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setQrDataUrl(null);
        }
      });

    return () => {
      active = false;
    };
  }, [qrValue, size.pixels]);

  const handleCopy = async () => {
    if (!qrValue || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(qrValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!qrDataUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${sanitizeFileName(item.name)}-qr.png`;
    link.click();
  };

  if (variant === 'panel') {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4">
        <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-slate-900 p-4 min-h-[240px]">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`${item.name} QR code`}
              className="w-56 h-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <QrCode className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Equipment QR
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scan for item identity and inventory details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!qrValue}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Download className="w-3 h-3" />
              PNG
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (qrDataUrl) {
    return (
      <button
        type="button"
        onClick={handleDownload}
        className={`${size.wrapper} shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:border-blue-400 transition-colors`}
        title={`Download QR code for ${item.name}`}
      >
        <img src={qrDataUrl} alt={`${item.name} QR code`} className="w-full h-full object-cover" />
      </button>
    );
  }

  return (
    <div className={`${size.wrapper} shrink-0 flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800`}>
      <QrCode className={`${size.icon} text-slate-400 dark:text-slate-500`} />
    </div>
  );
};

export default EquipmentQrCode;
