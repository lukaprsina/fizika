use std::fs;

use color_eyre::Result;
use fizika::{
    copy_gradivo::COPY_LIST, gradivo::parse_gradivo, html2::to_markdown, init,
    javascript::parse_js, scrape::scrape_normal,
};

#[tokio::main]
pub async fn main() -> Result<()> {
    init()?;

    println!("scrape_normal");
    scrape_normal().await?;

    println!("parse_gradivo");
    parse_gradivo()?;

    println!("parse_js");
    parse_js()?;

    println!("extract_html");
    to_markdown()?;

    unsafe {
        let mut result = String::new();
        let len = COPY_LIST.len();

        for (pos, item) in COPY_LIST.iter().enumerate() {
            // tokio::spawn(tokio::fs::copy(item.0.clone(), item.1.clone()));
            if pos % 100 == 0 {
                println!("{}", pos as f32 / len as f32);
            }

            fs::copy(item.0.clone(), item.1.clone())?;
            result.push_str(&format!(
                "{} -> {}\n",
                item.0.to_str().unwrap().to_string(),
                item.1.to_str().unwrap().to_string()
            ));
        }

        fs::write("copy_list.txt", result)?;
    }

    Ok(())
}
