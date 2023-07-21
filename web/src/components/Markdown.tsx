import { compileSync, runSync } from "@mdx-js/mdx"
import type { Component, JSX, VoidComponent } from "solid-js";
import { Match, Switch, createEffect, getOwner, onMount, runWithOwner } from "solid-js";
import { createComponent, createSignal, Show } from "solid-js";
import * as jsx_runtime from 'solid-jsx'
import katex from "katex"
import remarkGfm from 'remark-gfm';
import "katex/dist/katex.min.css"

// TODO: async import
import { getType } from "mime-lite"

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
};

type PageType = Component<{
    components: typeof components;
}>;

// TODO: use cache in page, so no need to load
const page_cache: Record<number, PageType | undefined> = {}

const Markdown: VoidComponent<MarkdownProps> = (props) => {
    const [content, setContent] = createSignal<JSX.Element>();
    const owner = getOwner();

    const setPage = (element: PageType) => runWithOwner(owner, () => {
        const component = createComponent(element, {
            components
        })

        setContent(() => component)
    })

    createEffect(() => {
        if (!owner) return;
        if (typeof props.current?.markdown != "string") return;

        const cached = page_cache[props.current.id];
        if (cached) {
            console.info("Using cache", props.current.id)
            setPage(cached)
        } else {
            try {
                const element = compileMarkdown(props.current.markdown, props.current.title ?? undefined)
                page_cache[props.current.id] = element

                setPage(element)
            } catch (e) {
                console.warn("MDX Compile error", e)
            }
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
                    page_cache[markdown.id] = element
                    console.info("Preloading", markdown.id)
                } catch (e) {
                    console.warn("MDX Compile error", e)
                }
            }
        }
    })

    return (
        <Show when={content}>
            <div class="prose">
                {content()}
            </div>
        </Show >
    )
}

function compileMarkdown(markdown: string, title: string | undefined): PageType {
    let titled_markdown = markdown;
    if (title) titled_markdown = `# ${title}\n\n${titled_markdown}`
    const code = String(compileSync(titled_markdown, {
        outputFormat: 'function-body',
        jsxImportSource: 'solid-js',
        providerImportSource: 'solid-jsx',
        remarkPlugins: [remarkGfm]
    }))

    const Content = (runSync(code, jsx_runtime)).default;
    return Content;
}

const components = {
    img: (props: { src: string, alt: string }) => {
        const [mimeType, setMimeType] = createSignal("");

        createEffect(() => {
            setMimeType(getType(props.src))
        });

        return <Switch fallback={<p>{props.alt}</p>}>
            <Match when={mimeType().startsWith("image")}>
                <figure>
                    <img src={props.src} alt={props.alt} />
                    <figcaption>{props.alt}</figcaption>
                </figure>
            </Match>
            <Match when={mimeType().startsWith("video")}>
                <figure>
                    <video>
                        <source src={props.src} />
                    </video>
                    <figcaption>{props.alt}</figcaption>
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
    },
}


export default Markdown;