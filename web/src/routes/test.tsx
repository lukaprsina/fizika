import { type VoidComponent } from "solid-js";
import { createRouteAction } from "solid-start";

const App: VoidComponent = () => {
    let my_ref: HTMLParagraphElement | undefined;

    const [, do_server_stuff] = createRouteAction<{ foo: number }, { bar: string }>(
        async (args) => {
            // args are void in typescript
            return { bar: "test " + args.foo.toString() }
        }
    );

    return <>
        <button
            onClick={async () => {
                if (!my_ref) throw new Error("No paragraph element")
                const result = await do_server_stuff({ foo: 9 })
                my_ref.innerHTML = result?.bar ?? "No result";
            }}
        >Click me</button>
        <p ref={my_ref} />
    </>
}

export default App;