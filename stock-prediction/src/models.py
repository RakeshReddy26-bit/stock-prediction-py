"""
models.py
Time-series cross-validation utilities and model definitions.

WalkForwardSplitter implements expanding-window time-series CV. We never shuffle time-series data because shuffling destroys temporal dependencies and introduces lookahead bias, leading to unrealistic performance estimates in financial modeling.
"""

from typing import Iterator, Tuple
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torch.utils.tensorboard import SummaryWriter
from sklearn.metrics import roc_auc_score, accuracy_score
import os

class BaselineModels:
    """
    Baseline classifiers for next-day return direction.
    """
    def __init__(self):
        self.lr = LogisticRegression()
        self.xgb = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')

    def fit(self, X: pd.DataFrame, y: pd.Series):
        self.lr.fit(X, y)
        self.xgb.fit(X, y)

    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        return self.lr.predict(X), self.xgb.predict(X)

class LSTMModel(nn.Module):
    """
    PyTorch LSTM for sequence modeling of financial features.
    """
    def __init__(self, input_dim: int):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, 32, batch_first=True)
        self.fc = nn.Linear(32, 1)
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return torch.sigmoid(out)

class LSTMPredictor(nn.Module):
    """
    LSTM-based predictor for time-series classification or regression.
    Args:
        n_features: number of input features
        hidden_size: hidden units for first LSTM layer
        num_layers: number of LSTM layers (fixed at 2)
        dropout: dropout rate
        task: 'classification' or 'regression'
    """
    def __init__(self, n_features: int, hidden_size: int = 128, num_layers: int = 2, dropout: float = 0.2, task: str = 'classification'):
        super().__init__()
        self.task = task
        self.lstm1 = nn.LSTM(input_size=n_features, hidden_size=hidden_size, batch_first=True)
        self.dropout1 = nn.Dropout(dropout)
        self.lstm2 = nn.LSTM(input_size=hidden_size, hidden_size=64, batch_first=True)
        self.dropout2 = nn.Dropout(dropout)
        self.fc1 = nn.Linear(64, 32)
        self.fc2 = nn.Linear(32, 1)
        self.relu = nn.ReLU()
        self._init_weights()
    def _init_weights(self):
        for name, param in self.lstm1.named_parameters():
            if 'weight_ih' in name:
                nn.init.orthogonal_(param)
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param)
            elif 'bias' in name:
                nn.init.zeros_(param)
        for name, param in self.lstm2.named_parameters():
            if 'weight_ih' in name:
                nn.init.orthogonal_(param)
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param)
            elif 'bias' in name:
                nn.init.zeros_(param)
        nn.init.xavier_uniform_(self.fc1.weight)
        nn.init.zeros_(self.fc1.bias)
        nn.init.xavier_uniform_(self.fc2.weight)
        nn.init.zeros_(self.fc2.bias)
    def forward(self, x):
        out, _ = self.lstm1(x)
        out = self.dropout1(out)
        out, _ = self.lstm2(out)
        out = self.dropout2(out)
        out = out[:, -1, :]  # last time step
        out = self.relu(self.fc1(out))
        out = self.fc2(out)
        if self.task == 'classification':
            return torch.sigmoid(out)
        else:
            return out
    def predict_proba(self, x):
        self.eval()
        with torch.no_grad():
            out = self.forward(x)
            if self.task == 'classification':
                return out
            else:
                return None

class SequenceDataset(Dataset):
    """
    Prepares sliding windows for LSTM models.
    Args:
        features: np.ndarray of shape (n_samples, n_features)
        targets: np.ndarray of shape (n_samples,)
        sequence_length: number of days in each input sequence
        scaler: fitted StandardScaler (use training set only)
        augment: if True, inject random noise (±1% std)
    """
    def __init__(self, features: np.ndarray, targets: np.ndarray, sequence_length: int, scaler: StandardScaler, augment: bool = False):
        self.features = scaler.transform(features)
        self.targets = targets
        self.sequence_length = sequence_length
        self.augment = augment
        self.n_samples = len(features)
    def __len__(self):
        return self.n_samples - self.sequence_length
    def __getitem__(self, idx):
        X_seq = self.features[idx:idx+self.sequence_length]
        y_target = self.targets[idx+self.sequence_length]
        # Padding if sequence is shorter than sequence_length
        if X_seq.shape[0] < self.sequence_length:
            pad = np.zeros((self.sequence_length - X_seq.shape[0], X_seq.shape[1]))
            X_seq = np.vstack([pad, X_seq])
        if self.augment:
            noise = np.random.normal(0, 0.01, X_seq.shape)
            X_seq = X_seq + noise
        X_seq = torch.tensor(X_seq, dtype=torch.float32)
        y_target = torch.tensor(y_target, dtype=torch.float32)
        return X_seq, y_target

class WalkForwardSplitter:
    """
    Time-series cross-validation with expanding window.
    Args:
        train_size: Initial training window size (days)
        val_size: Validation window size (days)
        test_size: Test window size (days)
        step_size: Step size to roll forward (days)
        expanding: If True, training set grows over time
    Methods:
        split(X, y): yields (train_idx, val_idx, test_idx) for each fold
        plot_splits(n_splits): visualizes the splits
    """
    def __init__(self, train_size: int = 252, val_size: int = 63, test_size: int = 21, step_size: int = 21, expanding: bool = True):
        self.train_size = train_size
        self.val_size = val_size
        self.test_size = test_size
        self.step_size = step_size
        self.expanding = expanding

    def split(self, X, y) -> Iterator[Tuple[np.ndarray, np.ndarray, np.ndarray]]:
        n_samples = len(X)
        start = 0
        while True:
            train_end = start + self.train_size if not self.expanding else start + self.train_size
            val_start = train_end
            val_end = val_start + self.val_size
            test_start = val_end
            test_end = test_start + self.test_size
            if test_end > n_samples:
                break
            train_idx = np.arange(0, train_end) if self.expanding else np.arange(start, train_end)
            val_idx = np.arange(val_start, val_end)
            test_idx = np.arange(test_start, test_end)
            yield train_idx, val_idx, test_idx
            start += self.step_size

    def plot_splits(self, n_splits: int = 5):
        total = self.train_size + self.val_size + self.test_size + n_splits * self.step_size
        mask = np.zeros((n_splits, total))
        for i in range(n_splits):
            train_end = self.train_size + i * self.step_size if self.expanding else self.train_size
            val_start = train_end
            val_end = val_start + self.val_size
            test_start = val_end
            test_end = test_start + self.test_size
            mask[i, :train_end] = 1  # train
            mask[i, val_start:val_end] = 2  # val
            mask[i, test_start:test_end] = 3  # test
        plt.figure(figsize=(12, 2 + n_splits * 0.5))
        plt.imshow(mask, aspect='auto', cmap='Set1', interpolation='none')
        plt.xlabel('Time Index')
        plt.ylabel('CV Fold')
        plt.title('Walk-Forward Time-Series CV Splits')
        plt.colorbar(ticks=[0, 1, 2, 3], label='Split')
        plt.show()

def compare_baselines(X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
    """
    Train and compare baseline classifiers using walk-forward CV.
    Returns DataFrame with mean ± std metrics for each model.
    """
    splitter = WalkForwardSplitter()
    models = {
        'LogisticRegression': LogisticRegression(penalty='l2', solver='lbfgs', max_iter=1000),
        'RandomForest': RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
        'XGBoost': xgb.XGBClassifier(n_estimators=100, use_label_encoder=False, eval_metric='logloss', random_state=42),
        'SVM': SVC(kernel='rbf', probability=True, random_state=42)
    }
    metrics = {m: {'accuracy': [], 'precision': [], 'recall': [], 'f1': [], 'auc': []} for m in models}
    importances = {'RandomForest': [], 'XGBoost': []}
    for fold, (train_idx, val_idx, test_idx) in enumerate(splitter.split(X, y)):
        X_train, X_val, X_test = X.iloc[train_idx], X.iloc[val_idx], X.iloc[test_idx]
        y_train, y_val, y_test = y.iloc[train_idx], y.iloc[val_idx], y.iloc[test_idx]
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled = scaler.transform(X_val)
        X_test_scaled = scaler.transform(X_test)
        for name, model in models.items():
            if name in ['LogisticRegression', 'SVM']:
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                y_proba = model.predict_proba(X_test_scaled)[:, 1]
            elif name == 'XGBoost':
                model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=10, verbose=False)
                y_pred = model.predict(X_test)
                y_proba = model.predict_proba(X_test)[:, 1]
                importances['XGBoost'].append(model.feature_importances_)
            elif name == 'RandomForest':
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                y_proba = model.predict_proba(X_test)[:, 1]
                importances['RandomForest'].append(model.feature_importances_)
            metrics[name]['accuracy'].append(accuracy_score(y_test, y_pred))
            metrics[name]['precision'].append(precision_score(y_test, y_pred, zero_division=0))
            metrics[name]['recall'].append(recall_score(y_test, y_pred, zero_division=0))
            metrics[name]['f1'].append(f1_score(y_test, y_pred, zero_division=0))
            metrics[name]['auc'].append(roc_auc_score(y_test, y_proba))
    # Aggregate metrics
    rows = []
    for name in models:
        row = {
            'accuracy_mean': np.mean(metrics[name]['accuracy']),
            'accuracy_std': np.std(metrics[name]['accuracy']),
            'auc_mean': np.mean(metrics[name]['auc']),
            'auc_std': np.std(metrics[name]['auc']),
            'f1_mean': np.mean(metrics[name]['f1']),
            'f1_std': np.std(metrics[name]['f1'])
        }
        rows.append(row)
    results = pd.DataFrame(rows, index=list(models.keys()))
    # Feature importance plots
    for tree_name in ['RandomForest', 'XGBoost']:
        if importances[tree_name]:
            mean_importance = np.mean(importances[tree_name], axis=0)
            plt.figure(figsize=(8, 4))
            plt.bar(X.columns, mean_importance)
            plt.title(f'{tree_name} Feature Importances')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.show()
    return results

def train_lstm(model, train_loader, val_loader, config: dict) -> dict:
    """
    Train LSTM model with early stopping, LR scheduler, gradient clipping, and tensorboard logging.
    Args:
        model: LSTMPredictor instance
        train_loader: DataLoader for training
        val_loader: DataLoader for validation
        config: dict with training parameters
    Returns:
        Dict with best epoch, val_auc, histories, and model path
    """
    device = config.get('device', 'cpu')
    model = model.to(device)
    optimizer = Adam(model.parameters(), lr=config.get('lr', 0.001))
    if model.task == 'classification':
        criterion = torch.nn.BCELoss()
    else:
        criterion = torch.nn.MSELoss()
    scheduler = ReduceLROnPlateau(optimizer, factor=0.5, patience=5, verbose=True)
    patience = config.get('patience', 10)
    max_epochs = config.get('max_epochs', 100)
    model_path = config.get('model_path', 'best_lstm.pt')
    writer = SummaryWriter(log_dir=config.get('tensorboard_dir', './runs'))
    best_val_auc = -np.inf
    best_epoch = 0
    train_history, val_history = [], []
    epochs_no_improve = 0
    for epoch in range(max_epochs):
        model.train()
        train_losses = []
        for X, y in train_loader:
            X, y = X.to(device), y.to(device)
            optimizer.zero_grad()
            out = model(X)
            loss = criterion(out.squeeze(), y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_losses.append(loss.item())
        train_loss = np.mean(train_losses)
        # Validation
        model.eval()
        val_losses, val_targets, val_preds = [], [], []
        with torch.no_grad():
            for X, y in val_loader:
                X, y = X.to(device), y.to(device)
                out = model(X)
                loss = criterion(out.squeeze(), y)
                val_losses.append(loss.item())
                val_targets.extend(y.cpu().numpy())
                val_preds.extend(out.squeeze().cpu().numpy())
        val_loss = np.mean(val_losses)
        if model.task == 'classification':
            val_preds_bin = (np.array(val_preds) > 0.5).astype(int)
            val_accuracy = accuracy_score(val_targets, val_preds_bin)
            val_auc = roc_auc_score(val_targets, val_preds)
        else:
            val_accuracy = None
            val_auc = -val_loss
        train_history.append(train_loss)
        val_history.append(val_loss)
        writer.add_scalar('Loss/train', train_loss, epoch)
        writer.add_scalar('Loss/val', val_loss, epoch)
        if val_accuracy is not None:
            writer.add_scalar('Accuracy/val', val_accuracy, epoch)
        writer.add_scalar('AUC/val', val_auc, epoch)
        scheduler.step(val_loss)
        # Early stopping
        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_epoch = epoch
            torch.save(model.state_dict(), model_path)
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
        if epochs_no_improve >= patience:
            print(f"Early stopping at epoch {epoch+1}")
            break
        print(f"Epoch {epoch+1}: train_loss={train_loss:.4f}, val_loss={val_loss:.4f}, val_auc={val_auc:.4f}")
    writer.close()
    # Plot training curves
    plt.figure(figsize=(10,4))
    plt.plot(train_history, label='Train Loss')
    plt.plot(val_history, label='Val Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.title('Training Curves')
    plt.show()
    return {
        'best_epoch': best_epoch,
        'best_val_auc': best_val_auc,
        'train_history': train_history,
        'val_history': val_history,
        'model_path': model_path
    }
