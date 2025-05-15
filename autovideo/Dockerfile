# Sử dụng Ubuntu 20.04 làm base image
FROM ubuntu:20.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Python and required system packages
RUN apt-get update && apt-get install -y \
    python3.8 \
    python3.8-dev \
    python3-pip \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.8 as default
RUN ln -sf /usr/bin/python3.8 /usr/bin/python3

WORKDIR /app

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python packages in a single layer
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir pymongo==3.12.3 motor==2.5.1 && \
    pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# Copy the rest of the application
COPY . .

# Install the application in development mode
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -e .

# Expose port
EXPOSE 9000

# Run the server
CMD ["python3", "server.py"]