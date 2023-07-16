import { compileSync, runSync } from "@mdx-js/mdx"
import type { JSX, VoidComponent } from "solid-js";
import { Match, Switch, createEffect, getOwner, onMount, runWithOwner } from "solid-js";
import { createComponent, createSignal, Show } from "solid-js";
import * as jsx_runtime from 'solid-jsx'
import katex from "katex"
import remarkGfm from 'remark-gfm';
import "katex/dist/katex.min.css"

// TODO: async import
import { getType } from "mime-lite"

type MarkdownProps = {
    markdown?: string
};

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

const Markdown: VoidComponent<MarkdownProps> = (props) => {
    const [content, setContent] = createSignal<JSX.Element>();
    const owner = getOwner();

    createEffect(() => {
        if (!owner || typeof props.markdown != "string")
            return;

        try {
            const code = String(compileSync(props.markdown, {
                outputFormat: 'function-body',
                jsxImportSource: 'solid-js',
                providerImportSource: 'solid-jsx',
                remarkPlugins: [remarkGfm]
            }))

            const Content = (runSync(code, jsx_runtime)).default;
            runWithOwner(owner, () => {
                const component = createComponent(Content, {
                    components
                })

                setContent(component)
            })
        } catch (e) {
            console.warn("Erorororor", e)
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

export default Markdown;