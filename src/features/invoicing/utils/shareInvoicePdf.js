import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes the PDF into the cache and opens the system share sheet.
 * iOS uses the activity sheet. Android uses the share intent.
 *
 * @param {Uint8Array} bytes
 * @param {string} filename
 */
export async function shareInvoicePdf(bytes, filename) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }

  const file = new File(Paths.cache, filename || 'Invoice.pdf');
  file.create({ overwrite: true });
  file.write(bytes);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Download PDF',
  });
}
