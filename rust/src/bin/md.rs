use color_eyre::Result;
use fizika::{html2::to_markdown, init};

pub fn main() -> Result<()> {
    init()?;
    to_markdown()?;

    Ok(())
}
