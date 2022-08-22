use std::{sync::Arc, time::Duration};

use axum::{http::Request, middleware::Next, response::IntoResponse};

use crate::{
    models::{Error, User},
    AppState,
};

pub async fn cooldown<B>(req: Request<B>, next: Next<B>) -> impl IntoResponse {
    // get a service and a user from request extension
    let service = req
        .extensions()
        .get::<Arc<AppState>>()
        .unwrap()
        .cooldown_service
        .clone();

    let user = req.extensions().get::<User>().unwrap();

    let cd = service
        .get_cooldown(user.id)
        .await
        .map_err(|err| Error::Internal {
            message: Some(err.to_string()),
        })?;

    match cd {
        // if there's a cooldown then throw an error
        Some(left) => Err(Error::Cooldown {
            time_left: left.as_secs(),
        }),
        // else set a new cooldown and process request
        None => {
            service
                .set_cooldown(user.id, Duration::from_secs(30))
                .await
                .map_err(|err| Error::Internal {
                    message: Some(err.to_string()),
                })?;

            Ok(next.run(req).await)
        }
    }
}
