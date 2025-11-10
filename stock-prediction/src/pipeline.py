"""
pipeline.py
Main experiment pipeline for stock prediction and backtesting.
"""
import os
import json
from datetime import datetime
from .data_loader import load_stock_data
from .features import engineer_features, create_target
from .models import compare_baselines, train_lstm
from .backtester import Backtester


def run_experiment(
    ticker,
    start_date,
    end_date,
    model_type='xgboost',
    save_results=True
):
    """
    Runs full experiment pipeline: data, features, model, backtest, metrics, plots, save results.
    """
    # 1. Load data
    df = load_stock_data(ticker, start_date, end_date)
    # 2. Engineer features
    df_feat = engineer_features(df)
    # 3. Create targets
    df_feat = create_target(df_feat)
    # 4. Split train/test
    split_idx = int(len(df_feat) * 0.8)
    train_df = df_feat.iloc[:split_idx]
    test_df = df_feat.iloc[split_idx:]
    # 5. Model training
    if model_type == 'baseline':
        results = compare_baselines(train_df, test_df)
        preds = results['test_preds']
    elif model_type == 'lstm':
        lstm_model, preds = train_lstm(train_df, test_df)
    else:
        # Default: xgboost, rf, lr
        results = compare_baselines(train_df, test_df, model_type=model_type)
        preds = results['test_preds']
    # 6. Prepare predictions for backtest
    test_df = test_df.copy()
    test_df['predicted_prob'] = preds
    # Use correct target for actual_return
    if 'target_regression' in test_df.columns:
        test_df['actual_return'] = test_df['target_regression']
    elif 'return' in test_df.columns:
        test_df['actual_return'] = test_df['return']
    elif 'future_return' in test_df.columns:
        test_df['actual_return'] = test_df['future_return']
    else:
        raise ValueError('No valid actual return column found in test_df')
    # 7. Run backtest
    backtester = Backtester(test_df)
    backtest_results = backtester.run()
    # 8. Generate plots
    from .backtester import plot_backtest_results
    plot_backtest_results(backtest_results, test_df)
    # 9. Save results
    if save_results:
        out = {
            'metrics': backtest_results['metrics'],
            'ticker': ticker,
            'model_type': model_type,
            'start_date': start_date,
            'end_date': end_date
        }
        out_path = (
            f"outputs/{ticker}_{model_type}_"
            f"{datetime.now().strftime('%Y%m%d')}.json"
        )
        os.makedirs('outputs', exist_ok=True)
        with open(out_path, 'w') as f:
            json.dump(out, f, indent=2)
        print(f"Results saved to {out_path}")
    return backtest_results


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--ticker', default='AAPL')
    parser.add_argument('--start', default='2015-01-01')
    parser.add_argument('--end', default='2024-12-31')
    parser.add_argument('--model', choices=['xgboost', 'rf', 'lr', 'lstm'], default='xgboost')
    args = parser.parse_args()
    run_experiment(
        args.ticker,
        args.start,
        args.end,
        args.model
    )
