import { MAINTENANCE_CREATION_DISABLED_MESSAGE } from '../../maintenance/constants';
import { postMaintenanceEnrollment } from '../maintenance-invite/api/postMaintenanceEnrollment';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postMaintenanceEnrollment', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('refuses to create new maintenance offers', async () => {
    const result = await postMaintenanceEnrollment('token-1', {
      businessId: 'biz-1',
      customerId: 'cust-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.httpStatus).toBe(410);
    expect(result.error.message).toBe(MAINTENANCE_CREATION_DISABLED_MESSAGE);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
