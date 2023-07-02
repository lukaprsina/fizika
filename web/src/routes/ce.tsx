import type { ParentComponent } from "solid-js";
import { Accessor, createContext, createEffect, createSignal, Match, Switch, useContext, type VoidComponent } from "solid-js"
import { ComputeEngine, IdTable, SymbolDefinition } from "@cortex-js/compute-engine"

const ce = new ComputeEngine();

const MathContext = createContext<Accessor<Variables>>();

export function useMathSystem() { return useContext(MathContext); }

type Variables = Record<string, { low?: number, high?: number, exact?: number }>;

type SystemProps = {
    variables: Variables
};

const System: ParentComponent<SystemProps> = (props) => {
    const [variables, setVariables] = createSignal<Variables>({});

    createEffect(() => setVariables(props.variables))

    return <MathContext.Provider value={variables}>{props.children}</MathContext.Provider>
}

type EquationProps = {
    latex?: string;
    name?: string;
    calculate?: boolean;
};

const Equation: VoidComponent<EquationProps> = (props) => {
    const system = useMathSystem();

    if (!system) {
        throw "Math system doesn't exist"
    }

    createEffect(() => {
        const scope: IdTable = {};

        for (const variable in system()) {
            let value;

            if (system().hasOwnProperty(variable)) {
                const constraints = system()[variable];

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
                scope[variable] = ce.parse(`${value}`);
            }
        }

        ce.pushScope(scope);
    })

    return (
        <Switch>
            <Match
                when={props.calculate && props.latex}
            >
                <p>Calculate {props.latex}</p>
            </Match>
            <Match
                when={!props.calculate}
            >
                <p>Show {props.latex}</p>
            </Match>
        </Switch>
    )
}

const MathDemo: VoidComponent = () => {
    /* createEffect(() => {
        ce.pushScope({
            r: 1000,
            F: 200,
        });

        const expr = ce.parse("r+F");
        const expr2 = ce.parse(`2*${expr.evaluate().numericValue}`)
        // console.log(expr2.evaluate().numericValue)
    }) */

    return <>
        <System variables={
            {
                "r": { exact: 100 },
                "F": { low: 150, high: 160 }
            }
        }>
            <Equation latex="r+F" />
            is
            <Equation latex="r+F" calculate />
        </System >
        <System variables={
            {
                "r": { exact: 200 },
                "F": { low: 250, high: 260 }
            }
        }>
            <Equation latex="r+F" />
        </System>
    </>
}

export default MathDemo