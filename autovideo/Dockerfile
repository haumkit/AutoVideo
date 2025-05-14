# Sử dụng Ubuntu 20.04 làm base image
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app/autovideo

# Cài đặt Python và các dependencies cần thiết
RUN apt-get update && apt-get install -y \
    python3.8 python3.8-dev python3-pip git libgl1-mesa-glx libglib2.0-0 ffmpeg \
    && ln -sf /usr/bin/python3.8 /usr/bin/python3 \
    && ln -sf /usr/bin/pip3 /usr/bin/pip \
    && rm -rf /var/lib/apt/lists/*

# Copy toàn bộ mã nguồn
COPY . .

# Cài đặt thư viện
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
RUN pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -e .

# Expose port
EXPOSE 9000

# Run the server
CMD ["python3", "server.py"]