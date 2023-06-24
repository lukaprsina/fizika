const json = JSON.stringify(output, null, 2);
fs.writeFileSync('output.json', json, 'utf-8');

if (output.quiz.multi.length != 0 && output.quiz.numeric.length != 0) {
    let quiz_info = `M:${output.quiz.multi.length}\nN:${output.quiz.numeric.length}`

    const quiz_dir = "../../quizes";
    if (!fs.existsSync(quiz_dir)) {
        fs.mkdirSync(quiz_dir)
    }

    fs.writeFileSync(`${quiz_dir}/quiz_${FS_PATH}.txt`, quiz_info, 'utf-8');
}

if (BOOK_COUNT !== 0)
    console.log("Book count:", BOOK_COUNT)

if (UNSCRAMBLED_MULTICHOICE_COUNT !== 0)
    console.log("Unscrambled count:", UNSCRAMBLED_MULTICHOICE_COUNT)
