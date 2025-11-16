import { useEffect, useMemo, useRef } from 'react'
import { createChart, IChartApi, Time, UTCTimestamp, SeriesDataItemTypeMap, ColorType } from 'lightweight-charts'

export type Candle = {
  time: UTCTimestamp | Time
  open: number
  high: number
  low: number
  close: number
  volume?: number | null
}

export type PredictionPoint = { time: UTCTimestamp | Time; value: number; low?: number; high?: number }

export default function StockChart({
  candles,
  predictions,
  height = 360,
  showCI = true,
  dark = false,
  showSMA = true,
  onExportPng,
}: {
  candles: Candle[]
  predictions?: PredictionPoint[]
  height?: number
  showCI?: boolean
  dark?: boolean
  showSMA?: boolean
  onExportPng?: (dataUrl: string) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    const container = containerRef.current!
    const chart = createChart(container, {
      height,
      layout: {
        background: { color: dark ? '#0b1220' : '#ffffff', type: ColorType.Solid },
        textColor: dark ? '#cbd5e1' : '#334155',
      },
      grid: {
        vertLines: { color: dark ? '#1e293b' : '#f1f5f9' },
        horzLines: { color: dark ? '#1e293b' : '#f1f5f9' },
      },
      rightPriceScale: { borderColor: dark ? '#334155' : '#e2e8f0' },
      timeScale: { borderColor: dark ? '#334155' : '#e2e8f0' },
      crosshair: { mode: 1 },
    })
    chartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
      priceLineVisible: false,
    })
    const volSeries = chart.addHistogramSeries({
      priceScaleId: '',
      priceFormat: { type: 'volume' },
      color: dark ? '#64748b' : '#94a3b8',
      base: 0,
    })
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.9, bottom: 0 } })
    const lineSeries = chart.addLineSeries({ color: '#2563eb', lineWidth: 2 })
    const upperCI = chart.addLineSeries({ color: '#93c5fd', lineWidth: 1, lineStyle: 1 })
    const lowerCI = chart.addLineSeries({ color: '#93c5fd', lineWidth: 1, lineStyle: 1 })
    const sma5 = chart.addLineSeries({ color: '#14b8a6', lineWidth: 1, priceLineVisible: false })
    const sma20 = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false })

    const mappedCandles: SeriesDataItemTypeMap['Candlestick'][] = candles.map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    candleSeries.setData(mappedCandles)
    // Volume bars colored by up/down
    const volData = candles.map((c, i) => ({
      time: c.time as any,
      value: (c.volume ?? 0) as number,
      color: (i > 0 && candles[i].close >= candles[i-1].close) ? (dark ? '#16a34a66' : '#16a34a99') : (dark ? '#dc262666' : '#dc262699')
    }))
    volSeries.setData(volData)

    if (showSMA) {
      const toNum = (t: Time | UTCTimestamp) => (t as number)
      // compute SMA on close
      const closes = candles.map(c => ({ time: c.time as any, value: c.close }))
      const sma = (period: number) => {
        const out: { time: any; value: number }[] = []
        const buf: number[] = []
        for (let i = 0; i < closes.length; i++) {
          buf.push(closes[i].value)
          if (buf.length > period) buf.shift()
          if (buf.length === period) {
            out.push({ time: closes[i].time, value: buf.reduce((a, b) => a + b, 0) / period })
          }
        }
        return out
      }
      sma5.setData(sma(5))
      sma20.setData(sma(20))
    }

    if (predictions && predictions.length) {
      const lineData = predictions.map(p => ({ time: p.time, value: p.value }))
      lineSeries.setData(lineData)
      if (showCI) {
        const upperData = predictions.map(p => ({ time: p.time, value: p.high ?? p.value }))
        const lowerData = predictions.map(p => ({ time: p.time, value: p.low ?? p.value }))
        upperCI.setData(upperData)
        lowerCI.setData(lowerData)
      }
    }

    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      chart.applyOptions({ width: rect.width })
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [height, JSON.stringify(candles), JSON.stringify(predictions), showCI, dark, showSMA])

  // Export PNG on demand
  useEffect(() => {
    if (!onExportPng) return
    const chart = chartRef.current
    if (!chart) return
    try {
      const canvas = chart.takeScreenshot() as HTMLCanvasElement
      const dataUrl = canvas.toDataURL('image/png')
      onExportPng(dataUrl)
    } catch {}
  }, [onExportPng])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}
