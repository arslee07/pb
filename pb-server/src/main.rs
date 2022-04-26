pub mod routes;
pub mod services;
pub mod utils;

use axum::{
    http::StatusCode,
    routing::{get, put},
    Extension, Router,
};
use std::{net::SocketAddr, sync::Arc};
use tokio::{
    sync::broadcast,
    task,
    time::{interval, Duration},
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utils::compress_canvas;

use services::CanvasService;

pub type RouteResult<T, E> = Result<(StatusCode, T), (StatusCode, E)>;
pub type Canvas = Vec<u8>;
pub struct AppState {
    pub canvas_service: CanvasService,
    pub redis_client: redis::Client,
    pub canvas_stream: broadcast::Sender<Canvas>,
}

#[derive(serde::Deserialize)]
pub struct PutPixelData {
    pub position: i64,
    pub color: i32,
}

async fn canvas_stream_worker(service: CanvasService, tx: broadcast::Sender<Canvas>) {
    let mut int = interval(Duration::from_secs(1));
    loop {
        let res = service.get_canvas().await;
        if res.is_err() {
            return;
        }
        tx.send(compress_canvas(res.unwrap())).unwrap();
        int.tick().await;
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "pb-server=trace".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let redis_client = redis::Client::open("redis://localhost:6379")?;
    let canvas_service = CanvasService::new(redis_client.clone());
    let (tx, _rx) = broadcast::channel(2048);

    task::spawn(canvas_stream_worker(canvas_service.clone(), tx.clone()));

    let state = Arc::new(AppState {
        canvas_service: canvas_service.clone(),
        redis_client,
        canvas_stream: tx,
    });

    let app = Router::new()
        .route("/", get(routes::root))
        .route("/pixels", get(routes::pixels::get_canvas))
        .route("/pixels", put(routes::pixels::put_pixel))
        .route("/pixels/stream", get(routes::pixels::stream_canvas))
        .layer(TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_headers(tower_http::cors::Any)
                .allow_methods(tower_http::cors::Any)
                .allow_origin(tower_http::cors::Any),
        )
        .layer(Extension(state));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::debug!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}
