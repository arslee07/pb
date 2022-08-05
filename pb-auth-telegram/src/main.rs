use std::error::Error;
use teloxide::{
    dispatching::UpdateFilterExt, payloads::SendMessageSetters, prelude::*, types::ParseMode,
    utils::html,
};

use jsonwebtoken::{encode, EncodingKey, Header};
use serde::Serialize;

#[derive(Debug, Serialize)]
struct Claims {
    user_id: i64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Sync + Send>> {
    let secret = std::env::var("JWT_SECRET")?;
    let token = std::env::var("BOT_TOKEN")?;

    let bot = Bot::new(token).auto_send();

    let handler = Update::filter_message().endpoint(
        |msg: Message, bot: AutoSend<Bot>, secret: String| async move {
            let token = encode(
                &Header::default(),
                &Claims {
                    user_id: msg.chat.id.0,
                },
                &EncodingKey::from_secret(secret.as_bytes()),
            )
            .unwrap();

            bot.send_message(msg.chat.id, html::code_block(&token))
                .parse_mode(ParseMode::Html)
                .await?;

            respond(())
        },
    );

    Dispatcher::builder(bot, handler)
        .dependencies(dptree::deps![secret])
        .enable_ctrlc_handler()
        .build()
        .dispatch()
        .await;

    Ok(())
}
