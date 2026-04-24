import { CUSTOMER_FILTER_DUE, CUSTOMER_FILTER_NEW, CUSTOMER_FILTER_RETURNING } from '../constants';

export function customerSegmentLabel(segment) {
  if (segment === CUSTOMER_FILTER_NEW) {
    return 'New';
  }
  if (segment === CUSTOMER_FILTER_RETURNING) {
    return 'Returning';
  }
  if (segment === CUSTOMER_FILTER_DUE) {
    return 'Due';
  }
  return 'Customer';
}

export function customerSegmentColor(segment) {
  if (segment === CUSTOMER_FILTER_RETURNING) {
    return '#34d399';
  }
  if (segment === CUSTOMER_FILTER_DUE) {
    return '#fcd34d';
  }
  return '#38bdf8';
}
