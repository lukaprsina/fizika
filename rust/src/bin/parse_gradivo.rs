use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
};

use color_eyre::Result;
use fizika::{init, utils::ChapterInfo};
use once_cell::sync::Lazy;
use tracing::warn;

fn main() -> Result<()> {
    init()?;

    let chapter_infos = serde_json::from_str::<Vec<ChapterInfo>>(
        &fs::read_to_string("chapter_infos.json").unwrap(),
    )?;

    /* let chapter_info_outputs = serde_json::from_str::<Vec<ChapterInfoOutput>>(
        &fs::read_to_string("chapter_infos_output.json").unwrap(),
    )?; */

    let gradivo_out = Path::new("gradivo_out");
    fs::remove_dir_all(gradivo_out)?;

    let gradivo_path = fs::read_dir("gradivo")?;

    let mut extensions = HashSet::new();

    let mut dir_pos = 0;
    for dir in gradivo_path {
        let folder_path = dir.unwrap().path();
        let folder_path = folder_path.file_name().unwrap();
        let folder_path = folder_path.to_str().unwrap();
        // println!("{folder_path}");

        let mut names = Vec::new();

        for chapter_info in &chapter_infos {
            let json_name = chapter_info
                .original_name
                .clone()
                .expect("No name in chapter");

            if json_name.starts_with(folder_path) {
                names.push(json_name);
            }
        }

        if names.len() != 1 {
            warn!("DOESN'T MATCH");
            continue;
        }

        let recurse_dir = Path::new("gradivo").join(folder_path);

        let file_locations = recurse_gradivo_dir(&recurse_dir)?;
        // println!("{file_locations:#?}\n\n\n");

        for file in file_locations {
            extensions.insert(
                file.extension()
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .to_string()
                    .to_lowercase(),
            );
        }

        let json = chapter_infos[dir_pos].clone();
        let name = json.heading.clone();
        println!("{name:#?}");

        let out_dir = gradivo_out.join(&json.uuid.to_string());

        fs::create_dir_all(&out_dir)?;
        fs::create_dir_all(out_dir.join("images"))?;
        fs::create_dir_all(out_dir.join("videos"))?;
        dir_pos += 1;
    }

    println!("{extensions:#?}");

    Ok(())
}

fn recurse_gradivo_dir(recurse_dir: &PathBuf) -> Result<Vec<PathBuf>> {
    let mut file_locations = vec![];

    for entry in fs::read_dir(recurse_dir)? {
        let path = entry.unwrap().path();

        if path.is_dir() {
            let dir_name = path.file_name().unwrap().to_str().unwrap();

            if UNWANTED_DIRS.contains(&dir_name) {
                // println!("DIR: {path:#?}");
                continue;
            }

            let mut new_paths = recurse_gradivo_dir(&path)?;
            file_locations.append(&mut new_paths);
        } else if path.is_file() {
            let extension = path.extension().unwrap().to_str().unwrap();

            if UNWANTED_EXTENSIONS.contains(&extension) {
                // println!("EXT: {path:#?}");
                continue;
            }

            file_locations.push(path);
        } else {
            panic!("File is not a file or a folder");
        }
    }

    Ok(file_locations)
}

static UNWANTED_DIRS: Lazy<Vec<&str>> = Lazy::new(|| {
    vec![
        "cached_files",
        "images",
        "fotorama",
        "js",
        "jslibs",
        "mathjax11",
        "stylesheets",
        "style-specific",
        "video",
        "virtualbook-js-new",
    ]
});
// "css", "js"
static UNWANTED_EXTENSIONS: Lazy<Vec<&str>> = Lazy::new(|| vec!["html", "xsd", "xml"]);
