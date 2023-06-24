use color_eyre::Result;

use itertools::Itertools;
use select::{
    document::Document,
    node::Node,
    predicate::{Class, Name},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub fn uppercase_first_letter(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}

pub fn fix_formula(formula: &mut String) {
    let mut fixed = formula
        .replace("\\mbox", "\\,")
        .replace("{%}", "{ \\%}")
        .replace("{ %}", "{ \\%}")
        .replace("{ % }", "{ \\%}")
        .replace("y: F_{tn}-F_S$=0", "y: F_{tn}-F_S=0")
        .replace("^'", "^\\prime")
        .replace("\\frc", "\\frac")
        .replace("\\cdor", "\\cdot")
        .replace("\\codt", "\\cdot")
        .replace("\\epsilo", "\\epsilon")
        .replace("\\epsilonn", "\\epsilon");

    let long_replace = [
                        (
                            "$k=\\frac{\\Delta F}{\\Delta l}=\\frac{60 \\,{ kN}-0 \\,{ kN}}{0,40 \\,{ m}-0,20 \\,{ m}}=300 \\,{ kN/m}",
                            "k=\\frac{\\Delta F}{\\Delta l}=\\frac{60 \\,{ kN}-0 \\,{ kN}}{0,40 \\,{ m}-0,20 \\,{ m}}=300 \\,{ kN/m}"
                        ),
                        (
                            "P_p=\\frac{\\Delta m_p \\cdot q_{izp}}{t_1}= {\\Delta m_p \\cdot q_{izp} \\cdot f",
                            "P_p=\\frac{\\Delta m_p \\cdot q_{izp}}{t_1}= {\\Delta m_p \\cdot q_{izp} \\cdot f}"
                        ),
                        (
                            "v_0=$\\sqrt{2 \\cdot g \\cdot \\Delta h}=6,3 \\,{ m/s} =22,6 \\,{ km/h}",
                            "v_0=\\sqrt{2 \\cdot g \\cdot \\Delta h}=6,3 \\,{ m/s} =22,6 \\,{ km/h}"
                        ),
                        (
                            "\\Sigma F=m \\cdot a$: $-F_{vzmeti}=m \\cdot a",
                            "\\Sigma F=m \\cdot a -F_{vzmeti}=m \\cdot a"
                        )
                    ];

    for long in long_replace {
        fixed = fixed.replace(long.0, long.1)
    }

    *formula = fixed;
}

pub fn get_chapter_info(title_slide: Node) -> Result<ChapterInfo> {
    let html = title_slide.inner_html();

    let document = Document::from(html.as_str());
    let texts = document.find(Class("logo_txt")).collect_vec();
    let text = get_only_element(texts);

    let headings = text.find(Name("h1")).collect_vec();
    let heading = get_only_element(headings);

    let iter = text.find(Name("h3")).collect_vec();
    let author = iter.get(0);
    let goals = iter.get(1);

    Ok(ChapterInfo {
        heading: heading.inner_html().trim().to_string(),
        author: author.map(get_not_span),
        goals: goals.map(get_not_span),
        year: None,
        original_name: None,
        javascript: None,
        uuid: Uuid::new_v4(),
    })
}

pub fn get_only_element<T>(mut elements: Vec<T>) -> T {
    assert_eq!(elements.len(), 1);
    elements.remove(0)
}

pub fn get_not_span(x: &Node) -> String {
    let mut result = String::new();

    for child in x.children() {
        if !child.is(Name("span")) {
            result = child.html()
        }
    }

    result
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ChapterInfo {
    pub heading: String,
    pub author: Option<String>,
    pub goals: Option<String>,
    pub year: Option<u32>,
    pub original_name: Option<String>,
    #[serde(skip_serializing)]
    pub javascript: Option<String>,
    pub uuid: Uuid,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ChapterInfoOutput {
    pub heading: String,
    pub author: String,
    pub goals: Option<String>,
    pub year: usize,
}
