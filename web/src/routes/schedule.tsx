import { createScheduled, debounce, leading } from "@solid-primitives/scheduled";
import { createMemo, createSignal } from "solid-js";


const App = () => {
    const scheduled = createScheduled(fn => leading(debounce, fn, 1000));

    const [count, setCount] = createSignal(0);

    // or with createMemo
    const debouncedCount = createMemo((p: number = 0) => {
        // track source signal
        const value = count();
        // track the debounced signal and check if it's dirty
        return scheduled() ? value : p;
    });

    return <>
        <h1>{debouncedCount()}</h1>
        <button onClick={() => setCount(count() + 1)}>Click</button>
    </>
}

export default App;