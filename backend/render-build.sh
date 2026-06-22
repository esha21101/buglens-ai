#!/usr/bin/env bash

echo "HELLO_FROM_RENDER_BUILD_SCRIPT"

apt-get update
apt-get install -y tesseract-ocr

pip install -r requirements.txt