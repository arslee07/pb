use std::sync::Arc;

use axum::{
    extract::{ws, WebSocketUpgrade},
    http::StatusCode,
    Extension, Json,
};

use crate::{
    models::Error, utils::compress_canvas, AppState, Canvas, PutPixelData, RouteResult,
    StreamPixelData,
};

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

pub async fn get_canvas(Extension(state): Extension<Arc<AppState>>) -> RouteResult<Canvas> {
    let canvas = state
        .canvas_service
        .get_canvas()
        .await
        .map_err(|err| Error::Internal {
            message: Some(err.to_string()),
        })?;

    Ok((StatusCode::OK, compress_canvas(canvas)))
}

pub async fn put_pixel(
    Json(payload): Json<PutPixelData>,
    Extension(state): Extension<Arc<AppState>>,
) -> RouteResult<()> {
    // Verify position
    if !(payload.position >= 0 && payload.position < 1_000_000) {
        return Err(Error::InvalidPosition { max: 1_000_000 });
    }

    // Verify color
    if !(payload.color >= 0x000000 && payload.color <= 0xFFFFFF) {
        return Err(Error::InvalidColor);
    }

    // Put a pixel
    state
        .canvas_service
        .put_pixel(payload.position, payload.color)
        .await
        .map_err(|err| Error::Internal {
            message: Some(err.to_string()),
        })?;

    state
        .canvas_stream
        .send(StreamPixelData {
            position: payload.position,
            color: payload.color,
        })
        .unwrap();

    Ok((StatusCode::ACCEPTED, ()))
}
