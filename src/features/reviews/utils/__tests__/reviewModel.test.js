import { buildReviewsSummary } from '../buildReviewsSummary';
import { mapReviewRowToModel, validateReviewReply } from '../reviewModel';

describe('reviewModel', () => {
  it('maps a replied review row', () => {
    const model = mapReviewRowToModel({
      id: 'abc',
      author_display_name: 'Jane Doe',
      rating: 5,
      body: 'Great service',
      created_at: '2026-06-01T12:00:00.000Z',
      owner_reply_body: 'Thank you!',
      owner_replied_at: '2026-06-02T12:00:00.000Z',
      is_hidden: false,
    });

    expect(model.authorDisplayName).toBe('Jane Doe');
    expect(model.replyStatus).toBe('replied');
    expect(model.ownerReply).toEqual({
      body: 'Thank you!',
      repliedAt: '2026-06-02T12:00:00.000Z',
    });
  });

  it('treats empty reply body as needs reply', () => {
    const model = mapReviewRowToModel({
      id: 'abc',
      author_display_name: 'Jane Doe',
      rating: 4,
      body: 'Good job',
      created_at: '2026-06-01T12:00:00.000Z',
      owner_reply_body: '   ',
      owner_replied_at: '2026-06-02T12:00:00.000Z',
      is_hidden: false,
    });

    expect(model.replyStatus).toBe('needs_reply');
    expect(model.ownerReply).toBeNull();
  });
});

describe('validateReviewReply', () => {
  it('rejects empty replies', () => {
    expect(validateReviewReply('   ').ok).toBe(false);
  });

  it('accepts trimmed replies within the limit', () => {
    const result = validateReviewReply('  Thanks!  ');
    expect(result).toEqual({ ok: true, value: 'Thanks!' });
  });
});

describe('buildReviewsSummary', () => {
  it('returns empty summary when there are no reviews', () => {
    expect(buildReviewsSummary([])).toEqual({
      averageRating: 0,
      totalCount: 0,
      breakdown: [
        { stars: 5, percent: 0 },
        { stars: 4, percent: 0 },
        { stars: 3, percent: 0 },
        { stars: 2, percent: 0 },
        { stars: 1, percent: 0 },
      ],
    });
  });

  it('derives average and breakdown from mapped reviews', () => {
    const reviews = [
      mapReviewRowToModel({
        id: '1',
        author_display_name: 'A',
        rating: 5,
        body: 'A',
        created_at: '2026-06-01T12:00:00.000Z',
        owner_reply_body: null,
        owner_replied_at: null,
        is_hidden: false,
      }),
      mapReviewRowToModel({
        id: '2',
        author_display_name: 'B',
        rating: 4,
        body: 'B',
        created_at: '2026-06-02T12:00:00.000Z',
        owner_reply_body: null,
        owner_replied_at: null,
        is_hidden: false,
      }),
      mapReviewRowToModel({
        id: '3',
        author_display_name: 'C',
        rating: 5,
        body: 'C',
        created_at: '2026-06-03T12:00:00.000Z',
        owner_reply_body: null,
        owner_replied_at: null,
        is_hidden: false,
      }),
    ];

    expect(buildReviewsSummary(reviews)).toEqual({
      averageRating: 4.7,
      totalCount: 3,
      breakdown: [
        { stars: 5, percent: 67 },
        { stars: 4, percent: 33 },
        { stars: 3, percent: 0 },
        { stars: 2, percent: 0 },
        { stars: 1, percent: 0 },
      ],
    });
  });
});
