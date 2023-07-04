import type { Owner } from "solid-js";
import { useContext, type ParentComponent, type VoidComponent, createContext, createSignal, getOwner, createEffect } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { createStore } from "solid-js/store";

type SomeType = {
    prop: number;
}

const Context = createContext<{
    getAllData: () => { data: SomeType, id: Owner }[],
    setAllData: SetStoreFunction<{
        data: SomeType;
        id: Owner;
    }[]>
    /* {
        add: (id: Owner, data: SomeType) => void,
        edit: (id: Owner, data: SomeType) => void,
        delete: (id: Owner) => void
    } */
}>();
export function useParent() { return useContext(Context); }

const Parent: ParentComponent = (props) => {
    const [allData, setAllData] = createStore<{ data: SomeType, id: Owner }[]>([]);

    createEffect(() => {
        console.info("parent")
        for (const data of allData) {
            console.log(data.data.prop)
        }
        console.info("parent done")
    })

    return (
        <Context.Provider
            value={{
                getAllData() { return allData },
                setAllData
                /* {
                    add(id: Owner, data: SomeType) {
                        setAllData([...allData, { id, data }]);
                    },
                    edit(id: Owner, data: SomeType) {
                        setAllData(todo => todo.id == id, "data", data)
                    },
                    delete(id: Owner) {
                        setAllData(produce((data) => {
                            const index = data.findIndex(item => item.id === id);
                            if (index !== -1) {
                                data.splice(index, 1);
                            }
                        }));
                    }
                } */
            }}
        >
            {props.children}
        </Context.Provider >
    )
}

const Child: VoidComponent = () => {
    const [data, setData] = createSignal<SomeType>()

    const owner = getOwner();
    if (!owner) throw new Error("No owner");

    const parent_context = useParent();
    if (!parent_context) throw new Error("No context");

    const { getAllData, setAllData } = parent_context;

    const new_data = { prop: 0 };
    setAllData([...getAllData(), { id: owner, data: new_data }]);

    createEffect(() => {
        // TODO: maybe more efficient by parent calling child directly
        console.info("child")
        for (const parent_data of getAllData()) {
            if (parent_data.id == owner) {
                setData(parent_data.data);
            }
        }
        console.info("child done")
    })

    return (
        <div>
            <span>{data()?.prop}</span>{' '}
            <button
                onClick={() => {
                    const original = data();
                    if (!original) throw new Error("No data");

                    const new_prop = original.prop + 1;
                    // parent_context[1].edit(owner, { prop: new_prop })
                }}
            >
                Edit
            </button>{' '}
            <button
                onClick={() => {
                    // parent_context[1].delete(owner)
                }}
            >
                Delete
            </button>
        </div>
    )
}

const App: VoidComponent = () => {
    return <>
        <Parent>
            <Child />
            <Child />
            <Child />
        </Parent>
        <button>Add child</button>
    </>
}

export default App