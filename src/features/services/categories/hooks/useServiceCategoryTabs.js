import { useEffect, useMemo, useState } from 'react';
import { buildServiceCategoryTabs } from '../utils/groupServicesByCategory';

/**
 * Category pill tabs on Services list: selection state + filtered services for active tab.
 *
 * @param {{
 *   enabled: boolean;
 *   services: { id: string }[];
 *   categories: { id: string; name: string }[];
 *   serviceCategoryById: Record<string, string | undefined>;
 * }} params
 */
export function useServiceCategoryTabs({ enabled, services, categories, serviceCategoryById }) {
  const [selectedTabId, setSelectedTabId] = useState('');

  const tabs = useMemo(() => {
    if (!enabled) return null;
    return buildServiceCategoryTabs({
      services,
      categories,
      serviceCategoryById,
    });
  }, [categories, enabled, serviceCategoryById, services]);

  useEffect(() => {
    if (!tabs?.length) {
      setSelectedTabId('');
      return;
    }
    const tabStillExists = tabs.some((tab) => tab.id === selectedTabId);
    if (tabStillExists) return;
    const firstWithServices = tabs.find((tab) => tab.count > 0);
    setSelectedTabId(firstWithServices?.id ?? tabs[0].id);
  }, [selectedTabId, tabs]);

  const visibleServices = useMemo(() => {
    if (!enabled || !tabs) return services;
    const activeTab = tabs.find((tab) => tab.id === selectedTabId);
    return activeTab?.services ?? [];
  }, [enabled, selectedTabId, services, tabs]);

  const activeTab = useMemo(() => {
    if (!enabled || !tabs?.length) return null;
    return tabs.find((tab) => tab.id === selectedTabId) ?? tabs[0];
  }, [enabled, selectedTabId, tabs]);

  const activeTabTitleLabel = useMemo(() => {
    if (!activeTab) return null;
    const count = activeTab.count ?? 0;
    return `${count} ${count === 1 ? 'service' : 'services'}`;
  }, [activeTab]);

  return {
    tabs,
    selectedTabId,
    setSelectedTabId,
    visibleServices,
    activeTab,
    activeTabTitleLabel,
  };
}
