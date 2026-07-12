import { SegmentedToggle } from '../../../components/ui/SegmentedToggle';

export const ENTITY_VIEW_SERVICES = 'services';
export const ENTITY_VIEW_CATEGORIES = 'categories';
export const ENTITY_VIEW_ADDONS = 'addons';

const OPTIONS = [
  { key: ENTITY_VIEW_SERVICES, label: 'Services' },
  { key: ENTITY_VIEW_CATEGORIES, label: 'Categories' },
  { key: ENTITY_VIEW_ADDONS, label: 'Add-ons' },
];

export function SegmentedEntityToggle({ selected, onSelect }) {
  return <SegmentedToggle options={OPTIONS} selected={selected} onSelect={onSelect} />;
}
