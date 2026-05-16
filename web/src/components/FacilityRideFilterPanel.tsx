'use client';

import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  type RideFilterState,
  heightFilterOptions,
  thrillFilterOptions,
  environmentFilterOptions,
  priceFilterOptions,
  specialFilterOptions,
} from '@/src/lib/townpass-map-data';

export function getActiveRideFilterCount(rideFilters: RideFilterState) {
  return Object.values(rideFilters).reduce((total, values) => total + values.length, 0);
}

type FacilityFilterToggleButtonProps = {
  open: boolean;
  activeCount: number;
  highlighted: boolean;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
};

export function FacilityFilterToggleButton({
  open,
  activeCount,
  highlighted,
  onClick,
  className,
  ariaLabel = '開啟篩選器',
}: FacilityFilterToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition active:scale-95',
        highlighted
          ? 'border border-primary bg-primary text-white'
          : 'border border-grayscale-100 bg-white text-primary',
        className,
      )}
      aria-expanded={open}
      aria-label={ariaLabel}
    >
      <SlidersHorizontal className="h-5 w-5" />
      {activeCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

type FacilityRideFilterPanelProps = {
  rideFilters: RideFilterState;
  onRideFiltersChange: (next: RideFilterState) => void;
  onReset: () => void;
  resetDisabled?: boolean;
  className?: string;
  footer?: ReactNode;
};

export function FacilityRideFilterPanel({
  rideFilters,
  onRideFiltersChange,
  onReset,
  resetDisabled = false,
  className,
  footer,
}: FacilityRideFilterPanelProps) {
  const activeRideFilterCount = getActiveRideFilterCount(rideFilters);

  const toggleRideFilter = (key: keyof RideFilterState, value: string) => {
    const selectedValues = rideFilters[key];
    const nextValues = selectedValues.includes(value)
      ? selectedValues.filter((selectedValue) => selectedValue !== value)
      : [...selectedValues, value];

    onRideFiltersChange({ ...rideFilters, [key]: nextValues });
  };

  const renderFilterGroup = (
    key: keyof RideFilterState,
    label: string,
    options: string[],
    groupClassName = '',
  ) => (
    <div className={cn('space-y-2', groupClassName)}>
      <p className="text-xs font-bold text-grayscale-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = rideFilters[key].includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleRideFilter(key, option)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95',
                selected
                  ? 'border-primary bg-primary text-white'
                  : 'border-grayscale-100 bg-white text-grayscale-700',
              )}
              aria-pressed={selected}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border border-grayscale-100 bg-white/95 p-3 shadow-lg backdrop-blur',
        className,
      )}
    >
      <div className="grid gap-3">
        {renderFilterGroup('height', '身高限制', heightFilterOptions)}
        {renderFilterGroup('thrill', '尖叫指數', thrillFilterOptions)}
        {renderFilterGroup('environment', '室內外', environmentFilterOptions)}
        {priceFilterOptions.length > 0 &&
          renderFilterGroup('price', '票價 / 類型', priceFilterOptions)}
        {renderFilterGroup('special', '特殊族群', specialFilterOptions)}
      </div>

      {footer}

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-grayscale-500">
          {activeRideFilterCount > 0 ? `已套用 ${activeRideFilterCount} 個篩選` : '尚未套用篩選'}
        </span>
        <button
          type="button"
          onClick={onReset}
          disabled={resetDisabled}
          className="text-xs font-semibold text-primary disabled:text-grayscale-300"
        >
          清除篩選
        </button>
      </div>
    </div>
  );
}
