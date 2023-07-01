import { createEffect, onMount, type VoidComponent } from "solid-js"
import { ComputeEngine } from "@cortex-js/compute-engine"

const ce = new ComputeEngine();

const Math: VoidComponent = () => {
    let elem: HTMLDivElement;

    createEffect(() => {
        ce.pushScope({
            r: 1000,
            F: 200,
        });

        const expr = ce.parse("r+F");
        elem.innerHTML = expr.evaluate().numericValue;
    })

    return <div ref={elem} />
}

export default Math