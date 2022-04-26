pub mod services;

use axum::{
    extract::{
        ws::{self, WebSocket},
        Extension, WebSocketUpgrade,
    },
    http::StatusCode,
    routing::{get, put},
    Json, Router,
};
use std::{io::Write, net::SocketAddr, sync::Arc};
use tokio::{
    sync::broadcast,
    task,
    time::{interval, Duration},
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use services::CanvasService;

type RouteResult<T, E> = Result<(StatusCode, T), (StatusCode, E)>;
type Canvas = Vec<u8>;

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

async fn send_canvas(service: &CanvasService, tx: &broadcast::Sender<Canvas>) {
    let res = service.get_canvas().await;
    if res.is_err() {
        return;
    }
    tx.send(compress_canvas(res.unwrap())).unwrap();
}

fn compress_canvas(canvas: Canvas) -> Canvas {
    let mut encoder = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::default());
    encoder.write_all(&canvas).unwrap();
    encoder.finish().unwrap()
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "example_chat=trace".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let redis_client = redis::Client::open("redis://localhost:6379")?;
    let canvas_service = CanvasService::new(redis_client.clone());
    let (tx, _rx) = broadcast::channel(2048);

    let cs = canvas_service.clone();
    let ntx = tx.clone();
    task::spawn(async move {
        let mut int = interval(Duration::from_secs(1));
        loop {
            send_canvas(&cs, &ntx).await;
            int.tick().await;
        }
    });

    let state = Arc::new(AppState {
        canvas_service: canvas_service.clone(),
        redis_client,
        canvas_stream: tx,
    });

    let app = Router::new()
        .route("/", get(root))
        .route("/pixels", get(get_canvas))
        .route("/pixels", put(put_pixel))
        .route("/pixels/stream", get(stream_canvas))
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

async fn root() -> RouteResult<String, String> {
    Ok((StatusCode::OK, "It works!".to_string()))
}

async fn stream_canvas(
    ws: WebSocketUpgrade,
    Extension(state): Extension<Arc<AppState>>,
) -> impl axum::response::IntoResponse {
    ws.on_upgrade(move |s| handle_socket(s, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    let mut st = state.canvas_stream.subscribe();
    while let Ok(c) = st.recv().await {
        if socket.send(ws::Message::Binary(c)).await.is_err() {
            return;
        }
    }
}

async fn get_canvas(Extension(state): Extension<Arc<AppState>>) -> RouteResult<Canvas, String> {
    let canvas = match state.canvas_service.get_canvas().await {
        Ok(res) => res,
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Get canvas error".to_string(),
            ))
        }
    };

    Ok((StatusCode::OK, compress_canvas(canvas)))
}

async fn put_pixel(
    Json(payload): Json<PutPixelData>,
    Extension(state): Extension<Arc<AppState>>,
) -> RouteResult<(), String> {
    // Verify position
    if !(payload.position >= 0 && payload.position < 1_000_000) {
        return Err((
            StatusCode::BAD_REQUEST,
            "Position should be >= 0 and < 10000000".to_string(),
        ));
    }

    // Verify color
    if !(payload.color >= 0x000000 && payload.color <= 0xFFFFFF) {
        return Err((
            StatusCode::BAD_REQUEST,
            "Color should be >= 0x000000 and <= 0xFFFFFF".to_string(),
        ));
    }

    // Put a pixel
    match state
        .canvas_service
        .put_pixel(payload.position, payload.color)
        .await
    {
        Ok(_) => (),
        Err(err) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to put a pixel: ".to_owned() + &err.to_string(),
            ))
        }
    };

    Ok((StatusCode::ACCEPTED, ()))
}
