import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES } from '../../../theme';
import { invoiceDocumentModel } from '../utils/invoicePresentation';
import { InvoiceStatusPill } from './InvoiceStatusPill';

const PAPER = {
  background: '#ffffff',
  text: '#171717',
  textSecondary: '#525252',
  muted: '#8a8a8a',
  border: '#ececec',
  tableHead: '#f6f6f6',
};

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {boolean} [props.muted]
 * @param {object} props.styles
 */
function TotalLine({ label, value, muted = false, styles }) {
  return (
    <View style={styles.totalRow}>
      <View style={styles.totalLabelCol}>
        <AppText style={[styles.totalLabel, muted && styles.mutedText]}>{label}</AppText>
      </View>
      <View style={styles.totalValueCol}>
        <AppText style={[styles.totalValue, muted && styles.mutedStrike]}>{value}</AppText>
      </View>
    </View>
  );
}

/**
 * Paper invoice. Business name sits in the document the way a customer would see it.
 *
 * @param {object} props
 * @param {import('../constants/mockInvoices').MockInvoice} props.invoice
 * @param {string} props.businessName
 */
export function InvoiceDocument({ invoice, businessName }) {
  const model = useMemo(() => invoiceDocumentModel(invoice), [invoice]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        paper: {
          backgroundColor: PAPER.background,
          borderColor: PAPER.border,
          borderRadius: 14,
          borderWidth: 1,
          paddingBottom: 72,
          paddingHorizontal: 16,
          paddingTop: 18,
          width: '100%',
        },
        metaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        metaCol: {
          alignItems: 'center',
          flex: 1,
          flexDirection: 'row',
          gap: 8,
          minWidth: 0,
        },
        eyebrow: {
          color: PAPER.muted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 8,
          letterSpacing: 0.5,
          lineHeight: 10,
        },
        number: {
          color: PAPER.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 10,
          letterSpacing: 0.2,
          lineHeight: 13,
        },
        businessName: {
          color: PAPER.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 16,
          letterSpacing: -0.3,
          lineHeight: 20,
          marginTop: 12,
        },
        rule: {
          backgroundColor: PAPER.border,
          height: StyleSheet.hairlineWidth,
          marginTop: 16,
          width: '100%',
        },
        parties: {
          flexDirection: 'row',
          marginTop: 16,
          width: '100%',
        },
        billedCol: {
          flex: 1,
          minWidth: 0,
        },
        dueCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          marginLeft: 12,
          maxWidth: '46%',
        },
        fieldLabel: {
          color: PAPER.muted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 8,
          letterSpacing: 0.45,
          lineHeight: 10,
        },
        partyName: {
          color: PAPER.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.1,
          lineHeight: 16,
          marginTop: 6,
        },
        dueValue: {
          color: PAPER.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.1,
          lineHeight: 16,
          marginTop: 6,
          textAlign: 'right',
        },
        contact: {
          color: PAPER.muted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 11,
          lineHeight: 16,
          marginTop: 4,
        },
        table: {
          marginTop: 20,
          width: '100%',
        },
        tableHead: {
          backgroundColor: PAPER.tableHead,
          borderRadius: 4,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 10,
          paddingVertical: 8,
          width: '100%',
        },
        itemCol: {
          flex: 1,
          minWidth: 0,
        },
        qtyCol: {
          alignItems: 'flex-end',
          width: 28,
        },
        moneyCol: {
          alignItems: 'flex-end',
          width: 64,
        },
        headLabel: {
          color: PAPER.muted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 8,
          letterSpacing: 0.35,
          lineHeight: 10,
        },
        line: {
          borderBottomColor: PAPER.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 10,
          paddingVertical: 11,
          width: '100%',
        },
        lineName: {
          color: PAPER.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 11,
          letterSpacing: -0.05,
          lineHeight: 14,
        },
        lineValue: {
          color: PAPER.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 11,
          letterSpacing: -0.05,
          lineHeight: 14,
        },
        totals: {
          marginTop: 10,
          width: '100%',
        },
        totalRow: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingVertical: 9,
          width: '100%',
        },
        totalLabelCol: {
          flex: 1,
          marginLeft: '38%',
          minWidth: 0,
        },
        totalValueCol: {
          alignItems: 'flex-end',
          marginRight: 10,
          width: 64,
        },
        totalRule: {
          backgroundColor: PAPER.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: '38%',
          marginRight: 10,
        },
        totalLabel: {
          color: PAPER.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 11,
          letterSpacing: -0.05,
          lineHeight: 14,
        },
        totalValue: {
          color: PAPER.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          letterSpacing: -0.05,
          lineHeight: 14,
          textAlign: 'right',
        },
        mutedText: {
          color: PAPER.muted,
        },
        mutedStrike: {
          color: PAPER.muted,
          textDecorationLine: 'line-through',
        },
        notesLabel: {
          color: PAPER.muted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 8,
          letterSpacing: 0.45,
          lineHeight: 10,
          marginTop: 14,
        },
        notes: {
          color: PAPER.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 11,
          letterSpacing: -0.05,
          lineHeight: 16,
          marginTop: 6,
        },
      }),
    [],
  );

  return (
    <View style={styles.paper}>
      <View style={styles.metaRow}>
        <View style={styles.metaCol}>
          <AppText style={styles.eyebrow}>INVOICE</AppText>
          <AppText numberOfLines={1} style={styles.number}>
            {model.numberLabel}
          </AppText>
        </View>
        <InvoiceStatusPill compact onLight label={model.statusLabel} status={invoice.status} />
      </View>

      <AppText style={styles.businessName}>{businessName}</AppText>
      <View style={styles.rule} />

      <View style={styles.parties}>
        <View style={styles.billedCol}>
          <AppText style={styles.fieldLabel}>BILLED TO</AppText>
          <AppText style={styles.partyName}>{invoice.customerName}</AppText>
          {invoice.customerEmail ? (
            <AppText style={styles.contact}>{invoice.customerEmail}</AppText>
          ) : null}
          {invoice.customerPhone ? (
            <AppText style={styles.contact}>{invoice.customerPhone}</AppText>
          ) : null}
        </View>
        <View style={styles.dueCol}>
          <AppText style={styles.fieldLabel}>DUE DATE</AppText>
          <AppText style={styles.dueValue}>{model.dueDateLabel}</AppText>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHead}>
          <View style={styles.itemCol}>
            <AppText numberOfLines={1} style={styles.headLabel}>
              ITEM
            </AppText>
          </View>
          <View style={styles.qtyCol}>
            <AppText numberOfLines={1} style={styles.headLabel}>
              QTY
            </AppText>
          </View>
          <View style={styles.moneyCol}>
            <AppText numberOfLines={1} style={styles.headLabel}>
              UNIT PRICE
            </AppText>
          </View>
          <View style={styles.moneyCol}>
            <AppText numberOfLines={1} style={styles.headLabel}>
              AMOUNT
            </AppText>
          </View>
        </View>
        {model.lineItems.map((item) => (
          <View key={item.id} style={styles.line}>
            <View style={styles.itemCol}>
              <AppText style={styles.lineName}>{item.name}</AppText>
            </View>
            <View style={styles.qtyCol}>
              <AppText style={styles.lineValue}>{item.qtyLabel}</AppText>
            </View>
            <View style={styles.moneyCol}>
              <AppText style={styles.lineValue}>{item.unitPriceLabel}</AppText>
            </View>
            <View style={styles.moneyCol}>
              <AppText style={styles.lineValue}>{item.amountLabel}</AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totals}>
        <TotalLine label="Subtotal" styles={styles} value={model.subtotalLabel} />
        {model.showPaid ? (
          <>
            <View style={styles.totalRule} />
            <TotalLine label="Paid" styles={styles} value={model.paidLabel} />
          </>
        ) : null}
        {model.showBalance ? (
          <>
            <View style={styles.totalRule} />
            <TotalLine label={model.balanceTitle} styles={styles} value={model.balanceLabel} />
          </>
        ) : null}
        {model.voided ? (
          <>
            <View style={styles.totalRule} />
            <TotalLine muted label={model.voidLabel} styles={styles} value={model.subtotalLabel} />
          </>
        ) : null}
      </View>

      {model.notes ? (
        <>
          <View style={styles.rule} />
          <AppText style={styles.notesLabel}>NOTES</AppText>
          <AppText style={styles.notes}>{model.notes}</AppText>
        </>
      ) : null}
    </View>
  );
}
