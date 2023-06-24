use color_eyre::Result;
use fizika::{init, javascript::parse_js};

pub fn main() -> Result<()> {
    init()?;
    parse_js()?;

    Ok(())
}
