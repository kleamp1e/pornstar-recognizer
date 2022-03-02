FROM ubuntu:20.04
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --yes --no-install-recommends \
    build-essential \
    ca-certificates \
    libopenblas-base \
    libopencv-dev \
    pandoc \
    python3-dev \
    python3-pip \
    python3-setuptools \
  && rm --recursive --force /var/lib/apt/lists/*
RUN python3 -m pip install --upgrade pip setuptools
WORKDIR /opt/app
COPY requirements1.txt ./
RUN python3 -m pip install --requirement requirements1.txt
COPY requirements2.txt ./
RUN python3 -m pip install --requirement requirements2.txt

# MEMO: http://storage.insightface.ai/ にアクセスできないため、一時的にダウンロード済みのモデルファイルを使用する。
# RUN insightface-cli model.download buffalo_l
COPY buffalo_l.zip /root/.insightface/models/buffalo_l.zip
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --yes --no-install-recommends \
    unzip \
  && rm --recursive --force /var/lib/apt/lists/* \
  && cd /root/.insightface/models/ \
  && unzip -d buffalo_l buffalo_l.zip

COPY src/ ./src/
COPY db/ ./db/
ENV DB_DIR /opt/app/db
RUN chmod 755 /root
ENV HOME /root
CMD ["uvicorn", "--host=0.0.0.0", "--app-dir=src", "main:app"]
