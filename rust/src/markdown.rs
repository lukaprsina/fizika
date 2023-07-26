use itertools::Itertools;
use select::{
    node::Node,
    predicate::{self, And, Class, Comment, Name},
};
use tracing::{info, warn};

use crate::{
    copy_gradivo::{copy_gradivo, GradivoType},
    html2::ElementSpacing,
    utils::{fix_formula, get_only_element, ChapterInfo},
};

// TODO: escape {}, \ in equations

pub fn recurse_node(
    node: Node,
    course_name: String,
    parents: &mut Vec<Option<String>>,
    contents: &mut Vec<(String, ElementSpacing)>,
    question_mark_course: &mut usize,
    chapter_infos: &Vec<ChapterInfo>,
) {
    if node.is(Class("placeholder-for-subslides")) {
        return;
    }

    let mut ignore_children = false;

    match node.name() {
        Some(name) => match name {
            "td" => {
                let imgs = node.find(Name("img")).collect_vec();
                let captions = node
                    .find(And(Class("imageCaption"), Name("caption")))
                    .collect_vec();

                match (imgs.len(), captions.len()) {
                    (1, _) => {
                        if node.attr("href").is_some() {
                            panic!("Img and video in the same td")
                        }

                        // image
                        let img = get_only_element(imgs);
                        let src = img.attr("src").unwrap().to_string();

                        let new_src =
                            copy_gradivo(&src, &course_name, chapter_infos, GradivoType::Image);

                        let caption = match captions.len() {
                            1 => {
                                let caption = get_only_element(captions);
                                caption.children().for_each(|child| {
                                    if !child.name().is_none() {
                                        // info!("{:#?}", caption.html());
                                        warn!("IMAGE CAPTION")
                                    }
                                });

                                caption.text()
                            }
                            0 => node.attr("alt").unwrap_or_default().to_string(),
                            _ => {
                                panic!();
                            }
                        };

                        contents.push((
                            format!("![{}]({})\n", caption, new_src),
                            ElementSpacing::Alone,
                        ));
                    }
                    (0, _) => (),
                    (_, _) => panic!("Too many images"),
                }

                // video
                let divs = node.find(predicate::Name("div")).collect_vec();
                let ps = node.find(predicate::Name("p")).collect_vec();

                match divs.len() {
                    1 => {
                        let div = get_only_element(divs);
                        if let Some(href) = div.attr("href") {
                            ignore_children = true;

                            let new_href = copy_gradivo(
                                &href,
                                &course_name,
                                chapter_infos,
                                GradivoType::Video,
                            );

                            if !(href.ends_with(".mp4")
                                || href.ends_with(".flv")
                                || href.ends_with(".m4v"))
                            {
                                panic!("div href ends with: {}", href);
                            }

                            let caption = match ps.len() {
                                1 => {
                                    let p = get_only_element(ps);

                                    p.children().for_each(|child| {
                                        if !child.name().is_none() {
                                            warn!("VIDEO CAPTION")
                                        }
                                    });

                                    p.text()
                                }
                                0 => String::new(),
                                _ => {
                                    // info!("{:#?}", ps);
                                    warn!("Too many ps");
                                    String::new()
                                }
                            };

                            contents.push((
                                format!("![{}]({})\n", caption, new_href),
                                ElementSpacing::Alone,
                            ));
                        } else {
                            warn!("NO HREF");
                            // panic!("No href");
                        }
                    }
                    0 => (),
                    _ => panic!("Multiple videos"),
                }
            }
            "ul" | "ol" => {
                for child in node.children() {
                    if let Some(name) = child.name() {
                        assert_eq!(name, "li");
                    } else {
                        if !child.html().trim().is_empty() {
                            panic!("ul has a child, which is not <li>, {}", child.html());
                        }
                    };
                }
            }
            "li" => {
                let mut ordered: Option<&str> = None;

                for parent in parents.iter().rev() {
                    if let Some(parent_name) = parent {
                        match parent_name.as_str() {
                            "ul" => {
                                ordered = Some("-");
                                break;
                            }
                            "ol" => {
                                ordered = Some("1.");
                                break;
                            }
                            _ => (),
                        }
                    }
                }

                if let Some(ordered) = ordered {
                    contents.push((format!("\n{} ", ordered), ElementSpacing::ListElement));
                }
            }
            "a" => {
                let mut href = node
                    .attr("href")
                    .expect("Anchor must have an href")
                    .to_string();

                let text = node.inner_html();
                let text = text.trim();

                if node.is(And(Class("goToSlide"), Class("explain"))) {
                    href.remove(0);
                    if !text.is_empty() {
                        contents.push((
                            format!("<Explain prompt=\"{}\">{}</Explain>", text, href),
                            ElementSpacing::NewlineBeforeAndAfter,
                        ));
                    }
                } else {
                    if !text.is_empty() {
                        contents.push((format!("[{}]({})\n", text, href), ElementSpacing::Alone));
                    } else {
                        panic!("{}", node.html());
                    }
                }

                ignore_children = true;
            }
            "caption" => {
                ignore_children = true;
            }
            "script" => {
                let display_mode = node.attr("type").unwrap();
                let full = match display_mode {
                    "math/tex; mode=display" => true,
                    "math/tex" => false,
                    _ => panic!("{}", display_mode),
                };

                node.children()
                    .for_each(|child| assert!(child.name().is_none()));

                let mut latex = node.inner_html();
                fix_formula(&mut latex);

                contents.push((
                    format!(
                        "<Equation {}latex=\"{}\"/>{}",
                        if full { "full " } else { "" },
                        latex,
                        if full { "\n" } else { "" },
                    ),
                    if full {
                        ElementSpacing::NewlineBeforeAndAfter
                    } else {
                        ElementSpacing::Inline
                    },
                ));

                ignore_children = true;
            }
            "i" | "b" => {
                ignore_children = true;

                node.children().for_each(|child| {
                    if !child.name().is_none() {
                        warn!("bold/italic")
                    }
                });

                let result = match name {
                    "i" => format!("*{}*", node.text()),
                    "b" => format!("**{}**", node.text()),
                    _ => panic!(),
                };

                contents.push((result, ElementSpacing::Inline))
            }
            "p" => {
                let elems = node
                    .find(predicate::Descendant(Name("p"), Class("close")))
                    .collect_vec();
                if elems.len() == 1 {
                    ignore_children = true;
                }
            }
            _ => {}
        },
        None => {
            if node.is(Comment) {
                return;
            }

            /* let html = if !parents.contains(&Some("p".to_string()))
                && !parents.contains(&Some("span".to_string()))
            {
                // info!("{:#?}", parents);
                node.html().trim().to_string()
            } else {
                node.html()
            }; */

            contents.push((
                node.html().trim().to_string(),
                ElementSpacing::NewlineBeforeAndAfter,
            ));
        }
    }

    if !ignore_children {
        for child in node.children() {
            let mut new_parents = parents.clone();

            let maybe_name = match child.name() {
                Some(name) => Some(name.to_string()),
                None => None,
            };

            new_parents.push(maybe_name);

            recurse_node(
                child,
                course_name.clone(),
                &mut new_parents,
                contents,
                question_mark_course,
                chapter_infos,
            );
        }
    }
}

pub static mut ALT_COUNTER: i32 = 0;
pub static mut QUESTION_MARK_COUNTER: i32 = 0;

// caption
/* if !caption.is(Class("imageCaption")) {
    panic!("caption is not imageCaption: {:#?}", parents);
}
let temp = caption.children().collect_vec();
let mut caption_children = vec![];
for x in temp {
    if !x.html().trim().is_empty() {
        caption_children.push(x);
    }
}

// "![{}]({} \"{}\")",
if caption_children.is_empty() {
    contents.push((
        format!(
            "![{}]({})\n",
            node.attr("alt").unwrap_or_default(),
            &src
        ),
        ElementSpacing::Alone,
    ));
} else {
    let caption_child = get_only_element(caption_children);
    match caption_child.name() {
        Some(name) => {
            // TODO
            // println!("Tag caption, {}", name);
        }
        None => match caption_child.as_text() {
            Some(text) => {
                contents.push((
                    format!("![{}]({})\n", text, &src),
                    ElementSpacing::Alone,
                ));
            }
            None => {
                panic!("No text in caption");
            }
        },
    }
} */

// video
/* if let Some(href) = div.attr("href") {
ignore_children = true;

if !(href.ends_with(".mp4")
    || href.ends_with(".flv")
    || href.ends_with(".m4v"))
{
    panic!("div href ends with: {}", href);
}

let mut url = url::Url::parse("http://fizika.sc-nm.si").unwrap();
let split = course_name.split_once("/index.html");
url = url
    .join(&format!("{}/", split.expect("No indexes??").0))
    .unwrap();

let href = format!("{}{}", url.as_str(), href);

// let file_type = href.rsplit_once(".").unwrap().1;
// let video_type = &format!("video/{}", file_type);

// TODO: course 38 page 8 fotoefekt link
}; */
