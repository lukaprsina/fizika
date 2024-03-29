import fs from 'fs';
import { PrismaClient } from "@prisma/client";
import path from 'path';

const LIMIT_COURSES = 99;
const prisma = new PrismaClient()

async function main() {
    const courses_dir = "../rust/courses_output";

    const fizika_course = await prisma.course.create({
        data: {
            title: "Fizika",
            metadata: {
                create: {
                    description: "Fizika course metadata desciption"
                },
            }
        }
    })

    const rozic = await prisma.user.create({
        data: {
            name: "Matej Rožič",
        }
    })

    const erste = await prisma.user.create({
        data: {
            name: "Andreja Eršte",
        }
    })

    let i = 0;
    while (i < LIMIT_COURSES) {
        if (i == 2 || i == 3) {
            i++;
            continue;
        }

        const course_dir = path.join(courses_dir, i.toString());
        if (!fs.existsSync(course_dir)) {
            break;
        }

        console.log("course", course_dir)

        const config_path = path.join(course_dir, "config.json")
        const config_file = fs.readFileSync(config_path).toString();
        const config_json = JSON.parse(config_file);

        const script_path = path.join(course_dir, "script.json")
        const script_file = fs.readFileSync(script_path).toString();
        const script_json = JSON.parse(script_file);

        // const script_title = script_json.metadata.title.substring(3)
        /* if (config_json.heading != script_title)
            throw `c_h: ${config_json.heading}, s_t: ${script_title}`
        if (config_json.goals != script_json.metadata.goals) {
            console.log(toHex(config_json.goals))
            console.log(toHex(script_json.metadata.goals))
            throw `c_g:\n${config_json.goals}\ns_m_g:\n${script_json.metadata.goals}\n\n`
        } */

        const authors_raw = script_json.metadata.author
        const authors = authors_raw.map((author: string) => {
            switch (author) {
                case "Andreja Eršte":
                    return {
                        id: erste.id
                    }
                case "Matej Rožič":
                    return {
                        id: rozic.id,
                    }
                default:
                    throw new Error("Neznan avtor")
            }
        })

        const topic = await prisma.topic.create({
            data: {
                id: i,
                title: config_json.heading,
                year: config_json.year,
                path: config_json.uuid,
                authors: {
                    connect: authors
                },
                course: { connect: { id: fizika_course.id } },
                metadata: {
                    create: {
                        description: script_json.metadata.description,
                        goals: script_json.metadata.goals,
                        license: script_json.metadata.license,
                    },
                }
            }
        })

        let j = 0;
        while (true) {
            const exercise_dir = path.join(course_dir, `pages/page_${j}`)
            const exercise_file = path.join(exercise_dir, "index.html")

            if (!fs.existsSync(exercise_file))
                break;

            const popups_dir = path.join(exercise_dir, "popups");
            console.log("\tpage dir", exercise_dir)

            let exercise_contents = fs.readFileSync(exercise_file).toString();
            if (fs.existsSync(exercise_file)) {
                if (fs.existsSync(popups_dir)) {
                    const contents = fs.readdirSync(popups_dir)

                    for (const popup_file of contents) {
                        const popup_path = path.join(popups_dir, popup_file)
                        console.log("\t\tpopup", popup_file, popup_path)

                        const file = fs.readFileSync(popup_path);

                        // place popups to main markdown
                        const id = popup_file.replace(".html", "")
                        exercise_contents = exercise_contents.replace(id, "\n" + file.toString() + "\n")
                    }
                }

                const page_path = path.join(exercise_dir, "config.json")
                const page_file = fs.readFileSync(page_path).toString();
                const page_json = JSON.parse(page_file);


                await prisma.page.create({
                    data: {
                        id: j,
                        markdown: exercise_contents,
                        text: "Page text",
                        title: page_json.subheading,
                        topic: { connect: { id: topic.id } },
                        metadata: { create: {} }
                    }
                })
            }

            j += 1;
        }

        i += 1;
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })