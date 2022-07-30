FROM rust:latest
WORKDIR /app
COPY . .
RUN cargo install --path .
CMD ["pb-server"]
