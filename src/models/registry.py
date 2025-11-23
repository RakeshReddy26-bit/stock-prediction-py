"""Simple file-based model registry.

Writes a registry manifest (JSON list) to `models/registry.json` and also
writes a per-model manifest file next to the model artifact for quick lookup.

Functions:
- `register_model(model_path: str, metadata: dict, registry_path: str|None = None)`
- `list_models(registry_path: str|None = None)`
"""
from __future__ import annotations

import datetime
import json
import os
from typing import Any, Dict, List


DEFAULT_REGISTRY_PATH = os.path.join('models', 'registry.json')


def _ensure_dir(path: str) -> None:
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)


def register_model(model_path: str, metadata: Dict[str, Any], registry_path: str | None = None) -> str:
    """Register a trained model.

    - `model_path`: path to the saved model artifact (joblib, keras, etc.)
    - `metadata`: arbitrary dict containing training metadata (params, scores, etc.)
    - `registry_path`: optional override location for the registry manifest

    Returns the path to the registry file written.
    """
    registry_path = registry_path or DEFAULT_REGISTRY_PATH
    _ensure_dir(registry_path)

    entry = {
        'model_path': str(model_path),
        'metadata': metadata,
        'registered_at': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    }

    # load existing registry
    records: List[Dict[str, Any]] = []
    if os.path.exists(registry_path):
        try:
            with open(registry_path, 'r') as fh:
                records = json.load(fh)
        except Exception:
            records = []

    records.append(entry)

    with open(registry_path, 'w') as fh:
        json.dump(records, fh, indent=2)

    # write per-model manifest next to model artifact
    try:
        model_dir = os.path.dirname(model_path) or '.'
        base = os.path.basename(model_path)
        name, _ = os.path.splitext(base)
        manifest_path = os.path.join(model_dir, f'{name}.manifest.json')
        with open(manifest_path, 'w') as fh:
            json.dump(entry, fh, indent=2)
    except Exception:
        # best-effort; don't fail registration if per-model manifest can't be written
        pass

    return registry_path


def list_models(registry_path: str | None = None):
    registry_path = registry_path or DEFAULT_REGISTRY_PATH
    if not os.path.exists(registry_path):
        return []
    try:
        with open(registry_path, 'r') as fh:
            return json.load(fh)
    except Exception:
        return []
