use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "error")]
pub enum Error {
    InvalidColor,
    InvalidPosition { max: i64 },
    Unauthenticated,
    Cooldown { time_left: u64 },
    Internal { message: Option<String> },
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status = match self.to_owned() {
            Error::InvalidColor => StatusCode::BAD_REQUEST,
            Error::InvalidPosition { .. } => StatusCode::BAD_REQUEST,
            Error::Internal { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            Error::Unauthenticated => StatusCode::UNAUTHORIZED,
            Error::Cooldown { .. } => StatusCode::TOO_MANY_REQUESTS,
        };
        let body = Json::from(self);

        (status, body).into_response()
    }
}
