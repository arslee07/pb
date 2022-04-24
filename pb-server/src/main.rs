use axum::{
    extract::Extension,
    http::StatusCode,
    routing::{get, put},
    Json, Router,
};
use std::{io::Write, net::SocketAddr, sync::Arc};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

type RouteResult<T, E> = Result<(StatusCode, T), (StatusCode, E)>;

pub struct AppState {
    redis_client: Arc<redis::Client>,
}

#[derive(serde::Deserialize)]
pub struct PutPixelData {
    pub position: i64,
    pub color: i32,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let client = redis::Client::open("redis://localhost:6379")?;

    let state = Arc::new(AppState {
        redis_client: Arc::new(client),
    });

    let app = Router::new()
        .route("/", get(root))
        .route("/pixels", get(get_canvas))
        .route("/pixels", put(put_pixel))
        .layer(TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_headers(tower_http::cors::Any)
                .allow_methods(tower_http::cors::Any)
                .allow_origin(tower_http::cors::Any),
        )
        .layer(Extension(state));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
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

async fn get_canvas(Extension(state): Extension<Arc<AppState>>) -> RouteResult<Vec<u8>, String> {
    let mut encoder = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::default());

    let canvas = match canvas_service::get_canvas(&state.redis_client).await {
        Ok(res) => res,
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Get canvas error".to_string(),
            ))
        }
    };

    encoder.write_all(&canvas).unwrap();

    Ok((StatusCode::OK, encoder.finish().unwrap()))
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
    match canvas_service::put_pixel(&state.redis_client, payload.position, payload.color).await {
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

mod canvas_service {
    pub async fn get_canvas(client: &redis::Client) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        Ok(redis::cmd("GETRANGE")
            .arg("canvas")
            .arg(&[0, -1])
            .query_async(&mut client.get_async_connection().await?)
            .await?)
    }

    pub async fn put_pixel(
        client: &redis::Client,
        pos: i64,
        color: i32,
    ) -> Result<(), Box<dyn std::error::Error>> {
        Ok(redis::cmd("BITFIELD")
            .arg("canvas")
            .arg("SET")
            .arg("u24")
            .arg(pos * 24)
            .arg(color)
            .query_async(&mut client.get_async_connection().await?)
            .await?)
    }
}
