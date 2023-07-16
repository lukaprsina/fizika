import type { Component } from "solid-js";
import { createEffect } from "solid-js";
import { createSignal } from "solid-js";
import loader from '@monaco-editor/loader';
import { createDropzone } from "@solid-primitives/upload";
import type monaco from 'monaco-editor'
import Markdown from "./Markdown";
import styles from "~/routes/[topic]/[page]/page.module.scss"
import type { Scheduled } from "@solid-primitives/scheduled";
import { debounce } from "@solid-primitives/scheduled";
import { useThemeToggle } from "~/layouts/Providers";

type MonacoEditorType = {
    active: boolean;
    initial?: string;
};

const [editorInitialized, setEditorInitialized] = createSignal(false);

// TODO: when switching pages in edit mode
// accept props.markdown
const MonacoEditor: Component<MonacoEditorType> = (props) => {
    const [editor, setEditor] = createSignal<monaco.editor.IStandaloneCodeEditor>()
    const [content, setContent] = createSignal("");
    const [trigger, setTrigger] = createSignal<Scheduled<[]>>();
    const theme = useThemeToggle()

    // console.warn("Called Monaco Editor")

    createEffect(() => {
        const a = () => setContent(editor()?.getValue() ?? "napaka")
        const trigger = debounce(a, 250);
        setTrigger(() => trigger)
    })

    const { setRef: dropzoneRef } = createDropzone({
        onDrop: async files => {
            const formData = new FormData();
            files.forEach(file => formData.append("files", file.file));

            await fetch("api/upload", {
                method: "POST",
                headers: new Headers({
                    'content-type': 'multipart/form-data'
                }),
                body: formData,
            })
        }
    })

    createEffect(() => {
        if (editorInitialized())
            return;

        if (!props.active) {
            console.warn("Editor not active, exiting")
            return;
        }

        console.warn("Editor loader.init")

        loader.init().then(monaco => {
            const component = document.querySelector("#editor");
            if (!component)
                return;

            const new_editor = monaco.editor.create(component as HTMLElement, {
                value: props.initial,
                language: 'markdown',
                dragAndDrop: true,
                automaticLayout: true,
                theme: theme?.dark() ? "vs-dark" : "vs"
            });

            const tr = trigger();
            if (tr)
                tr()

            setEditor(new_editor);
            setEditorInitialized(false);
        });
    })

    createEffect(() => {
        editor()?.updateOptions({
            theme: theme?.dark() ? "vs-dark" : "vs"
        })
    })

    createEffect(() => {
        const a = () => {
            const tr = trigger();
            if (tr)
                tr()
        };

        editor()?.onDidChangeModelContent(a)
    })

    // TODO: editor resize

    return (
        <div class="w-full h-full flex flex-row">
            <div
                id="editor"
                ref={dropzoneRef}
                class="w-1/2 h-screen flex-1"
            />
            <div
                class="flex justify-center w-1/2 h-screen flex-1"
            >
                <div class={`overflow-scroll w-full flex justify-center ${styles.page_content}`}>
                    <Markdown markdown={content()} />
                </div>
            </div>
        </div>
    )
}

export default MonacoEditor;