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

const text = `Astronomija kot znanost se je razvila predvsem iz praktičnih razlogov. Ljudje so opazili, da se določeni pojavi na nebu pojavljajo periodično, kar pomeni, da se po določenem času ponovijo. Na osnovi višine Sonca na nebu podnevi in spreminjanja podobe nočnega neba so nastale prve meritve časa.

Stare civilizacije so opazovanje in položaje zvezd ter planetov uporabljale pri arkutekturi:

<Explain prompt="Egipščani">
## Dosežki egipščanskih astronomov

Egipčani so opazovali nebo in beležili položaje zvezd predvsem z namenom dobrega koledarja, nenavadnih dogodkov (npr. mrkov) pa niso zapisovali. Najbolj jih je zanimala zvezda Sirij, saj je, kadar jo je bilo moč videti na jutranjem nebu, napovedovala obdobje vsakoletnih poplav. Nenavadnih dogodkov (npr. mrkov) pa niso zapisovali. Okoli leta 1000 pr. n. št. so prvi sestavili zanesljive koledarje.
S položaji zvezd so si pomagali tudi pri gradnji piramid. Pri gradnji piramid v Gizi so si verjetno pomagali z navpično poravnavo 2 zvezd in pola (zelo točna poravnava, znotraj ločne minute). Zaradi precesije je bil tedaj severni pol daleč od Severnice, blizu zvezde Thuban, kar lahko omogoča tudi časovno datiranje piramid. Vendar pa sta para v tem primeru možna dva para zvezd: Megrez + Phehda ali Kocab + Mizar.
![Piramide v Gizi.](http://fizika.sc-nm.si/material-931-%20Astronomija/giza-piramide.PNG)
![Položaj zvezd ob gradnji piramid v Gizi.](http://fizika.sc-nm.si/material-931-%20Astronomija/giza-piramide-zvezde.PNG)
![Egipščanski koledar.](http://fizika.sc-nm.si/material-931-%20Astronomija/egipt-koledar.png)
</Explain>

<Explain prompt="Kitajci">
## Dosežki kitajskih astronomov

Kitajci so bili prvi, ki so zapisovali Sončeve mrke. Prvi je mrk 22. 10. 2137 pr.n.št. opisal Šu Čing, sledi mu Anali Luja (Konfucij). Skupaj so Kitajci zabeležili 34 Sončevih mrkov med 722 in 481 pr.n.št., od tega je 32 kronološko datiranih.

</Explain>

<Explain prompt="Babilonci">
## Dosežki babilonskih astronomov

Babilonci so zapisali vse Sončeve mrke po letu 747 pr. n. št., odkrili so tudi periodo Sarosa, ki je odločilna za napovedovanje Sončevih mrkov (medsebojni položaji Zemlje, Lune in Sonca se ponovijo po 18 letih, 10 dneh in 8 urah, torej bo vsakemu mrku čez 18 let sledil naslednji). Za ponovitev mrka na skoraj istem kraju na Zemlji je treba počakati tri Sarosove periode.

</Explain>

<Explain prompt="Maji">
## Dosežki starih majev

Maji so v Dresdenskem kodeksu opisali cikle Lune, vključno z napovedjo mrkov, in cikle Venere (za navidezno gibanje planeta, kot ga opazujemo z Zemlje).
</Explain>

- **Stari Grki** so bili prvi, ki so načrtno opazovali nebo. Opredelili so pojma zvezda in planet: za zvezde se zdi, da ostajajo v stalnih medsebojnih legah, zato so jih združili v ozvezdja, katerim so nadeli imena iz svoje mitologije; v nasprotju z zvezdami so planeti »popotniki«, ki se navidez gibljejo skozi ozvezdja.

<Explain prompt="Več o grških astronomih...">
## Dosežki starih Grkov

Na podlagi opazovanj so ugotovili:

- Zemlja je okrogla, ker ima Zemljina senca ob luninih mrkih okrogel obris (Aristotel, 330 pr.n.št.).
- 280-260 let pred našim štetjem je filozof Aristarh trdil, da se Zemlja giblje okoli Sonca in da za celotno pot potrebuje 365 dni, ostale zvezde pa so (neskončno) daleč stran. Žal ni imel dovolj tehtnih dokazov in somišljenikov, tako da so se Grki vrnili k ideji o osrednjem mestu Zemlje v vesolju.
- Eratosten (240 pr.n.št.) je določil razmerje med velikostjo Zemlje in Lune. Njegovi oceni obsega Zemlje znašata 39 690 km in 45 007 km (dejanski obseg Zemlje okrog Ekvatorja je približno 40 000 km). Skušal je uvesti leto z 365,25 dneva.
- Hiparh (150 pr.n.št.) je napisal katalog 1022 zvezd, razporejenih na 6 magnitud. Opisal je precesijo Zemlje in določil oddaljenost med Zemljo in Luno.
- Ptolomej(150 n.št.) uvede geocentrični sistem osončja.

![Lunin mrk.](http://fizika.sc-nm.si/material-931-%20Astronomija/lunin-mrk.PNG)
![Zemlja in planeti krožijo okoli Sonca.](http://fizika.sc-nm.si/material-931-%20Astronomija/aristotel1.png)
![Določitev obsega Zemlje.](http://fizika.sc-nm.si/material-931-%20Astronomija/eratosten1.gif)
![Precesijski cikel Zemlje.](http://fizika.sc-nm.si/material-931-%20Astronomija/hipah1.gif)
![Geocentrični sistem.](http://fizika.sc-nm.si/material-931-%20Astronomija/Ptolomej-sistem-Bartolomeu_Velho_1568.jpg)
</Explain>

- **Arabci** so predvsem nadgradili helenistična znanja: pospeševali so matematiko (arabske številke), kemijo (hoteli so izdelati snov, ki bi človeka naredila večno mladega), medicino in geografijo, razvili so tudi astronomijo. Med njihove največje prispevke k razvoju astonomije štejemo: astrolab, astronomske ure (med drugim tudi budilka), sekstant in kvadrant, optične instrumente (opazovalna cev, povečevalna leča, teleskop), kompas.

<Explain prompt="Več o prispevku arabskih astronomov...">
## Dosežki arabcev

Pomembna je zlasti večja točnost neteleskopskih meritev. Primer je od 1429-1449 delujoči observatorij Ulug Beg pri Samarkandu v današnjem Uzbekistanu.Tam so določili dolžino siderskega leta na 365 dni 5 h 49 min 15 s, kar je le za 25 sekund več od prave vrednosti. Naklon Zemljine osi so ocenili na 23,52°, kar je eksaktna vrednost.
![Astrolab.](http://fizika.sc-nm.si/material-931-%20Astronomija/arabski_astrolab.jpg)
![Astronomska ura.](http://fizika.sc-nm.si/material-931-%20Astronomija/astronomska ura.jpg)
![Navigacijski sekstanti.](http://fizika.sc-nm.si/material-931-%20Astronomija/sekstant.JPG)
![Kvadrant.](http://fizika.sc-nm.si/material-931-%20Astronomija/kvadrantbrahe.jpg)
![Kompas.](http://fizika.sc-nm.si/material-931-%20Astronomija/kompas.jpg)
</Explain>
`

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