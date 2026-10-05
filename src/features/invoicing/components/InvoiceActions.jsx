import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  safeUserFacingMessage,
  showUserFacingErrorAlert,
} from '../../../utils/safeUserFacingMessage';
import { getSession } from '../../auth';
import { CompleteVisitMarkPaidSheet } from '../../bookings/booking-details/components/CompleteVisitMarkPaidSheet';
import { fetchInvoicePdf } from '../api/invoicePdf';
import { postMarkInvoicePaid, postVoidInvoice } from '../api/invoiceWrites';
import { INVOICES_QUERY_ROOT } from '../queryKeys';
import { invoicePublicUrl } from '../utils/invoicePublicUrl';
import { shareInvoicePdf } from '../utils/shareInvoicePdf';
import { INVOICE_SEND_MIN_PENDING_MS } from './InvoiceSendSubmittingState';

const COPIED_FEEDBACK_MS = 2000;

/**
 * @param {object} props
 * @param {string} props.iconName
 * @param {string} props.label
 * @param {() => void} props.onPress
 */
function InvoiceActionItem({ iconName, label, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignItems: 'center',
          backgroundColor: colors.buttonSecondaryBg,
          borderRadius: 10,
          gap: 6,
          justifyContent: 'center',
          minHeight: 72,
          paddingHorizontal: 8,
          paddingVertical: 12,
          width: '100%',
        },
        pressed: {
          backgroundColor: colors.buttonSecondaryBgPressed,
        },
        label: {
          color: colors.buttonSecondaryText,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.15,
          lineHeight: 16,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <View style={[styles.card, pressed && styles.pressed]}>
          <Ionicons color={colors.buttonSecondaryText} name={iconName} size={18} />
          <AppText style={styles.label}>{label}</AppText>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Actions under a bill. Mark as paid and Void are sent-only.
 * Download PDF opens the system share sheet. Copy link copies the public invoice URL.
 *
 * @param {object} props
 * @param {boolean} props.isSent
 * @param {number} [props.amountDue]
 * @param {string} props.invoiceId
 * @param {string} [props.shortCode]
 * @param {(state: { phase: 'pending' | 'error' | 'done'; message?: string }) => void} [props.onVoidState]
 */
export function InvoiceActions({ isSent, amountDue = 0, invoiceId, shortCode = '', onVoidState }) {
  const queryClient = useQueryClient();
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const copiedTimer = useRef(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const copyLink = async () => {
    const url = invoicePublicUrl(shortCode);
    if (!url) {
      showUserFacingErrorAlert('Could not copy link', new Error('This invoice link is not ready.'));
      return;
    }
    try {
      await Clipboard.setStringAsync(url);
    } catch (error) {
      showUserFacingErrorAlert('Could not copy link', error);
      return;
    }
    setLinkCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setLinkCopied(false), COPIED_FEEDBACK_MS);
  };

  const markPaid = async (method) => {
    if (markingPaid) return;
    setMarkingPaid(true);
    try {
      const { data } = await getSession();
      const result = await postMarkInvoicePaid(data?.session?.access_token, invoiceId, method);
      if (!result.ok) {
        showUserFacingErrorAlert('Could not mark as paid', result.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_ROOT });
      setMarkPaidOpen(false);
    } finally {
      setMarkingPaid(false);
    }
  };

  const voidInvoice = async () => {
    if (voiding) return;
    setVoiding(true);
    onVoidState?.({ phase: 'pending' });
    const pendingMin = new Promise((resolve) => {
      setTimeout(resolve, INVOICE_SEND_MIN_PENDING_MS);
    });
    try {
      const { data } = await getSession();
      const [result] = await Promise.all([
        postVoidInvoice(data?.session?.access_token, invoiceId),
        pendingMin,
      ]);
      if (!result.ok) {
        onVoidState?.({
          phase: 'error',
          message: safeUserFacingMessage(result.error, {
            fallback: 'Could not update this invoice.',
          }),
        });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_ROOT });
      onVoidState?.({ phase: 'done' });
    } catch (error) {
      onVoidState?.({
        phase: 'error',
        message: safeUserFacingMessage(error, { fallback: 'Could not update this invoice.' }),
      });
    } finally {
      setVoiding(false);
    }
  };

  const downloadPdf = async () => {
    if (downloadingPdf || voiding || markingPaid) return;
    setDownloadingPdf(true);
    try {
      const { data } = await getSession();
      const result = await fetchInvoicePdf(data?.session?.access_token, invoiceId);
      if (!result.ok) {
        showUserFacingErrorAlert('Could not download invoice', result.error);
        return;
      }
      await shareInvoicePdf(result.bytes, result.filename);
    } catch (error) {
      showUserFacingErrorAlert('Could not download invoice', error);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const confirmVoid = () => {
    if (voiding) return;
    Alert.alert(
      'Void this invoice?',
      'This bill stays on record. The link will show Void, and it can no longer be paid.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Void invoice', style: 'destructive', onPress: () => void voidInvoice() },
      ],
    );
  };
  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          gap: 10,
          marginTop: 16,
          width: '100%',
        },
        row: {
          flexDirection: 'row',
          gap: 10,
          width: '100%',
        },
        cell: {
          flex: 1,
          minWidth: 0,
        },
      }),
    [],
  );

  const sentActions = [
    {
      id: 'paid',
      iconName: 'checkmark-circle-outline',
      label: 'Mark as paid',
      onPress: () => setMarkPaidOpen(true),
    },
    { id: 'void', iconName: 'close-circle-outline', label: 'Void', onPress: confirmVoid },
  ];
  const shareActions = [
    {
      id: 'pdf',
      iconName: 'download-outline',
      label: downloadingPdf ? 'Preparing…' : 'Download PDF',
      onPress: () => {
        void downloadPdf();
      },
    },
    {
      id: 'copy',
      iconName: linkCopied ? 'checkmark' : 'link-outline',
      label: linkCopied ? 'Copied' : 'Copy link',
      onPress: () => {
        void copyLink();
      },
    },
  ];

  const renderRow = (actions) => (
    <View style={styles.row}>
      {actions.map((action) => (
        <View key={action.id} style={styles.cell}>
          <InvoiceActionItem
            iconName={action.iconName}
            label={action.label}
            onPress={action.onPress}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.grid}>
      {isSent ? renderRow(sentActions) : null}
      {renderRow(shareActions)}
      {markPaidOpen ? (
        <CompleteVisitMarkPaidSheet
          amountDue={amountDue}
          confirming={markingPaid}
          keepOpenOnConfirm
          requireMethod
          onClose={() => {
            if (!markingPaid) setMarkPaidOpen(false);
          }}
          onConfirm={(method) => {
            void markPaid(method);
          }}
        />
      ) : null}
    </View>
  );
}
