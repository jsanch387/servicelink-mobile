import { REVIEWS_FILTER_NEEDS_REPLY } from '../../constants';
import { filterReviews } from '../filterReviews';
import { mapReviewRowToModel } from '../reviewModel';

const SAMPLE_REVIEWS = [
  mapReviewRowToModel({
    id: '1',
    author_display_name: 'Alex Rivera',
    rating: 4,
    body: 'Great communication and showed up on time.',
    created_at: '2026-05-18T12:00:00.000Z',
    owner_reply_body: null,
    owner_replied_at: null,
    is_hidden: false,
  }),
  mapReviewRowToModel({
    id: '2',
    author_display_name: 'Jesus Sanchez',
    rating: 5,
    body: 'Really loved the experience.',
    created_at: '2026-06-01T12:00:00.000Z',
    owner_reply_body: 'Thanks!',
    owner_replied_at: '2026-06-02T12:00:00.000Z',
    is_hidden: false,
  }),
];

describe('filterReviews', () => {
  it('returns all reviews for the All filter', () => {
    expect(filterReviews(SAMPLE_REVIEWS, 'all')).toHaveLength(2);
  });

  it('returns only reviews that need a reply', () => {
    const result = filterReviews(SAMPLE_REVIEWS, REVIEWS_FILTER_NEEDS_REPLY);
    expect(result).toHaveLength(1);
    expect(result[0].replyStatus).toBe(REVIEWS_FILTER_NEEDS_REPLY);
  });
});
