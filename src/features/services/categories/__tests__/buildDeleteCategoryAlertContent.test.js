import { buildDeleteCategoryAlertContent } from '../utils/buildDeleteCategoryAlertContent';

describe('buildDeleteCategoryAlertContent', () => {
  it('uses empty-category copy when no services are assigned', () => {
    expect(
      buildDeleteCategoryAlertContent({ categoryName: 'Cars', assignedServiceCount: 0 }),
    ).toEqual({
      title: 'Delete "Cars"?',
      message: 'This category will be removed.',
      confirmText: 'Delete category',
    });
  });

  it('uses singular copy for one assigned service', () => {
    expect(
      buildDeleteCategoryAlertContent({ categoryName: 'RVs', assignedServiceCount: 1 }),
    ).toEqual({
      title: 'Delete "RVs"?',
      message:
        "1 service is in this category. They'll stay on your list and appear under No category.",
      confirmText: 'Delete category',
    });
  });

  it('uses plural copy for multiple assigned services', () => {
    expect(
      buildDeleteCategoryAlertContent({ categoryName: 'Boats', assignedServiceCount: 3 }),
    ).toEqual({
      title: 'Delete "Boats"?',
      message:
        "3 services are in this category. They'll stay on your list and appear under No category.",
      confirmText: 'Delete category',
    });
  });

  it('falls back when the category name is missing', () => {
    expect(buildDeleteCategoryAlertContent({ assignedServiceCount: 0 })).toEqual({
      title: 'Delete category?',
      message: 'This category will be removed.',
      confirmText: 'Delete category',
    });
  });
});
