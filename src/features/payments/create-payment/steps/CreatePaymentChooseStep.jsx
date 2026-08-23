import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { WizardStepHeader } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { CreatePaymentPathCard } from '../components/CreatePaymentPathCard';
import {
  CREATE_PAYMENT_MODE,
  CREATE_PAYMENT_MODE_COPY,
  CREATE_PAYMENT_PAGE_PAD_TOP,
  CREATE_PAYMENT_SUBTITLE,
  CREATE_PAYMENT_TITLE,
} from '../constants';

export function CreatePaymentChooseStep({ onChooseCollect, onChooseLink }) {
  const collect = CREATE_PAYMENT_MODE_COPY[CREATE_PAYMENT_MODE.COLLECT_NOW];
  const link = CREATE_PAYMENT_MODE_COPY[CREATE_PAYMENT_MODE.SEND_LINK];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flexGrow: 1,
          paddingBottom: 32,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: CREATE_PAYMENT_PAGE_PAD_TOP,
        },
        header: {
          marginBottom: 20,
        },
      }),
    [],
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      testID="create-payment-choose"
    >
      <WizardStepHeader
        embedded
        showProgress={false}
        style={styles.header}
        subtitle={CREATE_PAYMENT_SUBTITLE}
        title={CREATE_PAYMENT_TITLE}
      />
      <CreatePaymentPathCard
        icon={collect.icon}
        iconLibrary={collect.iconLibrary}
        subtitle={collect.subtitle}
        testID="create-payment-path-collect"
        title={collect.title}
        onPress={onChooseCollect}
      />
      <CreatePaymentPathCard
        icon={link.icon}
        iconLibrary={link.iconLibrary}
        subtitle={link.subtitle}
        testID="create-payment-path-link"
        title={link.title}
        onPress={onChooseLink}
      />
    </ScrollView>
  );
}
