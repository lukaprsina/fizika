import type { Component } from "solid-js";
import { createMemo, onMount } from "solid-js";
import { createSignal } from "solid-js"
// import { createDropzone } from "@solid-primitives/upload"
// import { useParams } from "solid-start";
import type { Page } from "@prisma/client";
import { List } from "./List";

type FileManagerType = {
    page?: Page;
}

const FileManager: Component<FileManagerType> = () => {
    /* const params = useParams();
    const { setRef: dropzoneRef, files: droppedFiles } = createDropzone({
    }) */

    // TODO: preview of navigation
    const [files] = createSignal<string[]>(["A", "B", "C"]);
    const fib = createMemo(() => files().map(file => ({
        text: file,
        id: file,
        content: file
    })));

    onMount(async () => {
        await fetch("/api/getFiles")
    })


    return (
        <List titles={fib()} />
    )
}

export default FileManager