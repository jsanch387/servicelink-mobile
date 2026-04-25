import {
  buildServicesCatalogModel,
  deriveServicesSummary,
  normalizeAddonDurationLabelForCard,
} from '../utils/buildServicesCatalogModel';

describe('buildServicesCatalogModel', () => {
  it('maps/sorts services and computes add-on counts', () => {
    const servicesRows = [
      {
        id: 'svc-b',
        name: 'Exterior',
        duration_minutes: 60,
        price_cents: 12000,
        description: 'Outside only',
        sort_order: 20,
        is_active: false,
      },
      {
        id: 'svc-a',
        name: 'Interior',
        duration_minutes: 90,
        price_cents: 15000,
        description: 'Inside only',
        sort_order: 10,
        is_active: true,
      },
    ];
    const assignmentRows = [
      { service_id: 'svc-a', addon_id: 'ad-1' },
      { service_id: 'svc-a', addon_id: 'ad-2' },
      { service_id: 'svc-b', addon_id: 'ad-3' },
    ];

    const model = buildServicesCatalogModel(servicesRows, [], assignmentRows);

    expect(model.services.map((s) => s.id)).toEqual(['svc-a', 'svc-b']);
    expect(model.services[0].addonsCountLabel).toBe('2 add-ons');
    expect(model.services[1].addonsCountLabel).toBe('1 add-on');
    expect(model.services[1].isEnabled).toBe(false);
  });

  it('maps add-ons with human-readable duration and editor fields', () => {
    const addonsRows = [
      { id: 'ad-0', name: 'No extra', duration_minutes: null, price_cents: 0 },
      { id: 'ad-1', name: 'Pet hair', duration_minutes: 30, price_cents: 2000, sort_order: 10 },
      { id: 'ad-2', name: 'Deep scrub', duration_minutes: 90, price_cents: 3500, sort_order: 20 },
    ];

    const model = buildServicesCatalogModel([], addonsRows, []);
    expect(model.addons).toHaveLength(3);

    expect(model.addons[0]).toMatchObject({
      id: 'ad-0',
      durationLabel: '',
      priceLabel: '+$0',
      price: '0.00',
      durationHHmm: '',
    });
    expect(model.addons[1].durationLabel).toBe('30 min');
    expect(model.addons[2].durationLabel).toBe('1 hr 30 min');
  });
});

describe('services catalog helpers', () => {
  it('derives summary counts', () => {
    expect(
      deriveServicesSummary({
        services: [{ id: '1' }, { id: '2' }],
        addons: [{ id: 'a' }],
      }),
    ).toEqual({ totalServices: 2, totalAddons: 1 });
  });

  it('normalizes legacy addon duration labels without plus', () => {
    expect(normalizeAddonDurationLabelForCard('+30 min')).toBe('30 min');
    expect(normalizeAddonDurationLabelForCard('1 hr')).toBe('1 hr');
  });
});
