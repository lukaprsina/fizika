use std::{
    fmt::Display,
    fs,
    path::{Path, PathBuf},
};

use tracing::info;
use uuid::Uuid;

use crate::utils::ChapterInfo;

#[derive(Debug, Clone, Copy)]
pub enum GradivoType {
    Video,
    Image,
}

impl Display for GradivoType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            GradivoType::Video => "videos",
            GradivoType::Image => "images",
        };

        write!(f, "{}", name)
    }
}

pub static mut COPY_LIST: Vec<(PathBuf, PathBuf)> = Vec::new();

pub fn copy_gradivo(
    src: &str,
    course_name: &str,
    chapter_infos: &Vec<ChapterInfo>,
    gradivo_type: GradivoType,
    page_num: usize,
) -> String {
    info!(page_num, src);
    let source_dir = get_source_dir(src, course_name);
    let (destination_dir, _) =
        get_destination_dir(chapter_infos, course_name, page_num, gradivo_type);

    /* let filename = PathBuf::from("gradivo");
    let filename = filename.join(dir_uuid.to_string());
    let filename = filename.join(gradivo_type.to_string());
    let filename = filename.join(destination_dir.file_name().unwrap()); */
    let name = source_dir
        .file_stem()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    let extension = match source_dir.extension() {
        Some(ext) => Some(ext.to_str().unwrap().to_string()),
        None => None,
    };

    let result = if let Some(ext) = extension.clone() {
        format!("{}.{}", name, ext.to_lowercase())
    } else {
        name.clone()
    };

    let destination_dir = destination_dir.join(result.clone());
    unsafe {
        COPY_LIST.push((source_dir.clone(), destination_dir.clone()));
    }

    /* info!(
        "{}! {}, name: {}, ext: {:#?}",
        destination_dir.to_str().unwrap(),
        result,
        name.clone(),
        extension
    ); */
    result
}

fn get_source_dir(src: &str, course_name: &str) -> PathBuf {
    let gradivo_path = Path::new("gradivo");
    let mut num_found = 0;
    let mut source_dir = PathBuf::new();

    for entry in fs::read_dir(gradivo_path).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let folder_name = path.file_name().unwrap().to_str().unwrap();
        if course_name.starts_with(folder_name) {
            source_dir = path;
            num_found += 1;
        }
    }

    if num_found != 1 {
        panic!("No source folder {course_name}, {num_found}");
    }

    let source_file = source_dir.join(src);

    if !source_file.exists() {
        panic!("Source file doesn't exist: {source_file:#?}");
    }

    source_file
}

fn get_destination_dir(
    chapter_infos: &Vec<ChapterInfo>,
    course_name: &str,
    page_num: usize,
    gradivo_type: GradivoType,
) -> (PathBuf, Uuid) {
    let gradivo_out_path = Path::new("gradivo_out");

    let mut num_found = 0;
    let mut ci = Default::default();

    for chapter_info in chapter_infos.clone() {
        let name = chapter_info.original_name.clone().unwrap();
        if name.starts_with(course_name) {
            num_found += 1;
            ci = chapter_info.clone();
        }
    }

    if num_found != 1 {
        panic!("Name doesn't match {}", num_found);
    }

    let folder = gradivo_out_path.join(ci.uuid.to_string());
    if !folder.exists() {
        panic!("{:#?}", folder);
    }

    let dir_with_page_num = folder.join(page_num.to_string());
    let dir_with_type = dir_with_page_num.join(gradivo_type.to_string());

    fs::create_dir_all(dir_with_type.clone()).unwrap();

    (dir_with_type, ci.uuid)
}
