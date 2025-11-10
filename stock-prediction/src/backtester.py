"""
backtester.py
Backtesting engine for trading strategies with costs and risk metrics.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import calendar
import os


class Backtester:
    """
    Realistic backtester for long/flat strategy with costs, slippage, and metrics.
    Args:
        predictions: DataFrame with ['date', 'predicted_prob', 'actual_return']
        initial_capital: float
        threshold: float
        cost: float (transaction cost per trade)
        slippage: float (slippage per trade)
    Methods:
        run(): executes backtest and returns metrics + equity curve
    """

    def __init__(self, predictions: pd.DataFrame, initial_capital: float = 10000.0, threshold: float = 0.5, cost: float = 0.0005, slippage: float = 0.0002):
        self.df = predictions.copy()
        self.initial_capital = initial_capital
        self.threshold = threshold
        self.cost = cost
        self.slippage = slippage

    def run(self):
        df = self.df.copy()
        df['position'] = (df['predicted_prob'] > self.threshold).astype(int)
        df['trade'] = df['position'].diff().fillna(0).abs()
        df['trade_cost'] = df['trade'] * self.cost
        df['slippage_cost'] = df['trade'] * self.slippage
        df['pnl'] = df['position'] * df['actual_return'] - df['trade_cost'] - df['slippage_cost']
        df['equity'] = self.initial_capital * (1 + df['pnl']).cumprod()
        # Metrics
        total_return = df['equity'].iloc[-1] / self.initial_capital - 1
        n_years = (df['date'].iloc[-1] - df['date'].iloc[0]).days / 365.25
        cagr = (df['equity'].iloc[-1] / self.initial_capital) ** (1 / n_years) - 1 if n_years > 0 else np.nan
        returns = df['pnl']
        sharpe = np.mean(returns) / np.std(returns) * np.sqrt(252) if np.std(returns) > 0 else np.nan
        downside = returns[returns < 0]
        sortino = np.mean(returns) / (np.std(downside) * np.sqrt(252)) if len(downside) > 0 and np.std(downside) > 0 else np.nan
        # Drawdown
        equity_curve = df['equity']
        roll_max = equity_curve.cummax()
        drawdown = (roll_max - equity_curve) / roll_max
        max_drawdown = drawdown.max()
        dd_end = drawdown.idxmax()
        dd_start = (equity_curve[:dd_end]).idxmax() if dd_end > 0 else 0
        dd_duration = dd_end - dd_start
        # Win/loss
        wins = returns[returns > 0]
        losses = returns[returns < 0]
        win_rate = len(wins) / (len(wins) + len(losses)) if (len(wins) + len(losses)) > 0 else np.nan
        avg_win = wins.mean() if len(wins) > 0 else np.nan
        avg_loss = losses.mean() if len(losses) > 0 else np.nan
        n_trades = int(df['trade'].sum())
        turnover = n_trades / len(df)
        # Benchmark
        df['bh_equity'] = self.initial_capital * (1 + df['actual_return']).cumprod()
        bh_total_return = df['bh_equity'].iloc[-1] / self.initial_capital - 1
        metrics = {
            'total_return': total_return,
            'cagr': cagr,
            'sharpe': sharpe,
            'sortino': sortino,
            'max_drawdown': max_drawdown,
            'drawdown_duration': dd_duration,
            'win_rate': win_rate,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'n_trades': n_trades,
            'turnover': turnover,
            'bh_total_return': bh_total_return
        }
        return {'metrics': metrics, 'equity_curve': df[['date', 'equity', 'bh_equity']]}


class PortfolioBacktester:
    """
    Backtester for multi-asset portfolios using predicted probabilities.
    Strategy:
        - Predict direction for N stocks
        - Rank by predicted probability
        - Long top K stocks equally weighted
        - Rebalance weekly
    Computes:
        - Portfolio return, volatility, Sharpe
        - Turnover and cost drag
        - Correlation with SPY benchmark
        - Compares vs equal-weight and cap-weight benchmarks
    Args:
        predictions: DataFrame with columns ['date', 'ticker', 'predicted_prob', 'actual_return']
        K: int, number of stocks to long
        initial_capital: float
        cost: float, transaction cost per trade
        slippage: float, slippage per trade
        spy_returns: DataFrame with ['date', 'return'] for SPY benchmark
        cap_weights: dict {ticker: market_cap}
    """

    def __init__(self, predictions: pd.DataFrame, K: int = 5, initial_capital: float = 10000.0, cost: float = 0.0005, slippage: float = 0.0002, spy_returns: pd.DataFrame = None, cap_weights: dict = None):
        self.df = predictions.copy()
        self.K = K
        self.initial_capital = initial_capital
        self.cost = cost
        self.slippage = slippage
        self.spy_returns = spy_returns
        self.cap_weights = cap_weights

    def run(self):
        df = self.df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values(['date', 'ticker'])
        # Weekly rebalancing
        df['week'] = df['date'].dt.to_period('W').apply(lambda r: r.start_time)
        portfolio = []
        prev_weights = None
        for week, group in df.groupby('week'):
            week_df = group.copy()
            top = week_df.nlargest(self.K, 'predicted_prob')
            tickers = top['ticker'].tolist()
            weights = {t: 1.0/self.K for t in tickers}
            # Calculate returns for this week
            week_returns = week_df.set_index('ticker')['actual_return']
            pnl = sum(weights.get(t, 0) * week_returns.get(t, 0) for t in week_returns.index)
            # Turnover: sum of abs(weight change)
            turnover = sum(abs(weights.get(t,0) - (prev_weights.get(t,0) if prev_weights else 0)) for t in set(weights.keys()).union(prev_weights.keys() if prev_weights else []))
            cost_drag = turnover * self.cost + turnover * self.slippage
            portfolio.append({
                'date': week,
                'portfolio_return': pnl - cost_drag,
                'turnover': turnover,
                'cost_drag': cost_drag
            })
            prev_weights = weights
        pf = pd.DataFrame(portfolio)
        pf['equity'] = self.initial_capital * (1 + pf['portfolio_return']).cumprod()
        # Metrics
        total_return = pf['equity'].iloc[-1] / self.initial_capital - 1
        n_years = (pf['date'].iloc[-1] - pf['date'].iloc[0]).days / 365.25
        cagr = (pf['equity'].iloc[-1] / self.initial_capital) ** (1 / n_years) - 1 if n_years > 0 else np.nan
        returns = pf['portfolio_return']
        sharpe = np.mean(returns) / np.std(returns) * np.sqrt(52) if np.std(returns) > 0 else np.nan
        volatility = np.std(returns) * np.sqrt(52)
        avg_turnover = pf['turnover'].mean()
        avg_cost_drag = pf['cost_drag'].mean()
        # Benchmark: SPY
        if self.spy_returns is not None:
            spy = self.spy_returns.copy()
            spy['date'] = pd.to_datetime(spy['date'])
            spy = spy.set_index('date').reindex(pf['date']).fillna(0)
            spy['equity'] = self.initial_capital * (1 + spy['return']).cumprod()
            correlation = np.corrcoef(pf['portfolio_return'], spy['return'])[0,1]
        else:
            spy = None
            correlation = np.nan
        # Equal-weight benchmark
        eqw_pf = []
        for week, group in df.groupby('week'):
            tickers = group['ticker'].unique()
            weights = {t: 1.0/len(tickers) for t in tickers}
            week_returns = group.set_index('ticker')['actual_return']
            pnl = sum(weights.get(t, 0) * week_returns.get(t, 0) for t in week_returns.index)
            eqw_pf.append({'date': week, 'return': pnl})
        eqw_df = pd.DataFrame(eqw_pf)
        eqw_df['equity'] = self.initial_capital * (1 + eqw_df['return']).cumprod()
        # Cap-weight benchmark
        if self.cap_weights:
            cap_pf = []
            total_cap = sum(self.cap_weights.values())
            for week, group in df.groupby('week'):
                weights = {t: self.cap_weights.get(t,0)/total_cap for t in group['ticker'].unique()}
                week_returns = group.set_index('ticker')['actual_return']
                pnl = sum(weights.get(t, 0) * week_returns.get(t, 0) for t in week_returns.index)
                cap_pf.append({'date': week, 'return': pnl})
            cap_df = pd.DataFrame(cap_pf)
            cap_df['equity'] = self.initial_capital * (1 + cap_df['return']).cumprod()
        else:
            cap_df = None
        metrics = {
            'total_return': total_return,
            'cagr': cagr,
            'sharpe': sharpe,
            'volatility': volatility,
            'avg_turnover': avg_turnover,
            'avg_cost_drag': avg_cost_drag,
            'correlation_with_spy': correlation
        }
        return {
            'metrics': metrics,
            'equity_curve': pf[['date', 'equity']],
            'equal_weight_curve': eqw_df[['date', 'equity']],
            'cap_weight_curve': cap_df[['date', 'equity']] if cap_df is not None else None,
            'spy_curve': spy[['equity']] if spy is not None else None
        }


def plot_backtest_results(backtest_results: dict, predictions: pd.DataFrame, recession_periods: list = None):
    """
    Plot 4-panel backtest results: equity curve, drawdown, predicted probabilities, monthly returns heatmap.
    Args:
        backtest_results: dict from Backtester.run()
        predictions: DataFrame with ['date', 'predicted_prob', 'actual_return']
        recession_periods: list of (start, end) tuples for vertical lines (optional)
    """
    sns.set(style='whitegrid')
    df_eq = backtest_results['equity_curve']
    metrics = backtest_results['metrics']
    df = predictions.copy()
    df['date'] = pd.to_datetime(df['date'])
    df_eq['date'] = pd.to_datetime(df_eq['date'])
    # Panel 1: Equity curve
    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    axes = axes.flatten()
    axes[0].plot(df_eq['date'], df_eq['equity'], label='Strategy', color='blue')
    axes[0].plot(df_eq['date'], df_eq['bh_equity'], label='Buy & Hold', color='gray', linestyle='--')
    axes[0].set_title('Equity Curve')
    axes[0].set_ylabel('Portfolio Value ($)')
    axes[0].legend()
    # Recession lines
    if recession_periods:
        for start, end in recession_periods:
            axes[0].axvspan(pd.to_datetime(start), pd.to_datetime(end), color='red', alpha=0.2)
    # Panel 2: Drawdown
    roll_max = df_eq['equity'].cummax()
    drawdown = (roll_max - df_eq['equity']) / roll_max
    axes[1].plot(df_eq['date'], drawdown, color='orange')
    axes[1].set_title('Drawdown Over Time')
    axes[1].set_ylabel('Drawdown (%)')
    # Annotate max drawdown
    max_dd_idx = drawdown.idxmax()
    axes[1].annotate(f"Max DD: {drawdown[max_dd_idx]:.2%}",
                     xy=(df_eq['date'][max_dd_idx], drawdown[max_dd_idx]),
                     xytext=(df_eq['date'][max_dd_idx], drawdown[max_dd_idx]+0.05),
                     arrowprops=dict(facecolor='red', shrink=0.05), color='red')
    # Panel 3: Predicted probabilities
    axes[2].plot(df['date'], df['predicted_prob'], color='purple', label='Predicted P(up)')
    up_days = df[df['actual_return'] > 0]
    down_days = df[df['actual_return'] <= 0]
    axes[2].scatter(up_days['date'], up_days['predicted_prob'], color='green', marker='^', label='Actual Up', alpha=0.5)
    axes[2].scatter(down_days['date'], down_days['predicted_prob'], color='red', marker='v', label='Actual Down', alpha=0.5)
    axes[2].set_title('Predicted Probabilities & Actual Direction')
    axes[2].set_ylabel('P(up)')
    axes[2].legend()
    # Panel 4: Monthly returns heatmap
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    df['strategy_return'] = backtest_results['equity_curve']['equity'].pct_change().fillna(0)
    monthly = df.groupby(['year', 'month'])['strategy_return'].sum().unstack()
    sns.heatmap(monthly, ax=axes[3], cmap='RdYlGn', annot=True, fmt='.2%', cbar=True)
    axes[3].set_title('Monthly Returns Heatmap')
    axes[3].set_xlabel('Month')
    axes[3].set_ylabel('Year')
    axes[3].set_xticklabels([calendar.month_abbr[m] for m in monthly.columns])
    # Metrics table
    metrics_text = '\n'.join([f"{k}: {v:.4f}" for k, v in metrics.items()])
    fig.text(0.75, 0.15, metrics_text, bbox=dict(facecolor='white', alpha=0.8), fontsize=12)
    plt.tight_layout(rect=[0, 0, 0.75, 1])
    os.makedirs('outputs', exist_ok=True)
    plt.savefig('outputs/backtest_results.png', dpi=200)
    plt.show()
