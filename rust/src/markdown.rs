use std::collections::HashMap;

use itertools::Itertools;
use select::{
    node::Node,
    predicate::{self, And, Class, Comment, Name},
};
use uuid::Uuid;

use crate::utils::get_only_element;

pub fn recurse_node(
    node: Node,
    course_name: String,
    parents: &mut Vec<Option<String>>,
    popups: &mut HashMap<String, Uuid>,
    contents: &mut String,
    question_mark_course: &mut usize,
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

                if imgs.len() != 0 || captions.len() != 0 {
                    if imgs.len() == 1 && captions.len() == 1 {
                        if node.attr("href").is_some() {
                            panic!("Img and video in the same td")
                        }

                        // image
                        let img = get_only_element(imgs);
                        let caption = get_only_element(captions);

                        let mut src = img.attr("src").unwrap().to_string();

                        let mut url = url::Url::parse("http://fizika.sc-nm.si").unwrap();
                        let split = course_name.split_once("/index.html");
                        url = url
                            .join(&format!("{}/", split.expect("No indexes??").0))
                            .unwrap();

                        src.insert_str(0, url.as_str());

                        // caption
                        if !caption.is(Class("imageCaption")) {
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
                            contents.push_str(&format!(
                                "![{}]({})\n",
                                node.attr("alt").unwrap_or_default(),
                                &src,
                            ));
                        } else {
                            let caption_child = get_only_element(caption_children);
                            match caption_child.name() {
                                Some(name) => {
                                    println!("Tag caption, {}", name);
                                }
                                None => match caption_child.as_text() {
                                    Some(text) => {
                                        contents.push_str(&format!(
                                            r#"<figure>
    <img src="{}" alt="{}">
    <figcaption>{}</figcaption>
</figure>{}"#,
                                            &src,
                                            node.attr("alt").unwrap_or_default(),
                                            text,
                                            "\n",
                                        ));
                                    }
                                    None => {
                                        panic!("No text in caption");
                                    }
                                },
                            }
                        }
                    }
                }

                // video
                let divs = node.find(predicate::Name("div")).collect_vec();
                let ps = node.find(predicate::Name("p")).collect_vec();

                if divs.len() == 1 && ps.len() == 1 {
                    let div = get_only_element(divs);
                    let p = get_only_element(ps);

                    match div.attr("href") {
                        Some(href) => {
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

                            let file_type = href.rsplit_once(".").unwrap().1;
                            let video_type = &format!("video/{}", file_type);

                            // TODO: caption
                            contents.push_str(&format!(
                                r#"<Video href="{}" caption="{}" />{}"#,
                                href, "", "\n"
                            ));
                        }
                        None => {}
                    }
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
                    contents.push_str(&format!("\n{} ", ordered));
                }
            }
            "a" => {
                let mut href = node
                    .attr("href")
                    .expect("Anchor must have an href")
                    .to_string();

                if node.is(And(Class("goToSlide"), Class("explain"))) {
                    href.remove(0);
                    // TODO
                    let uuid = Uuid::new_v4();
                    let uuid_str = uuid.to_string();
                    popups.insert(href, uuid);
                } else {
                    let text = node.inner_html();
                    let text = text.trim();

                    if !text.is_empty() {
                        ignore_children = true;
                        contents.push_str(&format!("[{}]({})\n", text, href));
                    } else {
                        println!("{}", node.html());
                    }
                }
            }
            "caption" => {
                ignore_children = true;
            }
            _ => {}
        },
        None => {
            if !node.is(Comment) {
                let html = node.html();
                contents.push_str(&html.trim());
            }
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
                popups,
                contents,
                question_mark_course,
            );
        }
    }
}

pub static mut ALT_COUNTER: i32 = 0;
pub static mut QUESTION_MARK_COUNTER: i32 = 0;
