import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

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
 * @param {'save' | 'send' | 'paid' | 'void' | 'delete'} action
 */
export function mapInvoiceWriteError(httpStatus, serverMessage, action) {
  const fallback = serverMessage?.trim() || null;
  const updatesInvoice = action === 'paid' || action === 'void';
  const generic =
    action === 'save'
      ? 'Could not save this draft.'
      : action === 'delete'
        ? 'Could not delete this invoice.'
        : updatesInvoice
          ? 'Could not update this invoice.'
          : 'Could not send this invoice.';
  if (httpStatus === 401) {
    if (action === 'save') return 'Sign in again to save this draft.';
    if (action === 'paid') return 'Sign in again to mark this invoice paid.';
    if (action === 'void') return 'Sign in again to void this invoice.';
    if (action === 'delete') return 'Sign in again to delete this invoice.';
    return 'Sign in again to send this invoice.';
  }
  if (httpStatus === 400 && action === 'paid') {
    return fallback || 'Choose how this was paid.';
  }
  if (httpStatus === 409 && action === 'paid') {
    return fallback || 'Only a sent invoice can be marked paid.';
  }
  if (httpStatus === 409 && action === 'void') {
    return fallback || 'Only a sent invoice can be voided.';
  }
  if (httpStatus === 403 || httpStatus === 400 || httpStatus === 409) {
    return fallback || generic;
  }
  if (httpStatus === 404) {
    return fallback || 'Invoice not found.';
  }
  if (httpStatus >= 500) {
    return fallback || generic;
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || generic;
}

/**
 * @param {unknown} parsed
 */
function readInvoiceId(parsed) {
  if (!parsed || typeof parsed !== 'object' || parsed.success !== true) return '';
  return typeof parsed.invoiceId === 'string' ? parsed.invoiceId.trim() : '';
}

/**
 * @param {string} accessToken
 * @param {string} path
 * @param {'POST' | 'PATCH' | 'DELETE'} method
 * @param {Record<string, unknown> | null} body Null omits the request body.
 * @param {'save' | 'send' | 'paid' | 'void' | 'delete'} action
 */
async function writeInvoice(accessToken, path, method, body, action) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) return { ok: false, error: httpsErr, httpStatus: 0 };

  const token = String(accessToken ?? '').trim();
  if (!token) {
    return {
      ok: false,
      error: new Error(mapInvoiceWriteError(401, null, action)),
      httpStatus: 401,
    };
  }

  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
  /** @type {RequestInit} */
  const init = { method, headers };
  if (body != null) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${origin}${path}`, init);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  let parsed = {};
  try {
    parsed = await res.json();
  } catch {
    parsed = {};
  }

  if (!res.ok || parsed?.success !== true) {
    return {
      ok: false,
      error: new Error(mapInvoiceWriteError(res.status, readServerError(parsed), action)),
      httpStatus: res.status,
    };
  }

  return { ok: true, parsed, httpStatus: res.status };
}

/**
 * @param {string | null | undefined} accessToken
 * @param {Record<string, unknown>} body
 */
export async function postInvoiceDraft(accessToken, body) {
  const result = await writeInvoice(accessToken, '/api/invoices', 'POST', body, 'save');
  if (!result.ok) return result;
  const invoiceId = readInvoiceId(result.parsed);
  if (!invoiceId) {
    return {
      ok: false,
      error: new Error('Could not save this draft.'),
      httpStatus: result.httpStatus,
    };
  }
  return { ok: true, invoiceId };
}

/**
 * @param {string | null | undefined} accessToken
 * @param {string} invoiceId
 * @param {Record<string, unknown>} body
 */
export async function patchInvoiceDraft(accessToken, invoiceId, body) {
  const id = String(invoiceId ?? '').trim();
  const result = await writeInvoice(
    accessToken,
    `/api/invoices/${encodeURIComponent(id)}`,
    'PATCH',
    body,
    'save',
  );
  if (!result.ok) return result;
  const savedId = readInvoiceId(result.parsed) || id;
  return { ok: true, invoiceId: savedId };
}

/**
 * @param {unknown} parsed
 */
function readSendPayload(parsed) {
  const invoiceId = readInvoiceId(parsed);
  if (!invoiceId) return null;
  const invoiceNumber = Number(parsed.invoiceNumber);
  return {
    invoiceId,
    invoiceNumber: Number.isFinite(invoiceNumber) ? invoiceNumber : null,
    shortUrl: typeof parsed.shortUrl === 'string' ? parsed.shortUrl : '',
    emailAttempted: parsed.emailAttempted === true,
    emailSent: parsed.emailSent === true,
    emailError:
      typeof parsed.emailError === 'string' && parsed.emailError.trim()
        ? parsed.emailError.trim()
        : null,
    smsAttempted: parsed.smsAttempted === true,
    smsSent: parsed.smsSent === true,
    smsError:
      typeof parsed.smsError === 'string' && parsed.smsError.trim() ? parsed.smsError.trim() : null,
  };
}

/**
 * Creates or updates a draft, then sends it. Notifications run on the server.
 *
 * @param {string | null | undefined} accessToken
 * @param {Record<string, unknown>} body
 */
export async function postSendInvoice(accessToken, body) {
  const result = await writeInvoice(accessToken, '/api/invoices/send', 'POST', body, 'send');
  if (!result.ok) return result;
  const payload = readSendPayload(result.parsed);
  if (!payload) {
    return {
      ok: false,
      error: new Error('Could not send this invoice.'),
      httpStatus: result.httpStatus,
    };
  }
  return { ok: true, ...payload };
}

const PAID_METHODS = new Set(['cash', 'payment_app', 'other']);

/**
 * Records an off-app payment. Card checkout is a different path.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} invoiceId
 * @param {'cash' | 'payment_app' | 'other'} method
 */
export async function postMarkInvoicePaid(accessToken, invoiceId, method) {
  const id = String(invoiceId ?? '').trim();
  if (!PAID_METHODS.has(method)) {
    return {
      ok: false,
      error: new Error('Choose how this was paid.'),
      httpStatus: 400,
    };
  }
  const result = await writeInvoice(
    accessToken,
    `/api/invoices/${encodeURIComponent(id)}/paid`,
    'POST',
    { method },
    'paid',
  );
  if (!result.ok) return result;
  return { ok: true, invoiceId: readInvoiceId(result.parsed) || id };
}

/**
 * Voids a sent invoice. The number and public link stay.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} invoiceId
 */
export async function postVoidInvoice(accessToken, invoiceId) {
  const id = String(invoiceId ?? '').trim();
  const result = await writeInvoice(
    accessToken,
    `/api/invoices/${encodeURIComponent(id)}/void`,
    'POST',
    null,
    'void',
  );
  if (!result.ok) return result;
  return { ok: true, invoiceId: readInvoiceId(result.parsed) || id };
}

/**
 * Removes a draft or bill. The invoice number is not reused.
 *
 * @param {string | null | undefined} accessToken
 * @param {string} invoiceId
 */
export async function deleteInvoice(accessToken, invoiceId) {
  const id = String(invoiceId ?? '').trim();
  if (!id) {
    return {
      ok: false,
      error: new Error(mapInvoiceWriteError(404, null, 'delete')),
      httpStatus: 404,
    };
  }
  const result = await writeInvoice(
    accessToken,
    `/api/invoices/${encodeURIComponent(id)}`,
    'DELETE',
    null,
    'delete',
  );
  if (!result.ok) return result;
  return { ok: true, invoiceId: readInvoiceId(result.parsed) || id };
}
