import type { ParentComponent, Accessor } from "solid-js";
import { createContext, createEffect, createSignal, useContext, type VoidComponent } from "solid-js"
import type { IdTable, SymbolDefinition } from "@cortex-js/compute-engine";
import { ComputeEngine } from "@cortex-js/compute-engine"
import { renderMathInElement } from "mathlive"
import { createStore } from "solid-js/store";
import "mathlive/static.css"

export const compute_engine = new ComputeEngine();
type RenderFuncType = {
    render_func: () => void;
}

const MathContext = createContext<[Accessor<Variables>, { add_render_function: (func: RenderFuncType) => void }]>();
export function useMathSystem() { return useContext(MathContext); }

export type Variables = Record<string, { low?: number, high?: number, exact?: number }>;

export type SystemProps = {
    variables: Variables
};

export const System: ParentComponent<SystemProps> = (props) => {
    const [variables, setVariables] = createSignal<Variables>({});
    const [renderFuncs, setRenderFuncs] = createStore<RenderFuncType[]>([]);

    createEffect(() => {
        if (Object.keys(variables()).length == 0) {
            setVariables(props.variables)
            return;
        }

        if (renderFuncs.length == 0) return;

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

        compute_engine.pushScope(scope);
        for (const { render_func } of renderFuncs) {
            render_func()
        }

        setVariables(vars)
        compute_engine.popScope();
    })

    return <MathContext.Provider value={[
        variables,
        {
            add_render_function: (func: RenderFuncType) => {
                setRenderFuncs([...renderFuncs, func])
            }
        }
    ]}>{props.children}</MathContext.Provider>
}

type EquationProps = {
    latex?: string;
    name?: string;
    full?: boolean;
    calculate?: boolean;
};

export const Equation: VoidComponent<EquationProps> = (props) => {
    const system = useMathSystem();
    const [renderFunction, setRenderFunction] = createSignal<RenderFuncType>()
    const [elem, setElem] = createSignal<HTMLSpanElement>();
    let added_render_function = false;

    if (!system) {
        throw "Math system doesn't exist"
    }

    const [, { add_render_function: add_render_function }] = system;

    createEffect(() => {
        const render = (latex: string) => {
            const math_element = elem();
            if (!math_element) return;
            // katex.render(latex, elem, { displayMode: props.full })
            // ** Default **: `{display: [ ['$$', '$$'], ['\\[', '\\]'] ] ], inline: [ ['\\(','\\)'] ] ]}`
            if (props.full)
                math_element.innerHTML = `\$\$${latex}\$\$`;
            else
                math_element.innerHTML = `\\begin{math}${latex}\\end{math}`;

            renderMathInElement(math_element)
        }

        const a = () => {
            if (!props.latex) return;

            if (!props.calculate) {
                render(props.latex)
                return;
            }

            const expression = compute_engine.parse(props.latex);
            const solved = expression.evaluate();
            render(solved.latex)
        };

        setRenderFunction({ render_func: a });
    })

    createEffect(() => {
        const a = renderFunction();

        if (!added_render_function && a) {
            add_render_function(a);
        }

        added_render_function = true;
    })

    return (
        <span ref={setElem} />
    )
}