use color_eyre::Result;

pub mod html2;
pub mod javascript;
pub mod markdown;
pub mod process_html;
pub mod scrape;
pub mod scrape_utils;
pub mod utils;

pub static mut MATH_NOT_RENDERED_COUNTER: i32 = 0;
pub static mut PAGE_NAME: bool = true;

pub fn init() -> Result<()> {
    use tracing_subscriber::prelude::*;

    color_eyre::install()?;

    let fmt_layer = tracing_subscriber::fmt::layer().with_target(false);
    tracing_subscriber::registry()
        .with(tracing_subscriber::filter::LevelFilter::INFO)
        .with(tracing_error::ErrorLayer::default())
        .with(fmt_layer)
        .init();

    Ok(())
}
