#!/bin/bash

cargo r --release --bin scrape_chrome
cargo r --release --bin parse_js
cargo r --release
cp ./chapter_infos_output.json ../web/chapter_infos.json
cp -r ./courses_output ../web/courses