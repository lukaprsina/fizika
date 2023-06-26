import { compileSync, runSync } from "@mdx-js/mdx"
import type { JSX, VoidComponent } from "solid-js";
import { Match, Switch, createEffect, getOwner, runWithOwner } from "solid-js";
import { createComponent, createSignal, Show } from "solid-js";
import * as jsx_runtime from 'solid-jsx'

// TODO: async import
import { getType } from "mime-lite"
import { Button } from "solid-headless";

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
        const [hidden, setHidden] = createSignal(true)
        return <>
            <button onClick={() => setHidden(!hidden())}>
                {props.prompt}
            </button>
            <Show when={!hidden()}>{props.children}</Show>
        </>
    }
}

const Markdown: VoidComponent<MarkdownProps> = (props) => {
    const [content, setContent] = createSignal<JSX.Element>();
    const owner = getOwner();

    createEffect(() => {
        if (!owner || !props.markdown)
            return;

        console.log(props.markdown)

        const code = String(compileSync(props.markdown, {
            outputFormat: 'function-body',
            jsxImportSource: 'solid-js',
            providerImportSource: 'solid-jsx',
        }))

        const Content = (runSync(code, jsx_runtime)).default;
        // setContent(Content)
        runWithOwner(owner, () => {
            const component = createComponent(Content, {
                components
            })

            setContent(component)
        })

    })

    return <Show when={content}>
        <div>
            {content()}
        </div>
    </Show>
}

export default Markdown;