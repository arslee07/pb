use std::{error::Error, time::Duration};

use redis::AsyncCommands;

#[derive(Clone)]
pub struct CooldownService {
    redis_client: redis::Client,
}

impl CooldownService {
    pub fn new(redis_client: redis::Client) -> Self {
        CooldownService { redis_client }
    }

    pub async fn get_cooldown(&self, id: i64) -> Result<Option<Duration>, Box<dyn Error>> {
        let mut connection = self.redis_client.get_async_connection().await?;
        let left = connection.ttl::<_, i64>(format!("cooldown-{}", id)).await?;
        if left == -2 {
            Ok(None)
        } else {
            Ok(Some(Duration::from_secs(left.try_into().unwrap())))
        }
    }

    pub async fn set_cooldown(&self, id: i64, duration: Duration) -> Result<(), Box<dyn Error>> {
        let mut connection = self.redis_client.get_async_connection().await?;

        redis::pipe()
            .set(format!("cooldown-{}", id), true)
            .expire(
                format!("cooldown-{}", id),
                duration.as_secs().try_into().unwrap(),
            )
            .query_async(&mut connection)
            .await?;

        Ok(())
    }
}
