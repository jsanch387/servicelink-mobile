import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetModal, Button, SurfaceTextField } from '../../../components/ui';
import { DEPOSIT_AMOUNT_MODE } from '../../payments/constants/depositAmount';
import { MARKETING_CAMPAIGN_KIND } from '../constants';
import { MarketingOptionalDatesSection } from './MarketingOptionalDatesSection';
import { MarketingDiscountFields } from './MarketingDiscountFields';
import {
  buildMarketingCampaignFromDraft,
  campaignHasDateRange,
  validateSaleDraft,
} from '../utils/marketingCampaignModel';

function todayYyyyMmDd() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function emptyDraft() {
  return {
    name: '',
    discountMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
    discountAmount: '',
    useDates: false,
    startDateYyyyMmDd: '',
    endDateYyyyMmDd: '',
  };
}

function draftFromCampaign(campaign) {
  if (!campaign) return emptyDraft();
  const useDates = campaignHasDateRange(campaign);
  const today = todayYyyyMmDd();
  return {
    name: campaign.name ?? '',
    discountMode: campaign.discountMode,
    discountAmount: campaign.discountAmount ?? '',
    useDates,
    startDateYyyyMmDd: useDates ? campaign.startDateYyyyMmDd || today : '',
    endDateYyyyMmDd: useDates ? campaign.endDateYyyyMmDd || today : '',
  };
}

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onRequestClose
 * @param {(sale: import('../utils/marketingCampaignModel').MarketingCampaign) => void | Promise<void>} props.onCreated
 * @param {import('../utils/marketingCampaignModel').MarketingCampaign | null} [props.editCampaign]
 * @param {(sale: import('../utils/marketingCampaignModel').MarketingCampaign) => void | Promise<void>} [props.onUpdated]
 */
export function CreateSaleSheet({
  visible,
  onRequestClose,
  onCreated,
  editCampaign = null,
  onUpdated,
}) {
  const isEdit = editCampaign != null;
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!visible) return;
    setDraft(isEdit ? draftFromCampaign(editCampaign) : emptyDraft());
    setErrors({});
    setSaveError(null);
    setSaving(false);
  }, [visible, editCampaign, isEdit]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: 20,
        },
        footer: {
          gap: 12,
          marginTop: 8,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        rowGrow: {
          flex: 1,
        },
      }),
    [],
  );

  function updateDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
    setSaveError(null);
  }

  function handleUseDatesChange(useDates) {
    if (!useDates) {
      updateDraft({ useDates: false, startDateYyyyMmDd: '', endDateYyyyMmDd: '' });
      return;
    }
    const today = todayYyyyMmDd();
    updateDraft({
      useDates: true,
      startDateYyyyMmDd: draft.startDateYyyyMmDd || today,
      endDateYyyyMmDd: draft.endDateYyyyMmDd || draft.startDateYyyyMmDd || today,
    });
  }

  async function handleSave() {
    const result = validateSaleDraft(draft);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    const built = buildMarketingCampaignFromDraft({
      ...draft,
      kind: MARKETING_CAMPAIGN_KIND.SALE,
      code: '',
    });

    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit && editCampaign) {
        await onUpdated?.({
          ...built,
          id: editCampaign.id,
          createdAtIso: editCampaign.createdAtIso,
          isEnabled: editCampaign.isEnabled,
        });
      } else {
        await onCreated(built);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save sale.');
    } finally {
      setSaving(false);
    }
  }

  const canSave = useMemo(() => validateSaleDraft(draft).isValid, [draft]);

  return (
    <BottomSheetModal
      footer={
        <View style={styles.footer}>
          <View style={styles.row}>
            <View style={styles.rowGrow}>
              <Button
                disabled={saving}
                fullWidth
                title="Cancel"
                variant="secondary"
                onPress={onRequestClose}
              />
            </View>
            <View style={styles.rowGrow}>
              <Button
                disabled={!canSave || saving}
                fullWidth
                loading={saving}
                title="Save"
                variant="primary"
                onPress={() => {
                  void handleSave();
                }}
              />
            </View>
          </View>
        </View>
      }
      sheetHeightPercent={92}
      stickyFooter
      subtitle="Runs on your booking link. Turn it on or off anytime."
      title={isEdit ? 'Edit sale' : 'Create sale'}
      visible={visible}
      onRequestClose={saving ? () => {} : onRequestClose}
    >
      <View style={styles.section}>
        <SurfaceTextField
          errorText={errors.name || saveError || undefined}
          label="Sale name"
          placeholder="e.g. Summer special"
          value={draft.name}
          onChangeText={(name) => updateDraft({ name })}
        />
      </View>

      <View style={styles.section}>
        <MarketingDiscountFields
          discountAmount={draft.discountAmount}
          discountMode={draft.discountMode}
          errorText={errors.discountAmount}
          onDiscountAmountChange={(discountAmount) => updateDraft({ discountAmount })}
          onDiscountModeChange={(discountMode) => updateDraft({ discountMode })}
        />
      </View>

      <View style={styles.section}>
        <MarketingOptionalDatesSection
          endDateYyyyMmDd={draft.endDateYyyyMmDd}
          endErrorText={errors.endDateYyyyMmDd}
          startDateYyyyMmDd={draft.startDateYyyyMmDd}
          startErrorText={errors.startDateYyyyMmDd}
          useDates={draft.useDates}
          onEndDateChange={(endDateYyyyMmDd) => updateDraft({ endDateYyyyMmDd })}
          onStartDateChange={(startDateYyyyMmDd) => updateDraft({ startDateYyyyMmDd })}
          onUseDatesChange={handleUseDatesChange}
        />
      </View>
    </BottomSheetModal>
  );
}
