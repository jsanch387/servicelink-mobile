const SUGGESTION_ROW_HEIGHT = 56;
const SUGGESTION_LIST_MAX_HEIGHT = 188;
const SUGGESTION_LIST_CHROME = 8;
const SUGGESTION_FOOTER_HEIGHT = 32;

/**
 * @param {number} rowCount
 * @param {boolean} includeFooter
 * @returns {{ listHeight: number, panelHeight: number }}
 */
export function suggestionPanelSize(rowCount, includeFooter = false) {
  const rows = Math.max(1, rowCount);
  const listHeight = Math.min(
    SUGGESTION_LIST_MAX_HEIGHT,
    rows * SUGGESTION_ROW_HEIGHT + SUGGESTION_LIST_CHROME,
  );
  return {
    listHeight,
    panelHeight: listHeight + (includeFooter ? SUGGESTION_FOOTER_HEIGHT : 0),
  };
}
