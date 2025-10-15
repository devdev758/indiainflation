# syntax=docker/dockerfile:1

FROM postgres:16

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl unzip && \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip && \
    apt-get purge -y curl unzip && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /scripts

ENTRYPOINT ["/bin/bash"]
