
import { useState } from 'react';
import { formatCurrency } from '@/utils';

interface BudgetCardProps {
  remaining: number;
  totalSpent: number;
  target: number;
  progress: number;
  editingBudget: boolean;
  targetInput: string;
  onEditClick: () => void;
  onInputChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function BudgetCard({
  remaining,
  totalSpent,
  target,
  progress,
  editingBudget,
  targetInput,
  onEditClick,
  onInputChange,
  onSave,
  onCancel,
}: BudgetCardProps) {
  const getStatusColor = () => {
    if (progress > 100) return 'var(--accent)';
    if (progress > 80) return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="label block mb-2">SISA BUDGET</span>
        <div
          className="font-display text-[42px] font-medium tracking-tight"
          style={{ color: remaining < 0 ? 'var(--accent)' : 'var(--text-display)' }}
        >
          {formatCurrency(remaining)}
        </div>
        {editingBudget ? (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              inputMode="numeric"
              value={targetInput}
              onChange={(e) => onInputChange(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
              className="flex-1 p-2 text-[16px] font-mono"
            />
            <button
              onClick={onSave}
              className="px-4 py-2 font-bold"
              style={{ background: 'var(--success)', color: 'var(--black)', borderRadius: '4px', border: 'none' }}
            >
              ✓
            </button>
            <button
              onClick={onCancel}
              style={{ padding: '8px 12px', border: '1px solid var(--border-visible)', borderRadius: '4px', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={onEditClick}
            className="label mt-3 hover:text-text-secondary"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Edit Budget
          </button>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="label">PENGELUARAN</span>
          <span className="font-mono text-[14px] font-bold" style={{ color: getStatusColor() }}>
            {progress > 100 ? 'OVER ' : ''}
            {Math.min(progress, 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 10 }).map((_, i) => {
            const segmentFill = (i + 1) * 10 <= progress;
            return (
              <div
                key={i}
                className="flex-1 h-3 rounded-sm transition-colors"
                style={{ background: segmentFill ? getStatusColor() : 'var(--border)' }}
              />
            );
          })}
        </div>
        <div className="flex gap-2 items-center font-mono text-[12px]">
          <span className="font-bold" style={{ color: getStatusColor() }}>{formatCurrency(totalSpent)}</span>
          <span style={{ color: 'var(--text-disabled)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(target)}</span>
        </div>
      </div>
    </div>
  );
}