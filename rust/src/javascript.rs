use std::{fs, path::Path, process::Command};

use color_eyre::{eyre::Context, Result};

#[tracing::instrument]
pub fn parse_js() -> Result<()> {
    let start_js = fs::read_to_string("javascript/start.js")?;
    let end_js = fs::read_to_string("javascript/end.js")?;

    let courses_dir = Path::new("courses");
    let mut i = 0;
    loop {
        let course_dir = courses_dir.join(i.to_string());

        if course_dir.is_dir() {
            let file_js = fs::read_to_string(course_dir.join("script.js"))
                .wrap_err("Unable to read script")?;

            let mut node_file = String::new();
            node_file.push_str(&start_js);
            node_file.push_str(&format!("let FS_PATH = {}", i));
            node_file.push_str(&file_js);
            node_file.push_str(&end_js);
            node_file = html_escape::decode_html_entities(&node_file).to_string();

            let tmp_str = "tmp.js";
            let tmp_path = course_dir.join(&tmp_str);
            fs::write(&tmp_path, &node_file.as_bytes())?;

            {
                let mut cmd_builder = Command::new("node");
                let command = cmd_builder
                    .args(["--trace-uncaught", &tmp_str])
                    .current_dir(&course_dir);
                let output = command.output()?;

                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);

                if !stdout.is_empty() || !stderr.is_empty() {
                    println!(
                        "{:#?}:\n\tstdout: {}\n\tstderr: {}\n\n",
                        course_dir, stdout, stderr
                    );
                }

                assert!(output.status.success());
            }
        } else {
            break;
        }

        i += 1;
    }

    Ok(())
}
