import type { VoidComponent } from "solid-js";
import { animated, config, createSprings } from "solid-spring";
import { DragGesture } from "@use-gesture/vanilla";
import { For, onMount } from "solid-js";
import { useDrag } from "solid-gesture";

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function swap<T>(array: T[], moveIndex: number, toIndex: number) {
    const item = array[moveIndex];
    const length = array.length;
    const diff = moveIndex - toIndex;

    if (diff > 0) {
        // move left
        return [
            ...array.slice(0, toIndex),
            item,
            ...array.slice(toIndex, moveIndex),
            ...array.slice(moveIndex + 1, length)
        ];
    } else if (diff < 0) {
        // move right
        const targetIndex = toIndex + 1;
        return [
            ...array.slice(0, moveIndex),
            ...array.slice(moveIndex + 1, targetIndex),
            item,
            ...array.slice(targetIndex, length)
        ];
    }
    return array;
}

function getSpringsProps(
    order: number[],
    active = false,
    originalIndex = 0,
    curIndex = 0,
    y = 0
) {
    const func = (index: number) => {
        let props;

        if (active && index === originalIndex) {
            props = {
                y: curIndex * 100 + y,
                scale: 1.1,
                zIndex: 1,
                shadow: 15,
                immediate: (key: string) => key === "z-index",
                config: (key: string) => (key === "y" ? config.stiff : config.default)
            }
        }
        else {
            props = {
                y: order.indexOf(index) * 100,
                scale: 1,
                zIndex: 0,
                shadow: 1,
                immediate: false
            }
        }

        return props;
    }

    return func;
}

const DraggableList = (props: { items: string[] }) => {
    let order = props.items.map((_, index) => index); // Store indicies as a local ref, this represents the item order
    const divs: HTMLDivElement[] = [];

    const styles = createSprings(props.items.length, getSpringsProps(order)); // Create springs, each corresponds to an item, controlling its transform, scale, etc.
    styles.ref

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
                styles.ref.start(getSpringsProps(newOrder, active, originalIndex, curIndex, y)); // Feed springs new style data, they'll animate the view without causing a single render
                if (!active) order = newOrder;
            });
        });
    });

    return (
        <div class="w-96" style={{
            "height": (props.items.length * 100).toString() + "px",
        }}>
            <For each={styles()}>{({ zIndex, shadow, y, scale }, i) => (
                <animated.div
                    ref={(ref) => (divs[i()] = ref)}
                    class="absolute w-96 h-20 origin-[50% 50% 0px] rounded pl-8 touch-none select-none bg-slate-500"
                    style={{
                        "z-index": zIndex.to((z) => z.toString()),
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
        <div class="flex justify-center items-center w-full h-screen">
            <DraggableList items={"Lorem ipsum dolor sit".split(" ")} />
        </div>
    )
}

export default App;