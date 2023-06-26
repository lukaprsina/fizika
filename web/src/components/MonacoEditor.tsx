import type { Component } from "solid-js";
import { createEffect } from "solid-js";
import { createSignal } from "solid-js";
import loader from '@monaco-editor/loader';
import { createDropzone } from "@solid-primitives/upload";
import type monaco from 'monaco-editor'

/* const selection = editor().getPosition();

    editor().executeEdits("file upload", [{
        range: selection?.collapseToStart(),
        text: "XXX",
        forceMoveMarkers: true
    }]) */

type MonacoEditorType = {
    active: boolean;
};

const [editorInitialized, setEditorInitialized] = createSignal(false);

const MonacoEditor: Component<MonacoEditorType> = (props) => {
    const [editor, setEditor] = createSignal<monaco.editor.IStandaloneCodeEditor>()
    console.warn("Called Monaco Editor")

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
                value: '# editor',
                language: 'markdown',
                dragAndDrop: true,
            });

            setEditor(new_editor);
            setEditorInitialized(false);
        });
    })

    return <div
        id="editor"
        ref={dropzoneRef}
        class="w-full h-screen"
    // class="w-screen h-screen"
    />
}

export default MonacoEditor;