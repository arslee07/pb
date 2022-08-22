use std::{sync::Arc, time::Duration};

use axum::{http::Request, middleware::Next, response::IntoResponse};

use crate::{
    models::{Error, User},
    AppState,
};

pub async fn cooldown<B>(req: Request<B>, next: Next<B>) -> impl IntoResponse {
    let ext = req.extensions();
    let user = ext.get::<User>().unwrap();
    let state = ext.get::<Arc<AppState>>().unwrap();
    let service = state.cooldown_service.clone();
    let config = state.config.clone();

    // skip all the stuff if there's no cooldown
    // to prevent unwanted overhead
    if config.cooldown_duration == 0 {
        return Ok(next.run(req).await);
    }

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
                .set_cooldown(user.id, Duration::from_secs(config.cooldown_duration))
                .await
                .map_err(|err| Error::Internal {
                    message: Some(err.to_string()),
                })?;

            Ok(next.run(req).await)
        }
    }
}
