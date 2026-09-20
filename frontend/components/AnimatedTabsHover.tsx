import React from 'react';
import { AnimatedBackground } from '@/components/core/animated-background';

export interface AnimatedTabsHoverProps {
  tabs?: string[];
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

/**
 * AnimatedTabsHover — React component powered by Motion Primitives.
 * Features a spring-animated sliding background pill on hover and tab change.
 */
export function AnimatedTabsHover({
  tabs = ['Home', 'About', 'Services', 'Contact'],
  defaultTab,
  onTabChange,
  className = '',
}: AnimatedTabsHoverProps) {
  const [selectedTab, setSelectedTab] = React.useState<string>(defaultTab || tabs[0]);

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className={`flex flex-row items-center ${className}`}>
      <AnimatedBackground
        defaultValue={selectedTab}
        className="rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/40"
        transition={{
          type: 'spring',
          bounce: 0.2,
          duration: 0.3,
        }}
        enableHover
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            data-id={tab}
            type="button"
            onClick={() => handleTabClick(tab)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              selectedTab === tab
                ? 'text-zinc-950 dark:text-zinc-100 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  );
}

export default AnimatedTabsHover;
