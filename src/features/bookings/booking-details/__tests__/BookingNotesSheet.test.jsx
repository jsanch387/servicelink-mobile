import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { BookingNotesSheet } from '../components/BookingNotesSheet';

describe('BookingNotesSheet', () => {
  it('opens existing notes for reading until Edit', () => {
    const onSave = jest.fn();
    renderWithProviders(
      <BookingNotesSheet
        visible
        notes="Side gate is unlocked"
        onRequestClose={jest.fn()}
        onSave={onSave}
      />,
    );

    expect(screen.getByText('Side gate is unlocked')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Add notes for this visit.')).toBeNull();
    expect(screen.queryByText('Save')).toBeNull();

    fireEvent.press(screen.getByText('Edit'));

    expect(screen.getByDisplayValue('Side gate is unlocked')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('opens an empty visit ready to add notes', () => {
    renderWithProviders(
      <BookingNotesSheet visible notes="" onRequestClose={jest.fn()} onSave={jest.fn()} />,
    );

    expect(screen.getByText('Add notes for this visit.')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.queryByText('Edit')).toBeNull();
  });
});
