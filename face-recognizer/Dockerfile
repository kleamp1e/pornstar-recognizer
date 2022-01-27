FROM ubuntu:20.04
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --yes --no-install-recommends \
    build-essential \
    ca-certificates \
    python3-dev \
    python3-pip \
    python3-setuptools \
  && rm --recursive --force /var/lib/apt/lists/*
RUN python3 -m pip install --upgrade pip setuptools
COPY requirements.txt ./
RUN python3 -m pip install --requirement requirements.txt
COPY src/ ./src/
CMD ["uvicorn", "--host=0.0.0.0", "--app-dir=src", "main:app"]
