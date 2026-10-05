import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../components/ui';

const PAPER = '#ffffff';
const BONE = '#e7e7e7';
const LINE = '#ececec';

function Bone({ height = 12, width = '100%', radius = 6, style }) {
  return (
    <SkeletonBox
      backgroundColor={BONE}
      borderRadius={radius}
      height={height}
      pulse
      style={style}
      width={width}
    />
  );
}

function LineRow() {
  return (
    <View style={styles.line}>
      <View style={styles.itemCol}>
        <Bone width="72%" />
      </View>
      <View style={styles.qtyCol}>
        <Bone width={16} />
      </View>
      <View style={styles.moneyCol}>
        <Bone width={44} />
      </View>
      <View style={styles.moneyCol}>
        <Bone width={48} />
      </View>
    </View>
  );
}

/** Placeholder for the paper invoice while the first read is in flight. */
export function InvoiceDocumentSkeleton() {
  return (
    <View style={styles.paper}>
      <View style={styles.metaRow}>
        <View style={styles.metaCol}>
          <Bone height={10} width={72} />
        </View>
        <Bone height={18} radius={999} width={52} />
      </View>
      <Bone height={16} style={styles.business} width="48%" />
      <View style={styles.rule} />
      <View style={styles.parties}>
        <View style={styles.billedCol}>
          <Bone height={8} width={48} />
          <Bone height={14} style={styles.partyName} width="70%" />
          <Bone height={12} style={styles.contact} width="58%" />
        </View>
        <View style={styles.dueCol}>
          <Bone height={8} width={52} />
          <Bone height={14} style={styles.partyName} width={96} />
        </View>
      </View>
      <View style={styles.tableHead} />
      <LineRow />
      <LineRow />
      <LineRow />
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Bone height={12} width={64} />
          <Bone height={12} width={52} />
        </View>
        <View style={styles.totalRow}>
          <Bone height={12} width={72} />
          <Bone height={12} width={52} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: PAPER,
    borderColor: LINE,
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
    flex: 1,
    minWidth: 0,
  },
  business: {
    marginTop: 16,
  },
  rule: {
    backgroundColor: LINE,
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
    marginLeft: 12,
  },
  partyName: {
    marginTop: 8,
  },
  contact: {
    marginTop: 6,
  },
  tableHead: {
    backgroundColor: '#f6f6f6',
    borderRadius: 4,
    height: 28,
    marginTop: 20,
    width: '100%',
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
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
  totals: {
    gap: 14,
    marginLeft: '38%',
    marginTop: 16,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
