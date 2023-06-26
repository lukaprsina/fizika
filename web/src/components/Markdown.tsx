import { compileSync, runSync } from "@mdx-js/mdx"
import type { JSX, VoidComponent } from "solid-js";
import { Match, Switch, createEffect, getOwner, runWithOwner } from "solid-js";
import { createComponent, createSignal, Show } from "solid-js";
import * as jsx_runtime from 'solid-jsx'

// TODO: async import
import { getType } from "mime-lite"

type MarkdownProps = {
    markdown?: string
};

const text = `Posnetki:
- [radijski teleskop 1](https://youtu.be/a_7SBglFfik)

- [radijski teleskop 2](https://youtu.be/m1Pg4_5k_9s)

- [Hubblov teleskop](https://youtu.be/ygevBQWt_LE)

Astronomijo v 20. stoletju zaznamujejo:
- Nadaljnji razvoj teleskopov (npr. radijski in IR teleskopi) in astronomskih observatorijev.
- Razumevanje zgradbe zvezd: zvezde so v glavnem iz vodika in deloma helija. Svetijo zaradi jedrskega zlivanja (zlasti vodika) v njihovih sredicah. Njihova starost lahko doseže več miljard let (Sonce je staro 4,7 milijarde).
- Meritve fizikalnih količin zvezd: površinske temperature, kemične sestave, sija, mase, vrtenja, hitrosti gibanja, oddaljenosti.
- Razumevanje zgradbe in starosti vesolja (Einstanova posebna in splošna teorija relativnosti, Hubblov zakon): vesolje je imelo svoj začetek pred 13,7 milijardami let.
- Vesoljski programi ([NASA](https://www.nasa.gov/)
,[ESA](https://www.esa.int/)
), teleskopi v vesoju ([Hubblov vesoljski teleskop](http://hubblesite.org/the_telescope/)
), raziskovanje osončja s sondami (npr. Pioneer, Voyager).Vesoljski teleskopi (ESA)Pogled v preteklost (Hubble)Astronomija je v 21. stoletju usmerjena v:
- odkrivanje planetov okoli drugih zvezd (eksoplaneti), zlasti Zemlji podobnih planetov
- odkrivanje sestave vesolja
- raziskovanje objektov v Osončju (planetov in njihovih naravnih satelitov, asteroidov, kometov,...)
- odkrivanje in raziskovanje bjektov globokega neba (galaksije, meglice, kopice,..)Raziskovanje heliosfere`

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