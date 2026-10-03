import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  MonthCalendar,
  SurfaceCard,
  SurfacePhoneField,
  SurfaceTextField,
  parseLocalYyyyMmDd,
} from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { isValidEmailFormat } from '../../../../utils/email';
import { canonicalNanpDigits } from '../../../../utils/phone';
import {
  createInvoiceLineItem,
  parseInvoiceMoneyInput,
  parseInvoiceQtyInput,
} from '../../utils/createInvoiceDraft';
import { formatInvoiceDollars } from '../../utils/formatInvoiceMoney';

const FIELD_SHELL = { marginBottom: 0 };

/**
 * Single invoice form. The same component can be opened from Invoices, a booking, or Home.
 *
 * @param {object} props
 * @param {'customer' | 'due' | 'services' | 'notes'} props.step
 * @param {import('../../utils/createInvoiceDraft').InvoiceDraft} props.draft
 * @param {(patch: Partial<import('../../utils/createInvoiceDraft').InvoiceDraft>) => void} props.onChange
 */
export function CreateInvoiceForm({ step, draft, onChange }) {
  const { colors } = useTheme();
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const phoneDigits = canonicalNanpDigits(draft.customerPhone);
  const email = draft.customerEmail.trim();
  const dueRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const max = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
    return { minDate: today, maxDate: max };
  }, []);
  const dueLabel = useMemo(() => {
    const date = parseLocalYyyyMmDd(draft.dueDateYyyyMmDd);
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [draft.dueDateYyyyMmDd]);

  const hasValidEmail = Boolean(email) && isValidEmailFormat(email);
  const hasCompletePhone = phoneDigits.length >= 10;
  const emailError = email && !hasValidEmail ? 'Enter a valid email address.' : undefined;
  const phoneError =
    phoneBlurred && phoneDigits.length > 0 && !hasCompletePhone
      ? 'Enter a complete 10-digit number, or leave phone blank.'
      : undefined;
  const contactError =
    !emailError && !phoneError && draft.customerName.trim() && !hasValidEmail && !hasCompletePhone
      ? 'Add an email or a phone number.'
      : undefined;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fields: {
          gap: 20,
        },
        due: {
          gap: 14,
        },
        dueLabel: {
          color: dueLabel ? colors.text : colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          textAlign: 'left',
        },
        pair: {
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        pairCol: {
          flex: 1,
          minWidth: 0,
        },
        list: {
          overflow: 'hidden',
        },
        listRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          width: '100%',
        },
        listCopy: {
          flex: 1,
          gap: 2,
          minWidth: 0,
        },
        listName: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
        },
        listMeta: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
        },
        trashHit: {
          alignItems: 'center',
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
        hairline: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 16,
        },
      }),
    [colors, dueLabel],
  );

  const itemPriceValue = itemPrice.trim() ? parseInvoiceMoneyInput(itemPrice) : 0;
  const canAddItem =
    Boolean(itemName.trim()) && itemPriceValue != null && parseInvoiceQtyInput(itemQty) != null;

  function addItem() {
    if (!canAddItem) return;
    onChange({
      lineItems: [
        ...draft.lineItems,
        createInvoiceLineItem({
          name: itemName.trim(),
          qty: itemQty,
          unitPrice: itemPrice,
        }),
      ],
    });
    setItemName('');
    setItemQty('1');
    setItemPrice('');
  }

  function removeLine(id) {
    onChange({ lineItems: draft.lineItems.filter((line) => line.id !== id) });
  }

  if (step === 'due') {
    return (
      <View style={styles.due}>
        <MonthCalendar
          maxDate={dueRange.maxDate}
          minDate={dueRange.minDate}
          selectedDateKey={draft.dueDateYyyyMmDd}
          onSelectDateKey={(dueDateYyyyMmDd) => onChange({ dueDateYyyyMmDd })}
        />
        <AppText style={styles.dueLabel}>{dueLabel || 'Choose a day'}</AppText>
      </View>
    );
  }

  if (step === 'notes') {
    return (
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        label={null}
        multiline
        placeholder="Add a note"
        value={draft.notes}
        onChangeText={(notes) => onChange({ notes })}
      />
    );
  }

  if (step === 'services') {
    return (
      <View style={styles.fields}>
        <SurfaceTextField
          containerStyle={FIELD_SHELL}
          label="Item"
          placeholder="Full detail"
          value={itemName}
          onChangeText={setItemName}
        />
        <View style={styles.pair}>
          <View style={styles.pairCol}>
            <SurfaceTextField
              containerStyle={FIELD_SHELL}
              keyboardType="number-pad"
              label="Qty"
              value={itemQty}
              onChangeText={(qty) => setItemQty(qty.replace(/[^0-9]/g, ''))}
            />
          </View>
          <View style={styles.pairCol}>
            <SurfaceTextField
              containerStyle={FIELD_SHELL}
              keyboardType="decimal-pad"
              label="Price"
              placeholder="0.00"
              prefixText="$"
              value={itemPrice}
              onChangeText={(price) => setItemPrice(price.replace(/[^0-9.]/g, ''))}
            />
          </View>
        </View>
        <Button
          disabled={!canAddItem}
          fullWidth
          title="Add"
          variant="secondary"
          onPress={addItem}
        />
        {draft.lineItems.length ? (
          <SurfaceCard padding="none" style={styles.list}>
            {draft.lineItems.map((line, index) => {
              const qty = parseInvoiceQtyInput(line.qty) ?? 1;
              const price = String(line.unitPrice).trim()
                ? (parseInvoiceMoneyInput(line.unitPrice) ?? 0)
                : 0;
              return (
                <View key={line.id}>
                  {index > 0 ? <View style={styles.hairline} /> : null}
                  <View style={styles.listRow}>
                    <View style={styles.listCopy}>
                      <AppText numberOfLines={1} style={styles.listName}>
                        {line.name}
                      </AppText>
                      <AppText style={styles.listMeta}>
                        {qty} × {formatInvoiceDollars(price)}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityLabel={`Remove ${line.name}`}
                      accessibilityRole="button"
                      hitSlop={8}
                      style={styles.trashHit}
                      onPress={() => removeLine(line.id)}
                    >
                      <Ionicons color={colors.danger} name="trash-outline" size={18} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </SurfaceCard>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.fields}>
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        label="Customer name"
        placeholder="Customer name"
        value={draft.customerName}
        onChangeText={(customerName) => onChange({ customerName })}
      />
      <SurfacePhoneField
        containerStyle={FIELD_SHELL}
        errorText={phoneError}
        label="Phone"
        placeholder="(555) 123-4567"
        prefixText="+1"
        value={draft.customerPhone}
        onBlur={() => setPhoneBlurred(true)}
        onChangeText={(customerPhone) => onChange({ customerPhone })}
      />
      <SurfaceTextField
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={FIELD_SHELL}
        errorText={emailError || contactError}
        keyboardType="email-address"
        label="Email"
        placeholder="name@email.com"
        value={draft.customerEmail}
        onChangeText={(customerEmail) => onChange({ customerEmail })}
      />
    </View>
  );
}
