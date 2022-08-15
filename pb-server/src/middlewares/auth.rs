use std::sync::Arc;

use axum::{http::Request, middleware::Next, response::IntoResponse};

use crate::{models::Error, AppState};

pub async fn allow_authenticated_only<B>(req: Request<B>, next: Next<B>) -> impl IntoResponse {
    // get token from request extension
    let service = req
        .extensions()
        .get::<Arc<AppState>>()
        .unwrap()
        .users_service
        .clone();

    // extract token from header or fail if empty or invalid
    let token = req
        .headers()
        .get("X-Token")
        .and_then(|t| t.to_str().ok())
        .ok_or(Error::Unauthenticated)?;

    // verify token
    if service.get_user_from_token(token.to_string()).is_ok() {
        Ok(next.run(req).await)
    } else {
        Err(Error::Unauthenticated)
    }
}
