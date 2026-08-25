jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { fetchTransactionBookingLabels } from '../api/fetchTransactionBookingLabels';

function mockTableQuery({ data = [], error = null } = {}) {
  const builder = {
    select: jest.fn(() => builder),
    in: jest.fn(() => Promise.resolve({ data, error })),
  };
  supabase.from.mockReturnValue(builder);
  return builder;
}

describe('fetchTransactionBookingLabels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty map without querying when there are no ids', async () => {
    await expect(fetchTransactionBookingLabels({})).resolves.toEqual({});
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('maps the first service and extra job count', async () => {
    mockTableQuery({
      data: [
        {
          id: 'bk-1',
          service_name: 'Signature Shine — SUV',
          visit_job_count: 2,
          job_details: [{ serviceName: 'Signature Shine' }, { serviceName: 'Wax' }],
        },
      ],
    });

    await expect(fetchTransactionBookingLabels({ bookingIds: ['bk-1'] })).resolves.toEqual({
      'bk-1': { serviceName: 'Signature Shine', extraCount: 1 },
    });
  });
});
