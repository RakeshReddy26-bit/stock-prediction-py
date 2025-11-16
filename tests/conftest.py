import sys
import types

# Create package placeholders so imports like `from src.models.lstm_service import ...`
# will find our lightweight test stubs and avoid importing TensorFlow during collection.

def _make_pkg(name):
    if name not in sys.modules:
        m = types.ModuleType(name)
        sys.modules[name] = m
    return sys.modules[name]

# ensure 'src' and 'src.models' packages exist
_make_pkg('src')
_make_pkg('src.models')

# provide a lightweight stub module for src.models.lstm_service
if 'src.models.lstm_service' not in sys.modules:
    lstm = types.ModuleType('src.models.lstm_service')

    def predict_stock_lstm(*args, **kwargs):
        # return a simple predictable shape used by API tests
        return {'predictions': [0.0]}

    def predict_stock_lstm_tuned(*args, **kwargs):
        return {'predictions': [0.0]}

    def train_stock_lstm_tuned(*args, **kwargs):
        return None

    def evaluate_stock_lstm(*args, **kwargs):
        return {'score': 0.0}

    lstm.predict_stock_lstm = predict_stock_lstm
    lstm.predict_stock_lstm_tuned = predict_stock_lstm_tuned
    lstm.train_stock_lstm_tuned = train_stock_lstm_tuned
    lstm.evaluate_stock_lstm = evaluate_stock_lstm

    sys.modules['src.models.lstm_service'] = lstm
