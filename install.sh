sudo apt-get update && sudo apt-get install -y \
    python3.8 \
    python3.8-dev \
    python3-pip \
    python3.8-venv\
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg

sudo rm -rf /var/lib/apt/lists/*

# Thiết lập Python 3.8 làm mặc định
sudo ln -sf /usr/bin/python3.8 /usr/bin/python3

cd ~/AutoVideo # Điều chỉnh đúng đường dẫn của bạn

pip install --no-cache-dir -r requirements.txt

cd ~/AutoVideo/autovideo 

pip install --no-cache-dir -e .


pip list | grep torch