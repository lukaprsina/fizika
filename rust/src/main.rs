use color_eyre::Result;
use fizika::{html2::extract_html2, init, javascript::parse_js, scrape::scrape_normal};

#[tokio::main]
pub async fn main() -> Result<()> {
    init()?;

    println!("scrape_normal");
    scrape_normal().await?;

    println!("parse_js");
    parse_js()?;

    println!("extract_html");
    extract_html2()?;

    Ok(())
}
