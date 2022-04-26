pub mod pixels;

pub async fn root() -> crate::RouteResult<String, String> {
    Ok((axum::http::StatusCode::OK, "It works!".to_string()))
}
