import { createContextProvider } from "@solid-primitives/context";
import { createEventBus } from "@solid-primitives/event-bus";
import { Checkbox } from "@suid/material";
import { useDrag } from "solid-gesture";
import type { JSX, ParentComponent, Setter, VoidComponent } from "solid-js";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { animated, createSpring } from "solid-spring";

const App: VoidComponent = () => {
    return (
        <div class="w-screen h-screen flex justify-center">
            <div class="w-1/2  h-full">
                <ListGroup>
                    <For each={"abc".split("")}>{(letter) => {
                        const [items, setItems] = createSignal<ListItemProps[]>([])

                        createEffect(() => {
                            const my_items: ListItemProps[] = [...Array(5).keys()].map((num) => ({
                                id: num,
                                component: (
                                    <span>{letter}{num}</span>
                                )
                            }))

                            setItems(() => my_items)
                        })

                        return (
                            <div class="my-16">
                                <List
                                    items={items()}
                                    selectable
                                    name={letter}
                                />
                            </div>
                        )
                    }}</For>
                </ListGroup>
            </div>
        </div>
    )
}

type InputEventBusType = {
    name: string;
    bounds_top: number | undefined;
    bounds_bottom: number | undefined;
};


type ListItemProps = {
    id: number;
    component: JSX.Element;
}

type ListProps = {
    items: ListItemProps[];
    selectable?: boolean;
    name: string;
}

type ListItemState = "dragged" | "retreating" | "stationary"

type SelectedItemInfoType = {
    x: number;
    y: number;
    listName: string;
    itemId: number;
    numberOfSelected: number;
    mouseX: number;
    mouseY: number;
    last: boolean;
};

const [selectedItemInfo, setSelectedItemInfo] = createSignal<SelectedItemInfoType>()

const [ListGroup, useListGroup] = createContextProvider(() => {
    const input_bus = createEventBus<InputEventBusType>();
    return { input_bus }
})

const List: VoidComponent<ListProps> = (props) => {
    let element: HTMLDivElement | undefined;
    const [itemsState, setItemsState] = createSignal<ListItemState>("stationary");
    const [selectedIds, setSelectedIds] = createStore<boolean[]>([]);
    const numberOfSelected = createMemo(() => {
        let count = 0;

        for (const id of selectedIds) {
            if (id) count++;
        }

        return count;
    })

    return (
        <div
            class="w-full flex flex-wrap justify-start"
            ref={element}
        >
            <For each={props.items}>{(item) => (
                <ListItem
                    listName={props.name}
                    id={item.id}
                    selectable={props.selectable}
                    checked={selectedIds[item.id]}
                    setChecked={(tab) => setSelectedIds([item.id], tab)}
                    itemsState={itemsState()}
                    setItemsState={setItemsState}
                    numberOfSelected={numberOfSelected()}
                >
                    {item.component}
                </ListItem>
            )}</For>
        </div>
    )
}

type ListItemType = {
    listName: string;
    id: number;
    selectable?: boolean;
    checked?: boolean;
    itemsState: ListItemState;
    numberOfSelected: number
    setItemsState: Setter<ListItemState>;
    setChecked: (value: boolean) => void;
}

const ListItem: ParentComponent<ListItemType> = (props) => {
    const [coords, setCoords] = createSignal({
        x: 0,
        y: 0
    })

    const bind = useDrag((state) => {
        let newX = 0;
        let newY = 0;

        if (props.checked) {
            if (state.down) {
                newX = state.movement[0]
                newY = state.movement[1]
                props.setItemsState("dragged")
            }
        }

        setSelectedItemInfo(() => ({
            x: newX,
            y: newY,
            listName: props.listName,
            itemId: props.id,
            last: state.last,
            numberOfSelected: props.numberOfSelected,
            mouseX: state.event.clientX,
            mouseY: state.event.clientY,
        }))
    })

    const zIndex = createMemo(() => {
        if (!props.checked) return 1;

        if (props.itemsState == "dragged")
            return 3;
        else if (props.itemsState == "retreating")
            return 2;
        else if (props.itemsState == "stationary")
            return 1;
    })

    const style = createSpring(() => {
        return {
            to: {
                x: coords().x,
                y: coords().y,
                zIndex: zIndex(),
                width: 128,
                height: 128,
            },
        }
    })

    createEffect(() => {
        const info = selectedItemInfo()
        if (!info) return;

        if (props.checked && info.listName == props.listName) {
            setCoords(() => ({
                x: info.x,
                y: info.y,
            }))
        }
    })

    return (
        <AnimatedDiv
            style={style()}
            {...bind()}
            class="animated-div select-none touch-none bg-slate-300 rounded-md m-2 py-2 flex items-center relative"
            tabIndex={-1} >
            <Show when={props.selectable}>
                <Checkbox
                    checked={props.checked}
                    onChange={(_, checked) => {
                        props.setChecked(checked)
                    }}
                />
            </Show>
            {props.children}
        </AnimatedDiv>
    )
}


const AnimatedDiv = animated("div")

export default App;