import { createContext, createEffect, useContext, type ParentComponent, type VoidComponent } from "solid-js";

type ChildProps = {
    property: string;
}

const Context = createContext<{ get_func: (func: () => void) => void }>();
export function useParent() { return useContext(Context); }

const Child: VoidComponent<ChildProps> = (props) => {
    const parent_context = useParent();

    if (!parent_context) {
        throw "No context"
    }

    parent_context.get_func(() => {
        console.log(props.property)
    })

    return (
        <p>Child</p>
    )
}

const Parent: ParentComponent = (props) => {
    const funcs: (() => void)[] = [];

    createEffect(() => {
        for (const func of funcs) {
            func();
        }
    })

    return (
        <Context.Provider value={{
            get_func: (func) => {
                funcs.push(func);
            }
        }}>
            {props.children}
        </Context.Provider>
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