export const MOCK_SERVICES = [
  {
    id: 'svc-int-ext-detail',
    name: 'Signature Shine',
    durationLabel: '3h 30m',
    addonsCountLabel: '1 add-on',
    priceLabel: '$165',
    description: 'A premium refresh that restores your vehicle clean, glossy look inside and out.',
    highlights: ['Gentle hand wash to protect paint and finish', 'Wheel and tire cleaning'],
    isEnabled: true,
  },
  {
    id: 'svc-black-label-detail',
    name: 'Black Label Detail',
    durationLabel: '3h 30m',
    priceLabel: '$275',
    description:
      'A complete inside and out refresh designed to restore and protect your vehicle. Entry level full detail.',
    highlights: ['Full interior deep clean', 'Exterior wash'],
    isEnabled: true,
  },
  {
    id: 'svc-paint-correction',
    name: 'Paint Correction (1-Step)',
    durationLabel: '5h 00m',
    priceLabel: '$420',
    description:
      'Enhance depth and gloss by removing light swirls and oxidation from painted surfaces.',
    highlights: ['Single-step machine polish', 'Panel prep and protection ready'],
    isEnabled: false,
  },
];

export const MOCK_ADDONS = [
  {
    id: 'addon-pet-hair',
    name: 'Pet Hair Removal',
    priceLabel: '+$30',
    durationLabel: '+30m',
    description: 'Deep vacuum and brushing treatment for stubborn pet hair on fabric.',
    highlights: ['Seats and carpets', 'Trunk cargo area'],
    isEnabled: true,
  },
  {
    id: 'addon-engine-bay',
    name: 'Engine Bay Detail',
    priceLabel: '+$45',
    durationLabel: '+45m',
    description: 'Safe degrease and dressing for a clean, presentation-ready engine bay.',
    highlights: ['Plastic trim dressing', 'Gentle rinse and dry'],
    isEnabled: true,
  },
  {
    id: 'addon-odor-treatment',
    name: 'Odor Treatment',
    priceLabel: '+$25',
    durationLabel: '+20m',
    description: 'Targeted interior treatment to neutralize odor sources quickly.',
    highlights: ['Cabin vents refresh', 'Fabric-safe deodorizer'],
    isEnabled: false,
  },
];
