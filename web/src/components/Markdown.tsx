import { compileSync, runSync } from "@mdx-js/mdx"
import type { JSX, VoidComponent } from "solid-js";
import { Match, Switch, createEffect, getOwner, onMount, runWithOwner } from "solid-js";
import { createComponent, createSignal, Show } from "solid-js";
import * as jsx_runtime from 'solid-jsx'
import katex from "katex"
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
            ref={katex_ref} />
    }
}

const text = `Izdelujemo prenosno omrežje za moči <Equation latex="P=? \,{ MW}"/> pri napetosti <Equation latex="U_{s1}=? \,{ kV}"/> . Generator ima vezja narejena za napetosti <Equation latex="U_g=? \,{ kV}"/> . Upor posameznega vodnikov med transformatorjema znaša <Equation latex="R_&#123;vod&#125;=? \,{ }\Omega"/> .

![](/gradivo/d54b335a-cffd-4c0b-8172-15518ca7da7b/images/prenosPRESTAVNA.png)

Transformator 1 ima izkoristek <Equation latex="M_1=? \,{ \%}"/> .

- Kolikšno je razmerje navoje v transformatorju 1 <Equation latex="N_{p1}:N_{s2}"/> ?

<Explain prompt="Postopek reševanja">
Postopek reševanja

Za napetosti na navitjih transformatorja velja povezav s številom navojev

<Equation full latex="\frac{U_{p1}}{U_{s1}}=\frac{N_{p1}}{N_{s1}}"/>

[Zapri](#)
</Explain>

[<span class="fwb-state fwb-state-0">REŠITEV</span>
<span class="fwb-state fwb-state-1">Skrij</span>](#6379517bc24d52ea8ae69b0c2ed264a5) **REŠITEV:** Razmerje navoje znaša za transformator 1 <Equation latex="N_{p1}:N_{s1}=3:100"/> .

- Za kolikšno moč <Equation latex="P_2"/> mora biti narejen transformator 2?

<Explain prompt="Postopek reševanja">
Postopek reševanja

Po sekundarnem navitju teče tok

<Equation full latex="I_{s1}=\frac{P \cdot M_1}{U_{s1}}"/>

Na vodnikih se zato izgublja moč

<Equation full latex="P_&#123;vod&#125;=2 \cdot R_&#123;vod&#125; \cdot I_{s1}^2"/>

Tako do transformatorja 2 pride moč

<Equation full latex="P_2=P-P_&#123;vod&#125;"/>

[Zapri](#)
</Explain>

[<span class="fwb-state fwb-state-0">REŠITEV</span>
<span class="fwb-state fwb-state-1">Skrij</span>](#06ba31f0af9a8182d806b78c4c2ef205) **REŠITEV:** Moč, ki pride do drugega transformatojra znaša <Equation latex="P_2=? \,{ MW}"/> - Kolišna je napetost <Equation latex="U_{p2}"/> na sponkah primarja transformatojra 2?

<Explain prompt="Postopek reševanja">
Postopek reševanja

Napetost na sponkah primarja transformatorja 2 <Equation latex="U_{p2}"/> je manjša za padec napetosti na vodnikih U_&#123;vod&#125; glede na napetost na sekundarju transformatojra 1 <Equation latex="U_{s1}"/> <Equation full latex="U_{p2}=U_{s1}-U_&#123;vod&#125;=U_{s1}-2 \cdot I_{s1} \cdot R_&#123;vod&#125;"/>

[Zapri](#)
</Explain>

[<span class="fwb-state fwb-state-0">REŠITEV</span>
<span class="fwb-state fwb-state-1">Skrij</span>](#41bc5738c0b2d0a51d3cf34e0d06230e) **REŠITEV:** Napetost na primarju drugega transformatojra znaša <Equation latex="U_{p2}=? \,{ kV}"/> .

- Kolikšno mora biti razmerje navojem transformatorja 2 <Equation latex="N_{p2}:N_{s2}"/> , da bo napetost na sekundarju imela vrednost <Equation latex="U_{s2}=? \,{ V}"/> ?

<Explain prompt="Postopek reševanja">
Postopek reševanja

Za napetosti na navitjih transformatorja velja povezav s številom navojev

<Equation full latex="\frac{U_{p2}}{U_{s2}}=\frac{N_{p2}}{N_{s2}}"/>

[Zapri](#)
</Explain>

[<span class="fwb-state fwb-state-0">REŠITEV</span>
<span class="fwb-state fwb-state-1">Skrij</span>](#b850a15a3905660a3213078b5217353f) **REŠITEV:** Razmerje navojev mora biti <Equation latex="N_{p2}:N_{s2}=?"/> .
`

const Markdown: VoidComponent<MarkdownProps> = (props) => {
    const [content, setContent] = createSignal<JSX.Element>();
    const owner = getOwner();

    createEffect(() => {
        if (!owner || !props.markdown)
            return;

        console.log(props.markdown)

        const code = String(compileSync(text/* props.markdown */, {
            outputFormat: 'function-body',
            jsxImportSource: 'solid-js',
            providerImportSource: 'solid-jsx',
        }))

        const Content = (runSync(code, jsx_runtime)).default;
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