use std::{collections::HashMap, io::Write};

use itertools::Itertools;
use katex::OutputType;
use select::{
    node::Node,
    predicate::{self, And, Class, Comment, Name},
};
use uuid::Uuid;
use xml::{writer::XmlEvent, EventWriter};

use crate::{
    html2::CLASSES,
    utils::{fix_formula, get_only_element},
};

pub fn recurse_node<W: Write>(
    node: Node,
    course_name: String,
    parents: &mut Vec<Option<String>>,
    popups: &mut HashMap<String, Uuid>,
    writer: &mut EventWriter<W>,
    question_mark_course: &mut usize,
) {
    if node.is(Class("placeholder-for-subslides")) {
        return;
    }

    let mut default_tag = |name: &str| {
        let event: XmlEvent = XmlEvent::start_element(name).into();
        writer.write(event).unwrap();
        true
    };

    let mut ignore_children = false;

    let ending_tag = match node.name() {
        Some(name) => {
            match name {
                "script" => {
                    if let Some(attr_type) = node.attr("type") {
                        let display_mode = match attr_type {
                            "math/tex" => false,
                            "math/tex; mode=display" => true,
                            _ => panic!("Script is not math"),
                        };

                        let script_children = node.children().collect_vec();
                        let script_child = get_only_element(script_children);

                        let mut formula = script_child.as_text().unwrap().to_string();

                        *question_mark_course += 1;
                        unsafe {
                            QUESTION_MARK_COUNTER += formula.matches('?').count() as i32;
                        }

                        fix_formula(&mut formula);

                        let opts = katex::Opts::builder()
                            .display_mode(display_mode)
                            .output_type(OutputType::Html)
                            .build()
                            .unwrap();
                        let mathml = katex::render_with_opts(&formula, opts).unwrap();
                        writer.write(XmlEvent::Characters(&mathml)).unwrap();
                    }
                    false
                }
                "td" => {
                    // table
                    let imgs = node.find(Name("img")).collect_vec();
                    let captions = node
                        .find(And(Class("imageCaption"), Name("caption")))
                        .collect_vec();

                    if imgs.len() != 0 || captions.len() != 0 {
                        if imgs.len() == 1 && captions.len() == 1 {
                            // println!("Img: {}, caption {}", imgs.len(), captions.len());
                            // courses/0/pages/page_23.html
                            if node.attr("href").is_some() {
                                panic!("Img and video in the same td")
                            }

                            let img = get_only_element(imgs);
                            let caption = get_only_element(captions);

                            let event: XmlEvent = XmlEvent::start_element("figure")
                                .attr("class", "image")
                                .into();
                            writer.write(event).unwrap();

                            {
                                let mut src = img.attr("src").unwrap().to_string();

                                let mut url = url::Url::parse("http://fizika.sc-nm.si").unwrap();
                                let split = course_name.split_once("/index.html");
                                url = url
                                    .join(&format!("{}/", split.expect("No indexes??").0))
                                    .unwrap();

                                src.insert_str(0, url.as_str());
                                let mut start_event =
                                    XmlEvent::start_element("img").attr("src", &src);

                                match node.attr("alt") {
                                    Some(alt) => {
                                        start_event = start_event.attr("alt", alt);
                                    }
                                    None => unsafe {
                                        ALT_COUNTER += 1;
                                    },
                                }

                                let event: XmlEvent = start_event.into();
                                writer.write(event).unwrap();

                                let end: XmlEvent = XmlEvent::end_element().into();
                                writer.write(end).unwrap();
                            }

                            {
                                if !caption.is(Class("imageCaption")) {
                                    panic!("caption is not imageCaption: {:#?}", parents);
                                }

                                let figcaption_start: XmlEvent =
                                    XmlEvent::start_element("figcaption").into();
                                writer.write(figcaption_start).unwrap();

                                let temp = caption.children().collect_vec();
                                let mut caption_children = vec![];
                                for x in temp {
                                    if !x.html().trim().is_empty() {
                                        caption_children.push(x);
                                    }
                                }

                                if !caption_children.is_empty() {
                                    let caption_child = get_only_element(caption_children);

                                    if let Some(text) = caption_child.as_text() {
                                        let caption_elem: XmlEvent =
                                            XmlEvent::Characters(text).into();
                                        writer.write(caption_elem).unwrap();
                                    } else if caption_child.name().unwrap() == "a" {
                                        let a_start: XmlEvent = XmlEvent::start_element("a")
                                            .attr("href", caption_child.attr("href").unwrap())
                                            .into();
                                        writer.write(a_start).unwrap();

                                        let caption = caption_child.inner_html();
                                        let caption_elem: XmlEvent =
                                            XmlEvent::Characters(&caption).into();
                                        writer.write(caption_elem).unwrap();

                                        let end: XmlEvent = XmlEvent::end_element().into();
                                        writer.write(end).unwrap();

                                        println!("\tcaption <a>");
                                    } else {
                                        panic!("{}", caption_child.html());
                                    }

                                    let end: XmlEvent = XmlEvent::end_element().into();
                                    writer.write(end).unwrap();
                                }
                            }

                            let end: XmlEvent = XmlEvent::end_element().into();
                            writer.write(end).unwrap();

                            /*
                            <figure class="image">
                                <img src="https://www.tiny.cloud/docs/images/logos/android-chrome-256x256.png" alt="" width="256" height="256">
                                <figcaption>Caption</figcaption>
                            </figure>
                             */
                        }
                    }

                    let divs = node.find(predicate::Name("div")).collect_vec();
                    let ps = node.find(predicate::Name("p")).collect_vec();

                    let write_end_tag = if divs.len() == 1 && ps.len() == 1 {
                        let div = get_only_element(divs);
                        let p = get_only_element(ps);

                        let write_end_tag = match div.attr("href") {
                            Some(href) => {
                                ignore_children = true;

                                if !(href.ends_with(".mp4")
                                    || href.ends_with(".flv")
                                    || href.ends_with(".m4v"))
                                {
                                    panic!("div href ends with: {}", href)
                                }

                                let event: XmlEvent = XmlEvent::start_element("video").into();

                                let mut url = url::Url::parse("http://fizika.sc-nm.si").unwrap();
                                let split = course_name.split_once("/index.html");
                                url = url
                                    .join(&format!("{}/", split.expect("No indexes??").0))
                                    .unwrap();

                                let href = format!("{}{}", url.as_str(), href);

                                writer.write(event).unwrap();

                                let file_type = href.rsplit_once(".").unwrap().1;
                                let video_type = &format!("video/{}", file_type);

                                let source: XmlEvent = XmlEvent::start_element("source")
                                    .attr("src", &href)
                                    .attr("type", &video_type)
                                    .into();
                                writer.write(source).unwrap();
                                writer.write(XmlEvent::end_element()).unwrap();

                                true
                            }
                            None => panic!("Div is not a movie!"),
                        };

                        write_end_tag
                    } else {
                        false
                    };

                    write_end_tag
                }
                "img" => {
                    /*
                    let mut src = node.attr("src").unwrap().to_string();

                    let mut url = url::Url::parse("http://fizika.sc-nm.si").unwrap();
                    let split = course_name.split_once("/index.html");
                    url = url
                        .join(&format!("{}/", split.expect("No indexes??").0))
                        .unwrap();

                    src.insert_str(0, url.as_str());
                    let mut start_event = XmlEvent::start_element("img").attr("src", &src);

                    match node.attr("alt") {
                        Some(alt) => {
                            start_event = start_event.attr("alt", alt);
                        }
                        None => unsafe {
                            ALT_COUNTER += 1;
                        },
                    }

                    let event: XmlEvent = start_event.into();
                    writer.write(event).unwrap();
                    true
                    */
                    false
                }
                "a" => {
                    // TODO: skip non-explanetory ones like 7-1
                    // TODO: po defaultu jih prikazuj, my brother in christ

                    if node.is(And(Class("goToSlide"), Class("explain"))) {
                        let mut href = node
                            .attr("href")
                            .expect("goToSlide must have an href")
                            .to_string();
                        href.remove(0);

                        let uuid = Uuid::new_v4();
                        let uuid_str = uuid.to_string();
                        popups.insert(href, uuid);
                        let event: XmlEvent = XmlEvent::start_element("button")
                            .attr("onclick", "() => course.openModal()")
                            .attr("data-id", &uuid_str)
                            .into();
                        writer.write(event).unwrap();
                        true
                    } else if node.is(Class("goToHidden")) {
                        false
                    } else {
                        false
                    }
                }
                "p" => {
                    let mut start = XmlEvent::start_element("p");

                    if node.is(Class("text-centered")) {
                        start = start.attr("style", "text-align: center");
                    }

                    let event: XmlEvent = start.into();
                    writer.write(event).unwrap();
                    true
                }
                "caption" => {
                    /* let start = XmlEvent::start_element("caption");
                    if !node.is(Class("imageCaption")) {
                        panic!("caption is not imageCaption: {:#?}", parents);
                    }
                    let event: XmlEvent = start.into();
                    writer.write(event).unwrap();
                    true
                    */
                    ignore_children = true;
                    false
                }
                "video" => {
                    panic!();
                    /* let mut start = XmlEvent::start_element("video");

                    let event: XmlEvent = start.into();
                    writer.write(event).unwrap();
                    true */
                }
                "tr" | "table" | "tbody" => false,
                name => default_tag(name),
            }
        }
        None => {
            if !node.is(Comment) {
                let html = node.html();

                let event: XmlEvent = XmlEvent::characters(&html).into();
                writer.write(event).unwrap();
            }

            false
        }
    };

    // println!("{:#?}", node.attrs().collect_vec());

    if let Some(classes) = node.attr("class") {
        for class in classes.split_whitespace() {
            unsafe {
                CLASSES.insert(class.to_string());
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
                writer,
                question_mark_course,
            );
        }
    }

    if ending_tag {
        writer.write(XmlEvent::end_element()).unwrap();
    }
}

pub static mut ALT_COUNTER: i32 = 0;
pub static mut QUESTION_MARK_COUNTER: i32 = 0;
