use color_eyre::Result;
use select::document::Document;
use std::{
    fs::{self, create_dir, create_dir_all, remove_dir_all, remove_file},
    path::Path,
    thread::sleep,
    time::Duration,
};

use crate::scrape_utils::{fix_courses, get_links, process_tab};

#[tracing::instrument]
pub async fn scrape_normal() -> Result<()> {
    let url_str = "http://fizika.sc-nm.si";
    let url = url::Url::parse(url_str)?;

    let resp = reqwest::get(url.clone()).await?;

    let html = resp.text().await?;
    let document = Document::from(html.as_str());

    let lines = get_links(&document)?;

    let pages_dir = Path::new("courses");

    if pages_dir.exists() {
        remove_dir_all(&pages_dir)?;
    }

    create_dir(&pages_dir)?;

    let pages_dir = pages_dir.canonicalize()?;
    let mut chapter_infos = vec![];

    for (pos, line) in lines.into_iter().enumerate() {
        let new_address = url.clone().join(&line)?;
        let course_resp = reqwest::get(new_address).await?;
        let course_html = course_resp.text().await?;
        let course_document = Document::from(course_html.as_str());

        let dir_name = pages_dir.join(pos.to_string()).join("pages");
        create_dir_all(&dir_name)?;
        fs::write(&dir_name.join("../index.html"), course_html.as_bytes())?;
        let mut chapter_info = process_tab(&course_document, &dir_name.as_path(), pos)?;
        chapter_info.original_name = Some(line);

        chapter_infos.push(chapter_info);

        sleep(Duration::from_millis(200));
    }

    let chapter_info_dir = Path::new("chapter_infos.json");
    if chapter_info_dir.exists() {
        remove_file(&chapter_info_dir)?
    };

    let json = serde_json::ser::to_string_pretty(&chapter_infos)?;
    fs::write(&chapter_info_dir, json.as_bytes())?;

    fix_courses()?;

    Ok(())
}
