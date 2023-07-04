import { useContext, type ParentComponent, type VoidComponent, createContext, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";

type SomeType = {
    prop: number;
}

const Context = createContext<[
    { data: SomeType, id: number }[],
    {
        add: (id: number, data: SomeType) => void,
        edit: (id: number, data: SomeType) => void,
        delete: (id: number) => void
    }

]>();
export function useParent() { return useContext(Context); }

const Parent: ParentComponent = (props) => {
    // the store is dependant on children
    // it doesn't update them
    const [allData, setAllData] = createStore<{ data: SomeType, id: number }[]>([]);

    // this works if you need context
    // otherwise an array is better, because you can
    // add and remove

    return (
        <Context.Provider
            value={[
                allData,
                {
                    add(id: number, data: SomeType) {
                        setAllData([...allData, { id, data }]);
                    },
                    edit(id: number, data: SomeType) {
                        setAllData(todo => todo.id == id, "data", data)
                    },
                    delete(id: number) {
                        setAllData(produce((data) => {
                            const index = data.findIndex(item => item.id == id)
                            if (index !== -1) {
                                data.splice(index, 1);
                            }
                        }));
                    }
                }
            ]}
        >
            {props.children}
            <button
                onClick={() => {
                    console.info("parent")
                    for (const data of allData) {
                        console.log(data, data.data.prop)
                    }
                    console.info("parent done")
                }}
            >See store</button>
        </Context.Provider >
    )
}

let sequential = 0;
const Child: VoidComponent = () => {
    const [data, setData] = createSignal<SomeType>()

    /* const owner = getOwner();
    if (!owner) throw new Error("No owner"); */

    const parent_context = useParent();
    if (!parent_context) throw new Error("No context");

    const [, funcs] = parent_context;
    const original_index = sequential;
    const new_data = { prop: original_index };
    funcs.add(original_index, new_data);
    setData(new_data)
    sequential++;

    return (
        <div>
            <span>{data()?.prop}</span>{' '}
            <button
                onClick={() => {
                    const original = data();
                    if (!original) throw new Error("No data");

                    const new_prop = original.prop + 1;
                    const new_data = { prop: new_prop };

                    console.log("Changing data", data(), new_data)
                    setData(new_data)
                    funcs.edit(original_index, new_data)
                }}
            >
                Edit
            </button>{' '}
            <button
                onClick={() => {
                    funcs.delete(original_index)
                }}
            >
                Delete
            </button>
        </div >
    )
}

const App: VoidComponent = () => {
    return <>
        <Parent>
            <Child />
            <Child />
            <Child />
        </Parent>
        <br />
        <button>Add child</button>
    </>
}

export default App