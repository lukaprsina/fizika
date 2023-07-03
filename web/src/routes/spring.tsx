import type { VoidComponent } from "solid-js";
import { animated, config, createSprings } from "solid-spring";
import { DragGesture } from "@use-gesture/vanilla";
import { For, onMount } from "solid-js";
import swap from "lodash-move";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const fn = (
    order: number[],
    active = false,
    originalIndex = 0,
    curIndex = 0,
    y = 0
) => (index: number) =>
        active && index === originalIndex
            ? {
                y: curIndex * 100 + y,
                scale: 1.1,
                zIndex: 1,
                shadow: 15,
                immediate: (key: string) => key === "zIndex",
                config: (key: string) => (key === "y" ? config.stiff : config.default)
            }
            : {
                y: order.indexOf(index) * 100,
                scale: 1,
                zIndex: 0,
                shadow: 1,
                immediate: false
            };

const DraggableList = (props: { items: string[] }) => {
    let order = props.items.map((_, index) => index); // Store indicies as a local ref, this represents the item order
    const divs: HTMLDivElement[] = [];

    const styles = createSprings(props.items.length, fn(order)); // Create springs, each corresponds to an item, controlling its transform, scale, etc.

    onMount(() => {
        divs.forEach((div, originalIndex) => {
            new DragGesture(div, ({ active, movement: [, y] }) => {
                const curIndex = order.indexOf(originalIndex);
                const curRow = clamp(
                    Math.round((curIndex * 100 + y) / 100),
                    0,
                    props.items.length - 1
                );
                const newOrder = swap(order, curIndex, curRow);
                styles.ref.start(fn(newOrder, active, originalIndex, curIndex, y)); // Feed springs new style data, they'll animate the view without causing a single render
                if (!active) order = newOrder;
            });
        });
    });

    return (
        <div>
            <For each={styles()}>{({ zIndex, shadow, y, scale }, i) => (
                <animated.div
                    ref={(ref) => (divs[i()] = ref)}
                    style={{
                        "z-index": zIndex,
                        "box-shadow": shadow.to(
                            (s) => `rgba(0, 0, 0, 0.15) 0px ${s}px ${2 * s}px 0px`
                        ),
                        y,
                        scale
                    }}
                    children={props.items[i()]}
                />
            )}</For>
        </div>
    );
}

const App: VoidComponent = () => {
    return (
        <div>
            <DraggableList items={"Lorem ipsum dolor sit".split(" ")} />
        </div>
    )
}

export default App;