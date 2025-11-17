import React, { useEffect, useMemo, useState } from 'react';

// Small badge with metrics for each model
export default function StockModelsBadgeList() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, number[]>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch('/api/stocks/models');
        const js = await r.json();
        if (!r.ok || !js?.success) {
          throw new Error(js?.error || 'Failed to load models');
        }
        setModels(js.data?.models || []);
      } catch (e: any) {
        setError(e.message || 'Error loading models');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const preview = async (ticker: string) => {
    try {
      setBusy((b) => ({ ...b, [ticker]: true }));
      const r = await fetch('/api/stocks/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, useLSTM: false, days: 5, noCache: true }),
      });
      const js = await r.json();
      if (!r.ok || !js?.success) throw new Error(js?.error || 'Failed to get preview');
      const preds: number[] = js.data?.predictions || [];
      setPreviews((p) => ({ ...p, [ticker]: preds.slice(0, 5) }));
    } catch (e) {
      // ignore for now; could surface toast
    } finally {
      setBusy((b) => ({ ...b, [ticker]: false }));
    }
  };

  const Sparkline = ({ values }: { values: number[] }) => {
    const { points, min, max } = useMemo(() => {
      const vs = values.map((v) => Number(v)).filter((v) => Number.isFinite(v));
      const min = Math.min(...vs);
      const max = Math.max(...vs);
      const width = 100;
      const height = 24;
      const step = vs.length > 1 ? width / (vs.length - 1) : width;
      const norm = (v: number) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
      const pts = vs.map((v, i) => `${i * step},${norm(v).toFixed(2)}`).join(' ');
      return { points: pts, min, max };
    }, [values]);

    if (!points) return null;
    return (
      <svg viewBox="0 0 100 24" style={{ width: 100, height: 24, display: 'block' }} preserveAspectRatio="none">
        <polyline fill="none" stroke="#2563eb" strokeWidth="1.5" points={points} />
      </svg>
    );
  };

  if (loading) return <div className="text-sm text-gray-500">Loading models…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!models.length) return <div className="text-sm text-gray-500">No models found.</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {models.map((m) => (
        <div key={`${m.ticker}-${m.created_at}`} className="px-3 py-2 rounded-md border border-gray-200 bg-white shadow-sm min-w-[180px]">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">{m.ticker}</div>
            <button
              className="text-[11px] text-blue-600 hover:underline disabled:text-gray-400"
              onClick={() => preview(m.ticker)}
              disabled={!!busy[m.ticker]}
            >
              {busy[m.ticker] ? 'Loading…' : 'Preview'}
            </button>
          </div>
          <div className="text-[11px] text-gray-600">v: {m.version || m.created_at}</div>
          {m.metrics && (
            <div className="mt-1 text-[11px] text-gray-700">
              <span className="mr-2">RMSE: {Number(m.metrics.rmse).toFixed(2)}</span>
              <span className="mr-2">MAE: {Number(m.metrics.mae).toFixed(2)}</span>
              {m.metrics.accuracy !== undefined && (
                <span>Acc: {Math.round(Number(m.metrics.accuracy) * 100)}%</span>
              )}
            </div>
          )}
          {previews[m.ticker] && (
            <div className="mt-2">
              <div className="text-[11px] text-gray-700">Next 5:</div>
              <div className="flex items-center gap-2">
                <Sparkline values={previews[m.ticker]} />
                <div className="text-[11px] text-gray-800">
                  {previews[m.ticker].map((p, i) => (
                    <span key={i} className="mr-1">{Number(p).toFixed(2)}{i < previews[m.ticker].length - 1 ? ',' : ''}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
