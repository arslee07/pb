use crate::Canvas;
use std::io::Write;

pub fn compress_canvas(canvas: Canvas) -> Canvas {
    use flate2::{write::ZlibEncoder, Compression};
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(&canvas).unwrap();
    encoder.finish().unwrap()
}
