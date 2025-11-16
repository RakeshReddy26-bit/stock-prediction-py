import { useEffect, useMemo, useState } from 'react'
import StockChart from './components/charts/StockChart'

function Sparkline({ values, intervals, showBand = true, showTooltips = true }: { values: number[]; intervals?: [number, number][]; showBand?: boolean; showTooltips?: boolean }) {
  if (!values?.length) return null
  const width = 140, height = 40
  const min = Math.min(...values), max = Math.max(...values)
  const step = values.length > 1 ? width / (values.length - 1) : width
  const y = (v: number) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height)
  const points = values.map((v, i) => `${i * step},${y(v).toFixed(2)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width, height }} preserveAspectRatio="none">
      {showBand && intervals && intervals.length === values.length && (
        (() => {
          const upper = intervals.map(([lo, hi]) => hi)
          const lower = intervals.map(([lo]) => lo)
          const upPts = upper.map((v, i) => `${i * step},${y(v).toFixed(2)}`).join(' ')
          const lowPts = lower.map((v, i) => `${i * step},${y(v).toFixed(2)}`).join(' ')
          const poly = `${upPts} ${lower.slice().reverse().map((v, idx) => {
            const i = lower.length - 1 - idx
            return `${i * step},${y(v).toFixed(2)}`
          }).join(' ')}`
          return <polygon fill="#93c5fd55" points={poly} />
        })()
      )}
      <polyline fill="none" stroke="#2563eb" strokeWidth={1.5} points={points} />
      {showTooltips && values.map((v, i) => (
        <circle key={i} cx={i * step} cy={y(v)} r={2} fill="#2563eb">
          <title>{Number(v).toFixed(2)}</title>
        </circle>
      ))}
    </svg>
  )
}

export default function App() {
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Record<string, number[]>>({})
  const [ticker, setTicker] = useState('AAPL')
  const [horizon, setHorizon] = useState(5)
  const [model, setModel] = useState<'rf'|'lstm'|'lstm_tuned'|'xgb'|'arima'|'transformer'|'ensemble'>('rf')
  const [predicting, setPredicting] = useState(false)
  const [tuning, setTuning] = useState(false)
  const [tuneTrials, setTuneTrials] = useState(12)
  const [tuneTimeout, setTuneTimeout] = useState(600)
  const [tuneMsg, setTuneMsg] = useState<string | null>(null)
  const [result, setResult] = useState<number[] | null>(null)
  const [detail, setDetail] = useState<null | {
    ticker: string
    as_of?: string
    last_close?: number
    sma5?: number
    sma20?: number
    rsi14?: number
    predictions?: number[]
  intervals?: [number, number][]
  confidence?: number
  up_prob?: number
  risk_score?: number
  vol_forecast?: number[]
  }>(null)
  const [showCI, setShowCI] = useState(true)
  const [history, setHistory] = useState<{ date: string; open: number; high: number; low: number; close: number; volume?: number | null }[] | null>(null)
  const [dark, setDark] = useState(false)
  const [range, setRange] = useState<'1M'|'3M'|'6M'|'1Y'|'MAX'>('6M')
  const [showSMA, setShowSMA] = useState(true)
  const [exportReq, setExportReq] = useState(false)
  const [btLoading, setBtLoading] = useState(false)
  const [bt, setBt] = useState<null | { rmse: number; mae: number; accuracy?: number; baseline?: { naive?: { rmse: number; mae: number }, sma5?: { rmse: number; mae: number } }, model?: string, mode?: 'static'|'walk' }>(null)
  const [btWalk, setBtWalk] = useState(false)
  const [toast, setToast] = useState<null | { msg: string; type?: 'ok'|'err' }>(null)

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type })
  }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const r = await fetch('/api/api/v1/models')
        const js = await r.json()
        if (!r.ok) throw new Error(js?.detail || 'Failed to load models')
        setModels(js.models || js.data?.models || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const preview = async (ticker: string) => {
    try {
      const r = await fetch('/api/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, days: horizon, model })
      })
      const js = await r.json()
      if (!r.ok) throw new Error(js?.detail || 'Failed to predict')
      const preds: number[] = js.predictions || js.data?.predictions || []
      setPreviews((p) => ({ ...p, [ticker]: preds.slice(0, horizon) }))
    } catch (e) {
      console.error(e)
    }
  }

  const runPredict = async () => {
    setPredicting(true)
    setResult(null)
    try {
      const r = await fetch('/api/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), days: horizon, model })
      })
      const js = await r.json()
      if (!r.ok) throw new Error(js?.detail || 'Failed to predict')
      const preds: number[] = js.predictions || js.data?.predictions || []
      const intervals: [number, number][] = js.intervals || js.data?.intervals || []
      setResult(preds.slice(0, horizon))
      // Capture detail metrics if present
      setDetail({
        ticker: ticker.trim().toUpperCase(),
        as_of: js.as_of || js.data?.as_of,
        last_close: js.last_close ?? js.data?.last_close,
        sma5: js.sma5 ?? js.data?.sma5,
        sma20: js.sma20 ?? js.data?.sma20,
        rsi14: js.rsi14 ?? js.data?.rsi14,
        predictions: preds.slice(0, horizon),
        intervals: intervals.slice(0, horizon),
        confidence: js.confidence ?? js.data?.confidence,
        up_prob: js.up_prob ?? js.data?.up_prob,
        risk_score: js.risk_score ?? js.data?.risk_score,
        vol_forecast: js.vol_forecast ?? js.data?.vol_forecast
      })
    } catch (e) {
      setError((e as any)?.message || 'Prediction failed')
    } finally {
      setPredicting(false)
    }
  }

  const runTune = async (t: string) => {
    setTuning(true)
    setTuneMsg(null)
    try {
      const r = await fetch('/api/api/v1/tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: t.trim().toUpperCase(), n_trials: tuneTrials, timeout_sec: tuneTimeout })
      })
      const js = await r.json()
      if (!r.ok) throw new Error(js?.detail || 'Tuning failed')
      setTuneMsg(`Tuned ${js.ticker}. Saved: ${js.bundle}`)
    } catch (e: any) {
      setTuneMsg(e.message || 'Tuning error')
    } finally {
      setTuning(false)
    }
  }

  const loadDetails = async (t: string) => {
    try {
      const r = await fetch('/api/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: t, days: horizon, model })
      })
      const js = await r.json()
      if (!r.ok) throw new Error(js?.detail || 'Failed to load details')
      const preds: number[] = js.predictions || js.data?.predictions || []
      const intervals: [number, number][] = js.intervals || js.data?.intervals || []
      setDetail({
        ticker: js.ticker || t,
        as_of: js.as_of || js.data?.as_of,
        last_close: js.last_close ?? js.data?.last_close,
        sma5: js.sma5 ?? js.data?.sma5,
        sma20: js.sma20 ?? js.data?.sma20,
        rsi14: js.rsi14 ?? js.data?.rsi14,
        predictions: preds.slice(0, horizon),
        intervals: intervals.slice(0, horizon),
        confidence: js.confidence ?? js.data?.confidence,
        up_prob: js.up_prob ?? js.data?.up_prob,
        risk_score: js.risk_score ?? js.data?.risk_score,
        vol_forecast: js.vol_forecast ?? js.data?.vol_forecast
      })
      // Fetch history for chart
      const hr = await fetch(`/api/api/v1/stocks/${(js.ticker || t).toUpperCase()}/history`)
      const hjs = await hr.json()
      if (hr.ok) setHistory(hjs.data || [])
    } catch (e: any) {
      setError(e.message || 'Error loading details')
    }
  }

  const chartCandles = useMemo(() => {
    if (!history) return []
    const sliced = (() => {
      if (!history?.length) return []
      const n = history.length
      const pick = (months: number) => Math.max(0, n - Math.round(months * 21))
      const startIndex = range === '1M' ? pick(1) : range === '3M' ? pick(3) : range === '6M' ? pick(6) : range === '1Y' ? pick(12) : 0
      return history.slice(startIndex)
    })()
    return sliced.map(h => ({
      time: (Date.parse(h.date) / 1000) as any,
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close,
      volume: h.volume ?? null,
    }))
  }, [history, range])

  const chartPredictions = useMemo(() => {
    if (!detail?.predictions) return []
    // start from next day after last history point
    const startTs = history?.length ? Date.parse(history[history.length - 1].date) / 1000 : Math.floor(Date.now() / 1000)
    return (detail.intervals || detail.predictions.map(v => [v, v] as [number, number])).map((iv, idx) => ({
      time: (startTs + 86400 * (idx + 1)) as any,
      value: detail.predictions![idx],
      low: iv[0],
      high: iv[1],
    }))
  }, [detail, history])

  const insights = useMemo(() => {
    if (!detail) return null as null | {
      up?: number
      risk?: number
      vol?: number
      delta?: number
      pct?: number
      trend?: 'Bullish' | 'Neutral' | 'Bearish'
    }
    const up = typeof detail.up_prob === 'number' ? detail.up_prob : undefined
    const risk = typeof detail.risk_score === 'number' ? detail.risk_score : undefined
    const vol = Array.isArray(detail.vol_forecast) && detail.vol_forecast.length ? detail.vol_forecast[0] : undefined
    const lc = detail.last_close
    const next = detail.predictions?.[0]
    const delta = lc != null && next != null ? next - lc : undefined
    const pct = delta != null && lc ? delta / lc : undefined
    let trend: 'Bullish' | 'Neutral' | 'Bearish' | undefined
    if (typeof up === 'number') trend = up > 0.6 ? 'Bullish' : up < 0.4 ? 'Bearish' : 'Neutral'
  return { up, risk, vol, delta, pct, trend }
  }, [detail])

  const runBacktest = async () => {
    if (!detail?.ticker) return
    setBtLoading(true)
    try {
      const r = await fetch(`/api/api/v1/stocks/${detail.ticker}/backtest?model=${encodeURIComponent(model)}&mode=${btWalk ? 'walk' : 'static'}`)
      const js = await r.json()
      if (!r.ok) throw new Error(js?.detail || 'Backtest failed')
      const data = js.data || js
      const tm = data?.test_metrics || {}
  setBt({ rmse: tm.rmse, mae: tm.mae, accuracy: tm.accuracy, baseline: data?.baseline, model, mode: (btWalk ? 'walk' : 'static') })
  showToast('Backtest complete')
    } catch (e) {
      setBt(null)
      setError((e as any)?.message || 'Backtest error')
  showToast('Backtest failed', 'err')
    } finally {
      setBtLoading(false)
    }
  }

  const exportCsv = () => {
    if (!detail?.predictions || !detail?.predictions.length) return
    // Start date: day after last history date or today
    const baseTs = history?.length ? Date.parse(history[history.length - 1].date) : Date.now()
    const rows = [['Date','Prediction','Low95','High95']]
    for (let i = 0; i < detail.predictions.length; i++) {
      const d = new Date(baseTs + (i + 1) * 86400000)
      const pred = detail.predictions[i]
      const lo = detail.intervals?.[i]?.[0] ?? pred
      const hi = detail.intervals?.[i]?.[1] ?? pred
      rows.push([d.toISOString().slice(0,10), String(pred), String(lo), String(hi)])
    }
    const csv = rows.map(r => r.map(x => (typeof x === 'string' && x.includes(',') ? `"${x}"` : x)).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(detail?.ticker || ticker).toUpperCase()}_predictions.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  showToast('CSV downloaded')
  }

  const copyPredJson = async () => {
    if (!detail) return
    const payload = {
      ticker: detail.ticker,
      as_of: detail.as_of,
      last_close: detail.last_close,
      predictions: detail.predictions,
      intervals: detail.intervals,
      confidence: detail.confidence,
      up_prob: detail.up_prob,
      risk_score: detail.risk_score,
      vol_forecast: detail.vol_forecast,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  showToast('Prediction JSON copied')
    } catch {}
  }

  const downloadBacktestJson = () => {
    if (!bt) return
    const blob = new Blob([JSON.stringify({ model: bt.model, mode: bt.mode, ...bt }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(detail?.ticker || ticker).toUpperCase()}_backtest_${(bt.model||'rf')}_${bt.mode||'static'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  showToast('Backtest JSON downloaded')
  }

  return (
  <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial', padding: 16, background: dark ? '#0b1220' : '#ffffff', color: dark ? '#e2e8f0' : '#0f172a', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 8 }}>Stocks</h1>
      <p style={{ color: '#475569', marginBottom: 16 }}>Standalone stock models UI</p>

      {/* Search, Model, Horizon, and Tuning Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Ticker (e.g., AAPL)"
          style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, width: 180 }}
        />
        <label style={{ fontSize: 12, color: '#334155' }}>Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as any)}
          style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6 }}
        >
          <option value="rf">Random Forest</option>
          <option value="lstm">LSTM</option>
          <option value="lstm_tuned">LSTM (Tuned)</option>
          <option value="xgb">XGBoost</option>
          <option value="arima">ARIMA</option>
          <option value="transformer">Transformer</option>
          <option value="ensemble">Ensemble</option>
        </select>
        <label style={{ fontSize: 12, color: '#334155' }}>Horizon</label>
        <select
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value))}
          style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6 }}
        >
          <option value={1}>1 day</option>
          <option value={3}>3 days</option>
          <option value={5}>5 days</option>
          <option value={10}>10 days</option>
          <option value={15}>15 days</option>
          <option value={30}>30 days</option>
        </select>
        <button onClick={runPredict} disabled={predicting} style={{ background: '#2563eb', color: 'white', padding: '8px 12px', borderRadius: 6 }}>
          {predicting ? 'Predicting…' : 'Predict'}
        </button>
        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
          <label style={{ fontSize: 12, color: '#334155' }}>Theme</label>
          <select value={dark ? 'dark' : 'light'} onChange={(e) => setDark(e.target.value === 'dark')} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6 }}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
          <label style={{ fontSize: 12, color: '#334155' }}>Trials</label>
          <input type="number" min={1} max={200} value={tuneTrials} onChange={(e) => setTuneTrials(Number(e.target.value))} style={{ width: 72, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6 }} />
          <label style={{ fontSize: 12, color: '#334155' }}>Timeout(s)</label>
          <input type="number" min={30} max={7200} value={tuneTimeout} onChange={(e) => setTuneTimeout(Number(e.target.value))} style={{ width: 84, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6 }} />
          <button onClick={() => runTune(ticker)} disabled={tuning} style={{ background: '#0f766e', color: 'white', padding: '8px 12px', borderRadius: 6 }}>
            {tuning ? 'Tuning…' : 'Tune'}
          </button>
        </div>
      </div>
      {tuneMsg && <div style={{ marginBottom: 12, fontSize: 12, color: tuneMsg.toLowerCase().includes('error') ? '#dc2626' : '#065f46' }}>{tuneMsg}</div>}

      {detail && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600 }}>{detail.ticker} · {detail.as_of ? new Date(detail.as_of).toLocaleDateString() : ''}</div>
            <button onClick={() => setDetail(null)} style={{ fontSize: 12, color: '#64748b' }}>Close</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label style={{ fontSize: 12 }}>Range</label>
              <select value={range} onChange={(e) => setRange(e.target.value as any)} style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <option value="1M">1M</option>
                <option value="3M">3M</option>
                <option value="6M">6M</option>
                <option value="1Y">1Y</option>
                <option value="MAX">Max</option>
              </select>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <input type="checkbox" checked={showSMA} onChange={(e) => setShowSMA(e.target.checked)} />
                Show SMA
              </label>
            </div>
            <div style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
              <StockChart
                candles={chartCandles}
                predictions={chartPredictions}
                showCI={showCI}
                height={360}
                dark={dark}
                showSMA={showSMA}
        onExportPng={exportReq ? (dataUrl) => {
                  try {
                    const name = `${(detail?.ticker || ticker).toUpperCase()}_${new Date().toISOString().slice(0, 10)}.png`
                    const a = document.createElement('a')
                    a.href = dataUrl
                    a.download = name
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
          showToast('PNG downloaded')
                  } finally {
                    setExportReq(false)
                  }
                } : undefined}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Sparkline values={detail.predictions || result || []} intervals={detail.intervals} showBand={showCI} showTooltips={true} />
              <div style={{ fontSize: 12 }}>
                <div>Last Close: <b>{detail.last_close != null ? Number(detail.last_close).toFixed(2) : '-'}</b></div>
                <div>SMA 5: <b>{detail.sma5 != null ? Number(detail.sma5).toFixed(2) : '-'}</b></div>
                <div>SMA 20: <b>{detail.sma20 != null ? Number(detail.sma20).toFixed(2) : '-'}</b></div>
                <div>RSI 14: <b>{detail.rsi14 != null ? Number(detail.rsi14).toFixed(2) : '-'}</b></div>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8, fontSize: 12, color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="24" height="10" viewBox="0 0 24 10"><line x1="0" y1="5" x2="24" y2="5" stroke="#2563eb" strokeWidth="2"/></svg>
              <span>Prediction</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 10, background: '#93c5fd55', border: '1px solid #93c5fd' }} />
              <span>95% CI {showCI ? '' : '(hidden)'}</span>
            </div>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#334155' }}>
            <input type="checkbox" checked={showCI} onChange={(e) => setShowCI(e.target.checked)} />
            Show 95% CI band
          </label>
          {/* AI Insights */}
          {insights && (insights.up != null || insights.risk != null || insights.vol != null) && (
            (() => {
              const trend = insights.trend || 'Neutral'
              const bg = trend === 'Bullish' ? (dark ? '#052e1a' : '#ecfdf5') : trend === 'Bearish' ? (dark ? '#3a0a0a' : '#fef2f2') : (dark ? '#111827' : '#f8fafc')
              const bd = trend === 'Bullish' ? (dark ? '#065f46' : '#a7f3d0') : trend === 'Bearish' ? (dark ? '#7f1d1d' : '#fecaca') : (dark ? '#1f2937' : '#e2e8f0')
              const fg = trend === 'Bullish' ? (dark ? '#34d399' : '#065f46') : trend === 'Bearish' ? (dark ? '#f87171' : '#7f1d1d') : (dark ? '#cbd5e1' : '#334155')
              return (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: bg, border: `1px solid ${bd}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 600, color: fg }}>AI Insights</div>
                    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: fg }}>
                        <input type="checkbox" checked={btWalk} onChange={(e) => setBtWalk(e.target.checked)} />
                        Walk-forward
                      </label>
                      <button onClick={() => runBacktest()} disabled={btLoading} style={{ fontSize: 12, color: fg, border: `1px solid ${bd}`, padding: '6px 10px', borderRadius: 6, background: 'transparent' }}>{btLoading ? 'Backtesting…' : 'Backtest'}</button>
                      <button onClick={() => setExportReq(true)} style={{ fontSize: 12, color: fg, border: `1px solid ${bd}`, padding: '6px 10px', borderRadius: 6, background: 'transparent' }}>Export PNG</button>
                      <button onClick={exportCsv} style={{ fontSize: 12, color: fg, border: `1px solid ${bd}`, padding: '6px 10px', borderRadius: 6, background: 'transparent' }}>Export CSV</button>
                      <button onClick={copyPredJson} style={{ fontSize: 12, color: fg, border: `1px solid ${bd}`, padding: '6px 10px', borderRadius: 6, background: 'transparent' }}>Copy JSON</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', fontSize: 12 }}>
                    {insights.trend && (
                      <div style={{ padding: '4px 8px', borderRadius: 999, background: 'transparent', border: `1px solid ${bd}`, color: fg }}>
                        Trend: <b>{insights.trend}</b>
                      </div>
                    )}
                    {typeof insights.up === 'number' && (
                      <div>Up Probability: <b>{Math.round(insights.up * 100)}%</b></div>
                    )}
                    {typeof insights.risk === 'number' && (
                      <div>Risk Score: <b>{Math.round(insights.risk)}/100</b></div>
                    )}
                    {typeof insights.vol === 'number' && (
                      <div>Next-step Vol: <b>{(insights.vol * 100).toFixed(1)}%</b></div>
                    )}
                    {typeof insights.delta === 'number' && typeof insights.pct === 'number' && (
                      <div>Next move: <b>{insights.delta >= 0 ? '+' : ''}{insights.delta.toFixed(2)}</b> (<b>{(insights.pct * 100).toFixed(2)}%</b>)</div>
                    )}
                    {model === 'ensemble' && (detail as any)?.weights && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>Weights:</span>
                        {Object.entries((detail as any).weights).map(([k,v]) => (
                          <span key={k} style={{ padding: '2px 6px', borderRadius: 999, border: `1px solid ${bd}` }}>{k}: {Math.round((v as number)*100)}%</span>
                        ))}
                      </div>
                    )}
                    {model === 'ensemble' && (detail as any)?.models_used && Array.isArray((detail as any).models_used) && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>Models:</span>
                        {((detail as any).models_used as string[]).map((m: string) => (
                          <span key={m} style={{ padding: '2px 6px', borderRadius: 999, border: `1px solid ${bd}` }}>{m}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {bt && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${bd}`, color: fg }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Backtest ({(bt.model || 'rf').toUpperCase()} · {bt.mode === 'walk' ? 'Walk-forward' : 'Static'})</div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                        <div>RMSE: <b>{Number(bt.rmse).toFixed(2)}</b></div>
                        <div>MAE: <b>{Number(bt.mae).toFixed(2)}</b></div>
                        {typeof bt.accuracy === 'number' && (
                          <div>Directional Acc: <b>{(bt.accuracy * 100).toFixed(1)}%</b></div>
                        )}
                        {bt.baseline?.naive && (
                          <div>Baseline (Naive) RMSE: <b>{Number(bt.baseline.naive.rmse).toFixed(2)}</b></div>
                        )}
                        {bt.baseline?.sma5 && (
                          <div>Baseline (SMA5) RMSE: <b>{Number(bt.baseline.sma5.rmse).toFixed(2)}</b></div>
                        )}
                        <div>
                          <button onClick={downloadBacktestJson} style={{ fontSize: 12, color: fg, border: `1px solid ${bd}`, padding: '4px 8px', borderRadius: 6, background: 'transparent' }}>Download JSON</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()
          )}
          {typeof detail.confidence === 'number' && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#334155', marginBottom: 4 }}>Confidence</div>
              <div style={{ background: '#e2e8f0', height: 8, borderRadius: 4, overflow: 'hidden', width: 240 }}>
                <div style={{ background: '#16a34a', width: `${Math.round(Math.max(0, Math.min(1, detail.confidence)) * 100)}%`, height: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: '#334155' }}>
                {typeof detail.up_prob === 'number' && <div>Up Prob: <b>{Math.round(detail.up_prob * 100)}%</b></div>}
                {typeof detail.risk_score === 'number' && <div>Risk: <b>{Math.round(detail.risk_score)}</b>/100</div>}
                {Array.isArray(detail.vol_forecast) && detail.vol_forecast.length > 0 && (
                  <div>Vol (next): <b>{(detail.vol_forecast[0] * 100).toFixed(1)}%</b></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {loading && <div>Loading models…</div>}
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}
      {toast && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, background: toast.type === 'err' ? '#fee2e2' : '#e2fbe8', color: toast.type === 'err' ? '#991b1b' : '#065f46', border: `1px solid ${toast.type === 'err' ? '#fecaca' : '#bbf7d0'}`, padding: '8px 12px', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          {toast.msg}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {models.map((m) => (
          <div key={m.ticker} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600 }}>{m.ticker}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => preview(m.ticker)} style={{ color: '#2563eb', fontSize: 12 }}>Preview {horizon}d</button>
                <button onClick={() => loadDetails(m.ticker)} style={{ color: '#0f766e', fontSize: 12 }}>Details</button>
                <button onClick={() => runTune(m.ticker)} disabled={tuning} style={{ color: '#7c3aed', fontSize: 12 }}>{tuning ? 'Tuning…' : 'Tune'}</button>
              </div>
            </div>
            {m.metrics && (
              <div style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>
                RMSE: {Number(m.metrics.rmse).toFixed(2)} · MAE: {Number(m.metrics.mae).toFixed(2)}
              </div>
            )}
            {previews[m.ticker] && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Sparkline values={previews[m.ticker]} />
                <div style={{ fontSize: 12 }}>{previews[m.ticker].map((v, i) => (
                  <span key={i}>{Number(v).toFixed(2)}{i < previews[m.ticker].length - 1 ? ', ' : ''}</span>
                ))}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
