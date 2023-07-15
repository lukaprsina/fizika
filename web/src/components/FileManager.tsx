import { Component, createEffect, createMemo } from "solid-js";
import { Show } from "solid-js";
import { For, createSignal } from "solid-js"
import { createDropzone } from "@solid-primitives/upload"
import { A, useParams } from "solid-start";
import type { Page } from "@prisma/client";
import { List } from "./List";

type FileManagerType = {
    page?: Page;
}

const FileManager: Component<FileManagerType> = (props) => {
    const params = useParams();
    const { setRef: dropzoneRef, files: droppedFiles } = createDropzone({
    })

    // TODO: preview of navigation
    const [files, setFiles] = createSignal<string[]>(["A", "B", "C"]);
    const fib = createMemo(() => files().map(file => ({ href: file, text: file })));


    return (
        <List titles={fib()} />
    )
}

export default FileManager