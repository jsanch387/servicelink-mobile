import { createRef } from 'react';
import { act, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { OnboardingServicesStep } from '../OnboardingServicesStep';

describe('OnboardingServicesStep', () => {
  it('prefills the service name from the specialty', () => {
    renderWithProviders(
      <OnboardingServicesStep
        services={[]}
        suggestedName="Auto detailing"
        onServicesChange={jest.fn()}
      />,
    );

    expect(screen.getByDisplayValue('Auto detailing')).toBeTruthy();
    expect(screen.queryByText('Service details')).toBeNull();
    expect(screen.queryByText('+ Add this service')).toBeNull();
  });

  it('commits a prefilled draft on next', () => {
    const onServicesChange = jest.fn();
    const ref = createRef();

    renderWithProviders(
      <OnboardingServicesStep
        ref={ref}
        services={[]}
        suggestedName="Auto detailing"
        onServicesChange={onServicesChange}
      />,
    );

    let committed;
    act(() => {
      committed = ref.current.commitDraftIfNeeded();
    });

    expect(committed).toHaveLength(1);
    expect(committed[0].name).toBe('Auto detailing');
    expect(committed[0].description).toBe('Auto detailing');
    expect(committed[0].priceInput).toBe('0');
    expect(onServicesChange).toHaveBeenCalledWith(committed);
  });
});
