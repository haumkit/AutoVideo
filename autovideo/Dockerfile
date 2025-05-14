# Sử dụng image Ubuntu 20.04 làm base image
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app/autovideo

RUN apt-get update && apt-get install -y \
    python3.8 python3.8-dev python3-pip git libgl1-mesa-glx libglib2.0-0 \
    && ln -sf /usr/bin/python3.8 /usr/bin/python3 \
    && ln -sf /usr/bin/pip3 /usr/bin/pip \
    && rm -rf /var/lib/apt/lists/*

# Copy toàn bộ mã nguồn
COPY . .

# Cài đặt thư viện
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
RUN pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -e .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "9000", "--reload"]
# ARG BASE_IMAGE=python-base:latest
# FROM $BASE_IMAGE
# ENV DEBIAN_FRONTEND=noninteractive
# WORKDIR /app/autovideo
# COPY . .
# ENV PATH=/root/.local/bin:$PATH
# ENV PYTHONPATH=/app/autovideo
# CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "9000"]