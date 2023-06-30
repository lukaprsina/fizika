use color_eyre::Result;
use fizika::{gradivo::parse_gradivo, init};

pub fn main() -> Result<()> {
    init()?;
    parse_gradivo()?;

    Ok(())
}
