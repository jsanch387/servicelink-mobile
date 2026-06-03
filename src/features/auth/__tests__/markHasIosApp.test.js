import { markHasIosApp } from '../api/markHasIosApp';

const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

describe('markHasIosApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it('no-ops without userId', async () => {
    await markHasIosApp('');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('sets has_ios_app on the signed-in profile row', async () => {
    await markHasIosApp('user-123');

    expect(mockUpdate).toHaveBeenCalledWith({ has_ios_app: true });
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('throws when Supabase returns an error', async () => {
    mockEq.mockResolvedValue({ error: { message: 'column missing' } });

    await expect(markHasIosApp('user-123')).rejects.toThrow('column missing');
  });
});
