fn _to_num(x: &[u8]) -> u32 {
    ((x[0] as u32) << 16) + ((x[1] as u32) << 8) + ((x[2] as u32) << 0)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = redis::Client::open("redis://localhost:6379")?;
    let mut connection = client.get_async_connection().await?;

    for i in 0..1000 {
        for j in 0..1000 {
            let val = if (i + j) % 2 == 0 { 0x000000 } else { 0xFFFFFF };

            redis::cmd("BITFIELD")
                .arg("canvas")
                .arg("SET")
                .arg("u24")
                .arg((i * 1000 + j) * 24)
                .arg(val)
                .query_async(&mut connection)
                .await?;
        }
    }

    Ok(())
}
