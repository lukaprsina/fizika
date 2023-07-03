import type { VoidComponent } from "solid-js"
import { Equation, System } from "~/components/MathDisplay"

const MathDemo: VoidComponent = () => {
    return <>
        <System variables={
            {
                "r": { exact: 100 },
                "F": { low: 150, high: 160 }
            }
        }>
            <p>
                <Equation latex="r" />
                {' '}is{' '}
                <Equation latex="r" calculate />,{' '}
                <Equation latex="F" />
                {' '}is{' '}
                <Equation latex="F" calculate />,{' '}
                <Equation latex="r+F" />
                {' '}is{' '}
                <Equation latex="r+F" calculate />
            </p>
        </System >
        <System variables={
            {
                "r": { exact: 200 },
                "F": { low: 250, high: 260 }
            }
        }>
            <p>
                <Equation latex="\frac{\pi}{2}" full />
                <Equation latex="r" />
                {' '}is{' '}
                <Equation latex="r" calculate />,{' '}
                <Equation latex="F" />
                {' '}is{' '}
                <Equation latex="F" calculate />,{' '}
                <Equation latex="r+F" />
                {' '}is{' '}
                <Equation latex="r+F" calculate />
            </p>
        </System>
    </>
}

export default MathDemo