use std::sync::Arc;

use axum::{
    extract::{ws, WebSocketUpgrade},
    http::StatusCode,
    Extension, Json,
};

use crate::{utils::compress_canvas, AppState, Canvas, PutPixelData, RouteResult, StreamPixelData};

pub async fn stream_canvas(
    ws: WebSocketUpgrade,
    Extension(state): Extension<Arc<AppState>>,
) -> impl axum::response::IntoResponse {
    ws.on_upgrade(|mut socket| async move {
        let mut st = state.canvas_stream.subscribe();
        while let Ok(c) = st.recv().await {
            if socket
                .send(ws::Message::Text(serde_json::to_string(&c).unwrap()))
                .await
                .is_err()
            {
                return;
            }
        }
    })
}

pub async fn get_canvas(Extension(state): Extension<Arc<AppState>>) -> RouteResult<Canvas, String> {
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

pub async fn put_pixel(
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

    state
        .canvas_stream
        .send(StreamPixelData {
            position: payload.position,
            color: payload.color,
        })
        .unwrap();

    Ok((StatusCode::ACCEPTED, ()))
}
