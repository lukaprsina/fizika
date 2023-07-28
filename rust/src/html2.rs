use std::{
    collections::{HashMap, HashSet},
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
    str::FromStr,
};

use color_eyre::Result;
use itertools::Itertools;
use once_cell::sync::Lazy;
use select::{document::Document, predicate};
use serde::{Deserialize, Serialize};
use tracing::info;

use crate::{
    markdown::recurse_node,
    // parse_file::PageConfig,
    process_html::{process_exercise, process_popup, ExerciseError},
    utils::{get_only_element, uppercase_first_letter, ChapterInfo},
    PAGE_NAME,
};

pub static mut CLASSES: Lazy<HashSet<String>> = Lazy::new(|| HashSet::new());

#[derive(Debug, Serialize, Deserialize)]
pub struct PageConfig {
    pub subheading: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Script {
    pub slides: Vec<Slide>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Slide {
    pub skip: bool,
    #[serde(rename = "type")]
    pub slide_type: String,
    pub namespace: String,
    pub id: String,
    pub name: String,
    pub title: Option<String>,

    // unused
    pub next: Option<String>,
    pub prev: Option<String>,
    pub navigation: Option<String>,
}

#[tracing::instrument]
pub fn to_markdown() -> Result<()> {
    let courses_dir = Path::new("courses");
    let output_dir = Path::new("courses_output");

    if output_dir.exists() {
        fs::remove_dir_all(&output_dir)?;
    }

    let mut chapter_infos = {
        let chapter_info_path = Path::new("chapter_infos.json");
        let chapter_info_string = fs::read_to_string(chapter_info_path)?;
        serde_json::from_str::<Vec<ChapterInfo>>(&chapter_info_string)?
    };

    let mut i = 0;
    loop {
        // skip quizes
        if i == 2 || i == 3 {
            i += 1;
            continue;
        }

        unsafe {
            PAGE_COUNT = 0;
        }

        if !process_chapter(i, courses_dir, output_dir, &mut chapter_infos)? {
            break;
        }

        i += 1;
    }

    unsafe {
        for class in CLASSES.iter() {
            println!("{}", class);
        }
    }

    Ok(())
}

fn process_chapter(
    i: usize,
    courses_dir: &Path,
    output_dir: &Path,
    chapter_infos: &mut Vec<ChapterInfo>,
) -> Result<bool> {
    let course_dir = courses_dir.join(i.to_string());
    let course_output_dir = output_dir.join(i.to_string());

    if !course_dir.is_dir() {
        return Ok(false);
    }

    fs::create_dir_all(&course_output_dir)?;
    unsafe {
        if PAGE_NAME {
            println!("\n\nCourse dir: {course_dir:#?}");
        }
    }

    fs::copy(
        course_dir.join("output.json"),
        course_output_dir.join("script.json"),
    )?;

    let config_path = course_output_dir.join("config.json");
    write_config(chapter_infos, &config_path, i)?;

    let mut pages: HashMap<String, (Document, PathBuf, usize)> = HashMap::new();
    let mut j = 0;

    loop {
        if !read_pages_fs(&mut pages, &course_dir, j) {
            break;
        }

        j += 1;
    }

    let mut missing_slides = Vec::new();

    let script = fs::read_to_string(course_dir.join("output.json"))?;
    let script_rs = serde_json::from_str::<Script>(&script)?;

    let length = script_rs.slides.len();
    let mut exercises: Vec<Exercise> = vec![];

    let mut pos = 0;
    for slide in script_rs.slides {
        if pos == 0 || pos == length - 1 {
            pos += 1;
            continue;
        }

        // previous 104, 105
        if (i == 27 && pos == 104) || (i == 39 && pos == 42) {
            pos += 1;
            pages.remove(&slide.id).expect("Cannot remove broken slide");
            continue;
        }

        if (i == 27 && pos == 105) || (i == 37 && pos == 43) {
            pos += 3;
            pages.remove(&slide.id).expect("Cannot remove broken slide");
            continue;
        }

        if (i == 8 && pos == 28) || (i == 9 && pos == 21) || (i == 29 && pos == 10) {
            // TODO: unconnected
            pos += 2;
            pages.remove(&slide.id).expect("Cannot remove broken slide");
            continue;
        }

        match pages.remove(&slide.id) {
            Some((document, page_path_js, page_num)) => {
                // println!("Script removed page at {:#?}, pos: {}", page_path_js, pos);

                let input_page_path = course_dir.join(format!("pages/page_{}.html", page_num));
                assert_eq!(input_page_path, page_path_js);
                assert_eq!(pos, page_num + 1);

                if !input_page_path.is_file() {
                    panic!("{:#?} is not a file", input_page_path);
                }

                parse_page_js_and_fs(&slide, &document, &mut exercises);
                pos += 1;
            }
            None => {
                if slide.name != "endslide" && slide.slide_type != "transition" {
                    missing_slides.push(slide);
                }
            }
        }
    }

    if i != 24 {
        assert!(missing_slides.is_empty());
    }

    // end slide
    if pages.len() != 0 {
        if let Some(page) = pages.get("courses/8/pages/page_91.html") {
            panic!(
                "There are more html pages than slides in js: {:#?}, {}",
                page.1, page.2
            );
        }
    }

    let course_name = chapter_infos[i].original_name.clone().unwrap();

    for (page_num, exercise) in exercises.into_iter().enumerate() {
        let output_page_dir = course_output_dir.join("pages");
        let output_page_path = output_page_dir.join(format!("page_{}", page_num));
        fs::create_dir_all(&output_page_path)?;
        parse_exercise2(
            exercise,
            &output_page_path,
            course_name.clone(),
            chapter_infos,
            page_num,
        )?;
    }

    Ok(true)
}

static mut PAGE_COUNT: usize = 0;

fn parse_exercise2(
    exercise: Exercise,
    output_page_path: &Path,
    course_name: String,
    chapter_infos: &Vec<ChapterInfo>,
    page_num: usize,
) -> Result<()> {
    match process_exercise(&exercise.document) {
        Ok(result) => {
            if let Some((area, subheading)) = result {
                let index_path = output_page_path.join("index.html");
                let mut index_file = File::create(&index_path)?;

                {
                    let config_path = output_page_path.join("config.json");
                    let config_json = serde_json::to_string_pretty(&PageConfig {
                        subheading: subheading.text(),
                    })?;
                    fs::write(&config_path, config_json.as_bytes())?;
                }
                unsafe {
                    if PAGE_NAME {
                        println!("Course:\t{:#?}", index_path);
                    }
                    PAGE_COUNT += 1;

                    write_node_to_file(
                        &mut index_file,
                        area,
                        course_name.clone(),
                        chapter_infos,
                        PAGE_COUNT,
                    );
                }
            }
        }
        Err(err) => {
            if err == ExerciseError::HiddenExercise {
                // TODO: popup_count += 1;
            }
        }
    };

    let popups_dir = output_page_path.join("popups");
    if !exercise.popups.is_empty() {
        fs::create_dir_all(&popups_dir)?;
    }

    for popup in exercise.popups {
        let (html_uuid, area) = process_popup(&popup.document)?;
        assert_eq!(html_uuid, popup.slide.id);
        let popup_dir = popups_dir.join(format!("{}.html", popup.slide.id));
        let mut file = File::create(&popup_dir)?;

        unsafe {
            if PAGE_NAME {
                println!("Popup:\t{:#?}", popup_dir);
            }
        }

        write_node_to_file(
            &mut file,
            area,
            course_name.clone(),
            chapter_infos,
            page_num,
        );
    }

    Ok(())
}

#[derive(Debug, Clone, Copy)]
pub enum ElementSpacing {
    Inline,
    NewlineBefore,
    NewlineAfter,
    NewlineBeforeAndAfter,
    ListElement,
    Alone,
}

fn write_node_to_file(
    file: &mut File,
    area: select::node::Node,
    course_name: String,
    chapter_infos: &Vec<ChapterInfo>,
    page_num: usize,
) {
    let mut parents: Vec<Option<String>> = Vec::new();
    let mut question_mark_course = 0;
    let mut contents: Vec<(String, ElementSpacing)> = Vec::new();

    recurse_node(
        area,
        course_name.clone(),
        &mut parents,
        &mut contents,
        &mut question_mark_course,
        chapter_infos,
        page_num,
    );

    let result = contents_to_string(contents);

    /* info!("{:#?}", contents);
    info!("{:#?}", result); */

    file.write(result.as_bytes())
        .expect(&format!("Can't write to file: {}", course_name));
}

fn contents_to_string(contents: Vec<(String, ElementSpacing)>) -> String {
    use ElementSpacing::*;

    let filtered_list = contents
        .clone()
        .into_iter()
        .filter_map(|line| {
            let trimmed = line.0.trim().to_string();
            let trimmed = trimmed
                .chars()
                .coalesce(|a, b| {
                    if a.is_whitespace() && b.is_whitespace() {
                        Ok(' ')
                    } else {
                        Err((a, b))
                    }
                })
                .collect::<String>();

            if trimmed.is_empty() {
                None
            } else {
                Some((trimmed, line.1))
            }
        })
        .collect_vec();

    let mut index = 1;
    if filtered_list.is_empty() {
        info!("{:#?}", contents);
        panic!("NO content");
    }

    let mut result = filtered_list[0].0.clone();

    while index < filtered_list.len() {
        let previous = &filtered_list[index - 1];
        let current = &filtered_list[index];

        let (newline_num, space) = match (previous.1, current.1) {
            (_, Inline) => (0, true),
            (Inline, _) => (0, true),
            (NewlineBeforeAndAfter, _) => (2, false),
            (NewlineAfter, _) => (2, false),
            (_, ListElement) => (1, false),
            (ListElement, _) => (0, true),
            (_, NewlineBeforeAndAfter) => (2, false),
            (_, NewlineBefore) => (2, false),
            (Alone, _) => (1, false),
            (_, Alone) => (1, false),
            _ => (0, false),
        };

        result.push_str(&"\n".repeat(newline_num));
        if space {
            result.push(' ');
        }
        result.push_str(&current.0);

        index += 1;
    }

    // info!("{:#?}", filtered_list);
    // info!("\n{}", result);

    result.trim().to_string()
}

fn write_config(
    chapter_info_json: &mut Vec<ChapterInfo>,
    config_path: &Path,
    i: usize,
) -> Result<()> {
    let mut config = &mut chapter_info_json[i];
    let heading = &mut config.heading.clone();
    let (number, name) = heading.split_at(3);

    config.heading = name.to_string();

    for text_maybe in [&mut config.author, &mut config.goals] {
        if let Some(text) = text_maybe {
            let new = text.trim();
            *text = uppercase_first_letter(new);
        }
    }

    let new = config.heading.trim();
    config.heading = uppercase_first_letter(new);

    let num_char = number.chars().next().unwrap();
    config.year = Some(char::to_digit(num_char, 10).unwrap());

    let config_json = serde_json::to_string_pretty(&config)?;
    fs::write(&config_path, config_json.as_bytes())?;

    Ok(())
}

fn read_pages_fs(
    pages: &mut HashMap<String, (Document, PathBuf, usize)>,
    course_dir: &Path,
    page_num: usize,
) -> bool {
    let page_path = course_dir.join(format!("pages/page_{}.html", page_num));

    if !page_path.exists() {
        return false;
    }

    let content = std::fs::read_to_string(&page_path).unwrap();
    let document = Document::from(tendril::StrTendril::from_str(&content).unwrap());

    let outer_divs = document.find(predicate::Class("eplxSlide")).collect_vec();
    let outer_div = get_only_element(outer_divs);

    assert!(outer_div.is(predicate::Name("div")));
    let html_id = outer_div.attr("id").expect("Page has no id");

    pages.insert(html_id.to_string(), (document, page_path, page_num));

    return true;
}

fn parse_page_js_and_fs(slide: &Slide, document: &Document, exercises: &mut Vec<Exercise>) {
    let outer_divs = document.find(predicate::Class("eplxSlide")).collect_vec();
    let outer_div = get_only_element(outer_divs);

    let html_name = outer_div.attr("name").expect("Page has no name");
    assert_eq!(html_name, slide.name);

    let html_is_popup = outer_div.is(predicate::Class("popupImpl"));
    match slide.slide_type.as_str() {
        "popup" => {
            assert!(html_is_popup);
            exercises
                .last_mut()
                .expect("Popup without a slide")
                .popups
                .push(Popup {
                    slide: slide.clone(),
                    document: document.clone(),
                });
        }
        "slide" => {
            assert!(!html_is_popup);
            exercises.push(Exercise {
                popups: vec![],
                slide: slide.clone(),
                document: document.clone(),
            });
        }
        _ => panic!("Type {} missing", slide.slide_type),
    }
}

pub struct Exercise {
    pub popups: Vec<Popup>,
    pub slide: Slide,
    pub document: Document,
}

pub struct Popup {
    pub slide: Slide,
    pub document: Document,
}
