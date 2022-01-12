ARG BASE_IMAGE
FROM ${BASE_IMAGE}
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
ARG COMPUTING_DEVICE
COPY requirements1_${COMPUTING_DEVICE}.txt ./
RUN python3 -m pip install --requirement requirements1_${COMPUTING_DEVICE}.txt
COPY requirements2.txt ./
RUN python3 -m pip install --requirement requirements2.txt
RUN insightface-cli model.download buffalo_l
COPY src/ ./src/
RUN chmod 755 /root
ENV HOME /root
CMD ["uvicorn", "--host=0.0.0.0", "--app-dir=src", "main:app"]
