use color_eyre::Result;
use fizika::{init, scrape::scrape_normal};

#[tokio::main]
pub async fn main() -> Result<()> {
    init()?;
    scrape_normal().await?;

    Ok(())
}
