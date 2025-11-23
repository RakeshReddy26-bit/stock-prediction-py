"""Model evaluation and reporting utilities.

Provides functions to compute common classification metrics and save a JSON
report under `reports/` for later inspection.
"""
from __future__ import annotations

import json
import os
from typing import Dict, Iterable, Optional

import numpy as np


def classification_metrics(y_true: Iterable[int], y_pred: Iterable[int], y_proba: Optional[Iterable[Iterable[float]]] = None) -> Dict:
    """Compute basic classification metrics. Imports sklearn metrics lazily.

Returns a dict with accuracy, precision, recall, f1, and optionally roc_auc.
"""
    try:
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
    except Exception as e:
        raise ImportError('scikit-learn is required to compute metrics') from e

    y_true = np.asarray(list(y_true))
    y_pred = np.asarray(list(y_pred))
    metrics = {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'precision': float(precision_score(y_true, y_pred, zero_division=0)),
        'recall': float(recall_score(y_true, y_pred, zero_division=0)),
        'f1': float(f1_score(y_true, y_pred, zero_division=0)),
    }

    if y_proba is not None:
        # expect probabilities for positive class or two-column probs
        probs = np.asarray(list(y_proba))
        if probs.ndim == 2 and probs.shape[1] == 2:
            pos = probs[:, 1]
        else:
            pos = probs.ravel()
        try:
            metrics['roc_auc'] = float(roc_auc_score(y_true, pos))
        except Exception:
            metrics['roc_auc'] = None

    return metrics


def save_report(report: Dict, path: str) -> None:
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    with open(path, 'w') as fh:
        json.dump(report, fh, indent=2)
