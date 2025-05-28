#!/bin/bash

# Set PYTHONPATH to include the server directory
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Install/upgrade dependencies
pip install -r requirements.txt

# Start the server
echo "Starting Wirebit Exchange Backend API..."
python main.py 