import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

const PDF_MAGIC = '%PDF-';

/**
 * @param {string | null | undefined} contentDisposition
 */
export function invoicePdfFilename(contentDisposition) {
  const match = /filename="([^"]+)"/i.exec(String(contentDisposition ?? ''));
  const raw = match?.[1]?.trim() || 'Invoice.pdf';
  const cleaned = raw.replace(/[^\w.\-]+/g, '-').replace(/^\.+/, '');
  if (!cleaned) return 'Invoice.pdf';
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

/**
 * @param {unknown} body
 */
function readServerError(body) {
  if (body && typeof body === 'object' && typeof body.error === 'string' && body.error.trim()) {
    return body.error.trim();
  }
  return null;
}

/**
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 */
export function mapInvoicePdfError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  const generic = 'Could not download this invoice.';
  if (httpStatus === 401) return 'Sign in again to download this invoice.';
  if (httpStatus === 404) return fallback || 'Invoice not found.';
  if (httpStatus === 0) return fallback || 'Network error. Check your connection and try again.';
  return fallback || generic;
}

/**
 * Downloads the shop bill PDF. Sent, paid, and void invoices are included.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} invoiceId
 */
export async function fetchInvoicePdf(accessToken, invoiceId) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) return { ok: false, error: httpsErr };

  const token = String(accessToken ?? '').trim();
  const id = String(invoiceId ?? '').trim();
  if (!token) {
    return { ok: false, error: new Error(mapInvoicePdfError(401, null)) };
  }
  if (!id) {
    return { ok: false, error: new Error(mapInvoicePdfError(404, null)) };
  }

  let res;
  try {
    res = await fetch(`${origin}/api/invoices/${encodeURIComponent(id)}/pdf`, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error(mapInvoicePdfError(0, null)),
    };
  }

  if (!res.ok) {
    let serverMessage = null;
    try {
      serverMessage = readServerError(await res.json());
    } catch {
      serverMessage = null;
    }
    return {
      ok: false,
      error: new Error(mapInvoicePdfError(res.status, serverMessage)),
    };
  }

  let bytes;
  try {
    bytes = new Uint8Array(await res.arrayBuffer());
  } catch {
    return { ok: false, error: new Error(mapInvoicePdfError(500, null)) };
  }

  const header = String.fromCharCode(...bytes.subarray(0, PDF_MAGIC.length));
  if (header !== PDF_MAGIC) {
    return { ok: false, error: new Error(mapInvoicePdfError(500, null)) };
  }

  return {
    ok: true,
    bytes,
    filename: invoicePdfFilename(res.headers?.get?.('Content-Disposition')),
  };
}
