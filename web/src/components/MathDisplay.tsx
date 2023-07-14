import type { ParentComponent, Accessor } from "solid-js";
import { createContext, createEffect, createSignal, useContext, type VoidComponent } from "solid-js"
import type { IdTable, SymbolDefinition } from "@cortex-js/compute-engine";
import { ComputeEngine } from "@cortex-js/compute-engine"
import { renderMathInElement } from "mathlive"
import { createStore } from "solid-js/store";
import "mathlive/static.css"

// use @solid-primitives/context
export const compute_engine = new ComputeEngine();
type RenderFuncType = () => void;

const MathContext = createContext<[Accessor<Variables>, {
    add: (id: number, func: RenderFuncType) => void,
    edit_or_add: (id: number, func: RenderFuncType) => void,
}]>();
export function useMathSystem() { return useContext(MathContext); }

export type Variables = Record<string, { low?: number, high?: number, exact?: number }>;

export type SystemProps = {
    variables: Variables
};

export const System: ParentComponent<SystemProps> = (props) => {
    const [variables, setVariables] = createSignal<Variables>({});
    const [renderFuncs, setRenderFuncs] = createStore<{ render_func: RenderFuncType, id: number }[]>([]);

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
            if (!render_func) {
                continue;
            }
            render_func()
        }

        setVariables(vars)
        compute_engine.popScope();
    })

    return <MathContext.Provider value={[
        variables,
        {
            add(id: number, render_func: RenderFuncType) {
                setRenderFuncs([...renderFuncs, { render_func, id }])
            },
            edit_or_add: (id: number, render_func: RenderFuncType) => {
                for (const func of renderFuncs) {
                    if (func.id == id) {
                        setRenderFuncs(todo => todo.id == id, "render_func", () => render_func)
                        return;
                    }
                }

                setRenderFuncs([...renderFuncs, { render_func, id }])
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

let sequential = 0;
export const Equation: VoidComponent<EquationProps> = (props) => {
    const system = useMathSystem();
    if (!system) throw new Error("Math system doesn't exist")
    let math_element: HTMLSpanElement;
    // const [elem, setElem] = createSignal<HTMLSpanElement>();

    const original_index = sequential;
    sequential++;

    const [variables, { edit_or_add }] = system;

    createEffect(() => {
        const render = (latex: string) => {
            // ** Default **: `{display: [ ['$$', '$$'], ['\\[', '\\]'] ] ], inline: [ ['\\(','\\)'] ] ]}`            
            if (props.full)
                math_element.innerHTML = `\$\$${latex}\$\$`;
            else
                math_element.innerHTML = `\\begin{math}${latex}\\end{math}`;

            renderMathInElement(math_element)
        }

        const render_func = () => {
            if (props.latex) {
                if (props.calculate) {
                    const expression = compute_engine.parse(props.latex);
                    const solved = expression.evaluate();
                    render(solved.latex)
                } else {
                    render(props.latex)
                    return;
                }
            } else {
                if (!props.name) return;

                if (props.calculate) {
                    for (const variable in variables()) {
                        if (variable == props.name) {
                            // found the value to display
                            const value = variables()[variable].exact;
                            if (value)
                                render(value.toString());
                        }
                    }
                } else {
                    throw new Error("No latex, no calculate, but name")
                }
            }
        };

        edit_or_add(original_index, render_func);
    })

    return (
        <span ref={math_element} />
    )
}