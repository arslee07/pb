use std::error::Error;

use redis::AsyncCommands;

#[derive(Clone)]
pub struct CanvasService {
    redis_client: redis::Client,
}

impl CanvasService {
    pub fn new(redis_client: redis::Client) -> Self {
        CanvasService { redis_client }
    }

    pub async fn init(&self) -> Result<(), Box<dyn Error>> {
        let mut connection = self.redis_client.get_async_connection().await?;

        if !connection.get("initialized").await? {
            let mut query = redis::pipe();
            for i in 0..1_000_000 {
                query.add_command(
                    redis::cmd("BITFIELD")
                        .arg("canvas")
                        .arg("SET")
                        .arg("u24")
                        .arg(format!("#{}", i))
                        .arg(0xFFFFFF)
                        .to_owned(),
                );
            }
            query.query_async(&mut connection).await?;

            connection.set("initialized", true).await?;
        }

        Ok(())
    }

    pub async fn get_canvas(&self) -> Result<Vec<u8>, Box<dyn Error + Sync + Send>> {
        Ok(redis::cmd("GETRANGE")
            .arg("canvas")
            .arg(&[0, -1])
            .query_async(&mut self.redis_client.get_async_connection().await?)
            .await?)
    }

    pub async fn put_pixel(&self, pos: i64, color: i32) -> Result<(), Box<dyn Error>> {
        Ok(redis::cmd("BITFIELD")
            .arg("canvas")
            .arg("SET")
            .arg("u24")
            .arg(pos * 24)
            .arg(color)
            .query_async(&mut self.redis_client.get_async_connection().await?)
            .await?)
    }

    pub async fn get_pixel(&self, pos: i64) -> Result<i32, Box<dyn Error>> {
        Ok(redis::cmd("BITFIELD")
            .arg("canvas")
            .arg("GET")
            .arg("u24")
            .arg(pos * 24)
            .query_async(&mut self.redis_client.get_async_connection().await?)
            .await?)
    }
}
