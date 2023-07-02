import { createContext, createEffect, useContext, type ParentComponent, type VoidComponent, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

type ChildProps = {
    property: string;
}

const Context = createContext<{ addFunc: (func: FuncType) => void }>();
export function useParent() { return useContext(Context); }

const Child: VoidComponent<ChildProps> = (props) => {
    const parent_context = useParent();
    let did_the_thing = false;
    const [func, setFunc] = createSignal<FuncType>()
    const [counter, setCounter] = createSignal(0)

    if (!parent_context) {
        throw "No context"
    }

    createEffect(() => {
        const a = () => {
            console.log("reactive?", counter())
        };

        setFunc({ func: a })
    })

    createEffect(() => {
        const a = func();
        if (!did_the_thing && a) {
            console.log("adding a func")
            parent_context.addFunc(a)
        }

        did_the_thing = true;
    })

    return (
        <button
            onClick={() => setCounter((v) => v + 1)}
        >Child {counter()}</button>
    )
}

type FuncType = {
    func: () => void;
    // id: number
};

const Parent: ParentComponent = (props) => {
    const [funcs, setFuncs] = createStore<FuncType[]>([]);

    createEffect(() => {
        console.warn("Calling everyone", funcs)
        for (const { func } of funcs) {
            console.warn("Calling one func")
            func();
        }
    })

    return (
        <Context.Provider value={{
            /* addFuncIfNotAdded: ({ func, id }: FuncType) => {
                for (const myFunc of funcs) {
                    if (myFunc.id == id) return;
                }

                setFuncs([...funcs, { func, id }])
            } */
            addFunc: (func: FuncType) => {
                setFuncs([...funcs, func])
            }
        }}>
            {props.children}
        </Context.Provider >
    )
}

const App = () => {
    return (
        <Parent>
            <Child property="test" />
        </Parent>
    )
}

export default App;