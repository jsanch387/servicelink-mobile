import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { EditAppointmentJobsList } from '../components/EditAppointmentJobsList';

const job = {
  localId: 'job-1',
  serviceName: 'Full Detail',
  selectedPricingOption: { label: 'Standard', priceLabel: '$150', priceCents: 15000 },
  vehicle: { year: '2019', make: 'Honda', model: 'Civic' },
};

function renderList(props) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <EditAppointmentJobsList jobs={[job]} onSelectJob={jest.fn()} {...props} />
      </TypographyProvider>
    </ThemeProvider>,
  );
}

describe('EditAppointmentJobsList', () => {
  it('shows Add another job when the action is enabled', () => {
    const onAddAnotherJob = jest.fn();
    renderList({ canAddAnotherJob: true, onAddAnotherJob });

    fireEvent.press(screen.getByLabelText('Add another job to this visit'));
    expect(onAddAnotherJob).toHaveBeenCalledTimes(1);
  });

  it('hides Add another job when the action is off', () => {
    renderList();

    expect(screen.queryByLabelText('Add another job to this visit')).toBeNull();
  });
});
