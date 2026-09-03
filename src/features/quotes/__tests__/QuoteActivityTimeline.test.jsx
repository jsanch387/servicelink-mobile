import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ThemeProvider, TypographyProvider } from '../../../theme';
import { QuoteActivityTimeline } from '../components/QuoteActivityTimeline';

describe('QuoteActivityTimeline', () => {
  it('renders titles and times in order', () => {
    render(
      <ThemeProvider initialScheme="dark">
        <TypographyProvider>
          <QuoteActivityTimeline
            events={[
              { key: 'sent', title: 'Sent', detail: 'Aug 31, 2026, 11:09 PM' },
              { key: 'status', title: 'Viewed' },
            ]}
          />
        </TypographyProvider>
      </ThemeProvider>,
    );

    expect(screen.getByText('Activity')).toBeTruthy();
    expect(screen.getByText('Sent')).toBeTruthy();
    expect(screen.getByText('Aug 31, 2026, 11:09 PM')).toBeTruthy();
    expect(screen.getByText('Viewed')).toBeTruthy();
    expect(screen.queryByText('Customer opens your quote from the link you sent.')).toBeNull();
  });

  it('marks a failed send with the danger tone', () => {
    render(
      <ThemeProvider initialScheme="dark">
        <TypographyProvider>
          <QuoteActivityTimeline
            events={[
              { key: 'sent', title: 'Sent', detail: 'Sep 1, 12:09 AM' },
              {
                key: 'delivery-b',
                title: 'Text failed',
                detail: 'Sep 1, 12:09 AM',
                tone: 'danger',
              },
            ]}
          />
        </TypographyProvider>
      </ThemeProvider>,
    );

    const failed = screen.getByText('Text failed');
    const failedColor = StyleSheet.flatten(failed.props.style).color;
    const sentColor = StyleSheet.flatten(screen.getByText('Sent').props.style).color;

    expect(failedColor).not.toBe(sentColor);
  });

  it('renders nothing without events', () => {
    render(
      <ThemeProvider initialScheme="dark">
        <TypographyProvider>
          <QuoteActivityTimeline events={[]} />
        </TypographyProvider>
      </ThemeProvider>,
    );

    expect(screen.queryByText('Activity')).toBeNull();
  });
});
