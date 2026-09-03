import { resolveQuoteRequestBrief } from '../utils/resolveQuoteRequestBrief';

describe('resolveQuoteRequestBrief', () => {
  it('dedupes a free-text ask copied into serviceName and extracts preferred timing', () => {
    const brief = resolveQuoteRequestBrief({
      serviceName: 'need my seats cleaned shampooed and extracted',
      message: 'Preferred timing: This week\nneed my seats cleaned shampooed and extracted',
      vehicle: '2018 Toyota Tacoma',
    });

    expect(brief.headline).toBe('');
    expect(brief.body).toBe('need my seats cleaned shampooed and extracted');
    expect(brief.preferredTiming).toBe('This week');
  });

  it('keeps a catalog service title when the note is different', () => {
    const brief = resolveQuoteRequestBrief({
      serviceName: 'Full detail',
      message: 'Please remove a coffee stain.',
      vehicle: '2022 Honda Civic',
    });

    expect(brief.headline).toBe('Full detail');
    expect(brief.body).toBe('Please remove a coffee stain.');
    expect(brief.preferredTiming).toBe('');
  });

  it('lifts extra vehicles out of the message so the body stays the ask', () => {
    const brief = resolveQuoteRequestBrief({
      serviceName: 'Full detail',
      message:
        'Preferred timing: Flexible\nSecond vehicle: 2022 GMC Yukon AT4\n\nEstimate for my truck and my Yukon.',
      vehicle: '2021 GMC Sierra AT4',
    });

    expect(brief.additionalVehicles).toEqual(['2022 GMC Yukon AT4']);
    expect(brief.preferredTiming).toBe('Flexible');
    expect(brief.body).toBe('Estimate for my truck and my Yukon.');
  });

  it('skips an extra vehicle that repeats the one on the request', () => {
    const brief = resolveQuoteRequestBrief({
      message: 'Second vehicle: 2021 GMC Sierra AT4\nInterior only.',
      vehicle: '2021 GMC  sierra at4',
    });

    expect(brief.additionalVehicles).toEqual([]);
    expect(brief.body).toBe('Interior only.');
  });

  it('reads a third vehicle line too', () => {
    const brief = resolveQuoteRequestBrief({
      message: 'Second vehicle: 2012 BMW 335i\nThird vehicle: 2015 GMC Acadia\nAll three please.',
      vehicle: '2014 Ford Escape',
    });

    expect(brief.additionalVehicles).toEqual(['2012 BMW 335i', '2015 GMC Acadia']);
  });

  it('has no extra vehicles when the message never lists one', () => {
    const brief = resolveQuoteRequestBrief({ message: 'Interior only.', vehicle: '2022 Civic' });

    expect(brief.additionalVehicles).toEqual([]);
  });
});
