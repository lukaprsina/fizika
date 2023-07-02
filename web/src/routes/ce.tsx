import type { ParentComponent, Accessor } from "solid-js";
import { createContext, createEffect, createSignal, useContext, type VoidComponent } from "solid-js"
import type { IdTable, SymbolDefinition } from "@cortex-js/compute-engine";
import { ComputeEngine } from "@cortex-js/compute-engine"
import { renderMathInElement } from "mathlive"
import "mathlive/static.css"

const ce = new ComputeEngine();

const MathContext = createContext<[Accessor<Variables>, { get_render_function: (func: () => void) => void }]>();

export function useMathSystem() { return useContext(MathContext); }

type Variables = Record<string, { low?: number, high?: number, exact?: number }>;

type SystemProps = {
    variables: Variables
};

const System: ParentComponent<SystemProps> = (props) => {
    const [variables, setVariables] = createSignal<Variables>({});
    const render_funcs: (() => void)[] = [];

    const system: [Accessor<Variables>, { get_render_function: (func: () => void) => void }] = [
        variables,
        {
            get_render_function: (func) => {
                render_funcs.push(func);
            }
        }
    ]

    createEffect(() => {
        if (render_funcs.length == 0) return;

        const scope: IdTable = {};
        const vars = variables()

        for (const variable in vars) {
            let value;

            if (vars.hasOwnProperty(variable)) {
                const constraints = vars[variable];

                if (typeof constraints["exact"] == "number") {
                    const exact = constraints["exact"]
                    value = exact;
                } else if (typeof constraints["low"] == "number" && typeof constraints["high"] == "number") {
                    const low = constraints["low"]
                    const high = constraints["high"]

                    const range = high - low + 1;
                    const random_number = Math.floor(Math.random() * range) + low;
                    value = random_number
                } else {
                    throw "Not enough constraints";
                }
            }

            if (typeof value == "number") {
                scope[variable] = value as SymbolDefinition
            }
        }

        ce.pushScope(scope);

        for (const render_func of render_funcs) {
            render_func()
        }

        setVariables(vars)
        ce.popScope();
    })

    return <MathContext.Provider value={system}>{props.children}</MathContext.Provider>
}

type EquationProps = {
    latex?: string;
    name?: string;
    full?: boolean;
    calculate?: boolean;
};

const Equation: VoidComponent<EquationProps> = (props) => {
    const system = useMathSystem();
    let elem: HTMLSpanElement;

    if (!system) {
        throw "Math system doesn't exist"
    }

    const [variables, { get_render_function }] = system;

    const render = (latex: string) => {
        // katex.render(latex, elem, { displayMode: props.full })
        // ** Default **: `{display: [ ['$$', '$$'], ['\\[', '\\]'] ] ], inline: [ ['\\(','\\)'] ] ]}`
        if (props.full)
            elem.innerHTML = `\$\$${latex}\$\$`;
        else
            elem.innerHTML = `\\begin{math}${latex}\\end{math}`;

        renderMathInElement(elem)
    }

    createEffect(() => {
        console.log(props.latex, props.calculate)

        const a = () => {
            if (!props.latex) return;

            if (!props.calculate) {
                render(props.latex)
                return;
            }

            const expression = ce.parse(props.latex);
            const solved = expression.evaluate();
            render(solved.latex)
        };

        get_render_function(a)
    })

    return (
        <span ref={elem} />
    )
}

// TODO: names and move variable calculation to the System
const MathDemo: VoidComponent = () => {
    return <>
        <System variables={
            {
                "r": { exact: 100 },
                "F": { low: 150, high: 160 }
            }
        }>
            <p>
                <Equation latex="r" />
                {' '}is{' '}
                <Equation latex="r" calculate />,{' '}
                <Equation latex="F" />
                {' '}is{' '}
                <Equation latex="F" calculate />,{' '}
                <Equation latex="r+F" />
                {' '}is{' '}
                <Equation latex="r+F" calculate />
            </p>
        </System >
        <System variables={
            {
                "r": { exact: 200 },
                "F": { low: 250, high: 260 }
            }
        }>
            <p>
                <Equation latex="\frac{\pi}{2}" full />
            </p>
        </System>
    </>
}

export default MathDemo