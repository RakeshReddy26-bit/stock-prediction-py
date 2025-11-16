#!/bin/zsh
# Fix XGBoost OpenMP error on Mac and run pipeline

# Install libomp if not already installed
brew install libomp

# Find libomp.dylib location and set DYLD_LIBRARY_PATH
if [ -f /opt/homebrew/lib/libomp.dylib ]; then
  export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
elif [ -f /usr/local/lib/libomp.dylib ]; then
  export DYLD_LIBRARY_PATH="/usr/local/lib:$DYLD_LIBRARY_PATH"
else
  echo "libomp.dylib not found! Please check your Homebrew installation."
  exit 1
fi

# Reinstall xgboost to ensure it links to the correct libomp
pip uninstall -y xgboost
pip install xgboost

# Run your pipeline (update arguments as needed)
PYTHONPATH=src python -m src.pipeline --ticker AAPL --model xgboost
