import { suggestionPanelSize } from '../suggestionPlacement';

describe('suggestionPanelSize', () => {
  it('gives the list a real height so it is visible in the form', () => {
    const { listHeight, panelHeight } = suggestionPanelSize(3, false);
    expect(listHeight).toBeGreaterThan(0);
    expect(panelHeight).toBe(listHeight);
  });
});
