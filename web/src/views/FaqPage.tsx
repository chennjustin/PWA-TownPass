'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Search } from 'lucide-react';
import { townPassFaqData, type TownPassFaqCategory, type TownPassFaqItem } from '@/src/lib/townpass-faq-data';
import { cn } from '@/src/lib/utils';

type CategoryFilter = '全部' | TownPassFaqCategory;

type FaqGroup = {
  category: TownPassFaqCategory;
  items: TownPassFaqItem[];
};

function matchesFaq(item: TownPassFaqItem, keyword: string) {
  if (keyword.length === 0) {
    return true;
  }

  const text = `${item.question} ${item.answer.join(' ')} ${item.tags.join(' ')}`.toLowerCase();
  return text.includes(keyword);
}

export function FaqPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('全部');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['faq-01']));
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const faqItemRefs = useRef<Record<string, HTMLElement | null>>({});

  const categories = useMemo(
    () => ['全部', ...Array.from(new Set(townPassFaqData.map((item) => item.category)))] as const,
    [],
  );

  const filteredFaqs = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return townPassFaqData.filter((item) => {
      const categoryMatched = selectedCategory === '全部' || item.category === selectedCategory;
      return categoryMatched && matchesFaq(item, keyword);
    });
  }, [query, selectedCategory]);

  const groupedFaqs = useMemo<FaqGroup[]>(() => {
    if (selectedCategory !== '全部') {
      return [{ category: selectedCategory, items: filteredFaqs }];
    }

    const order = categories.filter((category): category is TownPassFaqCategory => category !== '全部');
    return order
      .map((category) => ({
        category,
        items: filteredFaqs.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filteredFaqs, selectedCategory]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    const container = categoryScrollRef.current;
    if (!container) {
      return;
    }

    const distance = direction === 'left' ? -140 : 140;
    container.scrollBy({ left: distance, behavior: 'smooth' });
  };

  const jumpToFirstResult = () => {
    const firstResult = filteredFaqs[0];
    if (!firstResult) {
      return;
    }

    setExpandedIds((current) => {
      const next = new Set(current);
      next.add(firstResult.id);
      return next;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        faqItemRefs.current[firstResult.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  };

  return (
    <section className="h-full overflow-y-auto no-scrollbar pb-24">
      <div className="sticky top-0 z-20 border-b border-grayscale-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-grayscale-700 transition active:scale-95"
              aria-label="回到首頁"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-lg font-semibold text-on-surface">常見問題</h2>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  jumpToFirstResult();
                }
              }}
              placeholder="搜尋關鍵字"
              className="tp-search-field pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary">
              {filteredFaqs.length}/{townPassFaqData.length}
            </span>
          </div>
        </div>

        <div className="border-b border-grayscale-100 px-1">
          <div className="relative">
            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-white/95 px-1 text-sm font-semibold text-grayscale-500"
              aria-label="向左捲動分類"
            >
              {'<'}
            </button>
            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-white/95 px-1 text-sm font-semibold text-grayscale-500"
              aria-label="向右捲動分類"
            >
              {'>'}
            </button>
            <div ref={categoryScrollRef} className="flex overflow-x-auto no-scrollbar px-4">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'shrink-0 border-b-2 px-3 py-2 text-xs font-semibold transition',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-grayscale-500',
                  )}
                >
                  {category}
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 pb-4 pt-3">
        {groupedFaqs.length === 0 && (
          <div className="rounded-lg border border-dashed border-grayscale-200 p-5 text-center text-sm text-grayscale-500">
            找不到符合條件的問題
          </div>
        )}

        {groupedFaqs.map((group) => (
          <section key={group.category} className="space-y-1">
            <h3 className="text-sm font-semibold text-primary-700">{group.category}</h3>
            <div className="tp-card overflow-hidden">
              {group.items.map((item, index) => {
                const expanded = expandedIds.has(item.id);

                return (
                  <article
                    key={item.id}
                    ref={(element) => {
                      faqItemRefs.current[item.id] = element;
                    }}
                    className="scroll-mt-36"
                  >
                    <div
                    className={cn(index !== group.items.length - 1 && 'border-b border-grayscale-100')}
                  >
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="flex w-full items-center gap-2 px-3 py-3 text-left"
                      aria-expanded={expanded}
                    >
                      <span className="min-w-0 flex-1 text-sm font-medium text-on-surface">{item.question}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-grayscale-500 transition-transform',
                          expanded && 'rotate-180',
                        )}
                      />
                    </button>
                    {expanded && (
                      <div className="space-y-1 bg-grayscale-50 px-3 pb-3 pt-1 text-sm leading-relaxed text-grayscale-700">
                        {item.answer.map((line, lineIndex) => (
                          <p key={`${item.id}-${lineIndex}`}>{line}</p>
                        ))}
                      </div>
                    )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

