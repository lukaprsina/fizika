import type { VoidComponent } from "solid-js"
import { Equation, System, compute_engine } from "~/components/MathDisplay"

const MathDemo: VoidComponent = () => {
    const expr1 = compute_engine.parse("F_{test}=m_{posode} \\cdot g +p\\cdot S").canonical
    const expr2 = compute_engine.parse("F_{test}").canonical
    const expr3 = compute_engine.parse("F_{test}=m_{posode} \\cdot g +p\\cdot S=1").canonical
    // console.log(expr3.json)

    // TODO: replace all cdot with *, a=b=c gives array ["Equal", a, b, c]

    if (expr1.head == "Equal") {
        /* for (const expr of expr1.getSubexpressions("Equal")) {
            console.log(expr.latex)
        } */

        const expr1_lhs = expr1.json[1];
        const boxedExpression = compute_engine.box(expr1_lhs);
        // console.log(boxedExpression.latex)
        // console.log(expr1.subexpressions)
        // console.log(expr2.latex)
    }

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