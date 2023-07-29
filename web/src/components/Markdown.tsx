import { compileSync, runSync } from "@mdx-js/mdx"
import type { Component, JSX, VoidComponent } from "solid-js";
import { Match, Switch, createEffect, createMemo, getOwner, onMount, runWithOwner } from "solid-js";
import { createComponent, createSignal, Show } from "solid-js";
import * as jsx_runtime from 'solid-jsx'
import katex from "katex"
// import remarkGfm from 'remark-gfm';
import "katex/dist/katex.min.css"

// TODO: async import
import { getType } from "mime-lite"
import { useParams } from "solid-start";

export type PreloadedPageType = {
    next?: DisplayProps;
    previous?: DisplayProps;
}

type DisplayProps = {
    id: number;
    markdown?: string;
    title?: string | null;
}

type MarkdownProps = {
    current?: DisplayProps;
    preloaded?: PreloadedPageType;
    topic_uuid?: string;
};

type PageType = Component<{
    components: any;
}>;

const page_cache: Record<number, {
    page: PageType | undefined,
    markdown_length: number
    title?: string
}> = {}

type ParamsType = {
    topic: string;
    page: string;
}

type MimeType = "image" | "video"

const Markdown: VoidComponent<MarkdownProps> = (props) => {
    const [content, setContent] = createSignal<JSX.Element>();
    const [components, setComponents] = createSignal<any>();
    const owner = getOwner();
    const params = useParams<ParamsType>();

    createEffect(() => {
        const components_mid = {
            img: (breh: { src: string, alt: string }) => {
                const [mimeType, setMimeType] = createSignal<MimeType | undefined>();

                createEffect(() => {
                    const bleh = getType(breh.src)
                    if (bleh.startsWith("image"))
                        setMimeType("image")
                    else if (bleh.startsWith("video"))
                        setMimeType("video")
                    else
                        setMimeType()
                });

                const src = createMemo(() => {
                    let muh_type;
                    if (mimeType() == "image")
                        muh_type = "images"
                    else if (mimeType() == "video")
                        muh_type = "videos"
                    else return;
                    return `/gradivo/${props.topic_uuid}/${params.page}/${muh_type}/${breh.src}`
                })

                return <Switch fallback={<p>{breh.alt}</p>}>
                    <Match when={src() && mimeType() == "image"}>
                        <figure>
                            <img loading="lazy" src={src()} alt={breh.alt} />
                            <figcaption>{breh.alt}</figcaption>
                        </figure>
                    </Match>
                    <Match when={src() && mimeType() == "video"}>
                        <figure>
                            <video>
                                <source src={src()} />
                            </video>
                            <figcaption>{breh.alt}</figcaption>
                        </figure>
                    </Match>
                </Switch >
            },
            Explain: (props: { prompt: string, children: JSX.Element }) => {
                const [shown, setShown] = createSignal(false)
                // TODO: več gumbov naemkrat premakne dol naslednje
                return <>
                    <button onClick={() => setShown(!shown())}>
                        {props.prompt}
                    </button>
                    <Show when={shown()}>{props.children}</Show>
                </>
            },
            Equation: (props: { latex: string, full?: boolean }) => {
                let katex_ref: HTMLDivElement | undefined;

                onMount(() => {
                    if (!katex_ref) return;

                    katex.render(props.latex, katex_ref, {
                        throwOnError: false,
                        displayMode: props.full
                    });
                });

                return <span
                    class="inline"
                    ref={katex_ref}
                />
            }
        }

        setComponents(components_mid)
    })

    createEffect(() => {
        const setPage = (element: PageType) => runWithOwner(owner, () => {
            const jsx = createComponent(element, {
                components: components()
            })

            setContent(() => jsx)
        })

        if (!owner) return;
        if (typeof props.current?.markdown != "string") return;

        const cached = page_cache[props.current.id];
        if (
            cached &&
            cached.page &&
            props.current.markdown.length == cached.markdown_length &&
            props.current.title == cached.title
        ) {
            setPage(cached.page)
            return;
        }

        try {
            const element = compileMarkdown(props.current.markdown, props.current.title ?? undefined)
            page_cache[props.current.id] = {
                page: element,
                markdown_length: props.current.markdown.length ?? 0,
                title: props.current.title ?? undefined
            }

            setPage(element)
        } catch (e) {
            console.warn("MDX Compile error", e)
        }
    })

    createEffect(() => {
        if (!props.preloaded) return;

        for (const markdown of [props.preloaded.next, props.preloaded.previous]) {
            if (!markdown || typeof markdown.markdown != "string") return;

            const cached = page_cache[markdown.id];
            if (!cached) {
                try {
                    const element = compileMarkdown(markdown.markdown, markdown.title ?? undefined)
                    page_cache[markdown.id] = {
                        page: element,
                        markdown_length: markdown.markdown.length,
                        title: markdown.title ?? undefined
                    }
                } catch (e) {
                    console.warn("MDX Compile error", e)
                }
            }
        }
    })

    return (
        <div class="prose">
            {content()}
        </div>
    )
}

function compileMarkdown(markdown: string, title: string | undefined): PageType {
    let titled_markdown = markdown;

    if (title) {
        titled_markdown = `# ${title}\n\n${titled_markdown}`
    }

    const code = String(compileSync(titled_markdown, {
        outputFormat: 'function-body',
        jsxImportSource: 'solid-js',
        providerImportSource: 'solid-jsx',
    }))

    const Content = (runSync(code, jsx_runtime)).default;
    return Content;
}

export default Markdown;