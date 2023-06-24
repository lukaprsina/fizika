import type { Component } from "solid-js";
import { A } from "solid-start";

const Footer: Component = () => {
    return (
        <>
            <div class="h-[200px] -z-20" />
            <footer class="fixed bottom-0 left-0 right-0 h-[200px] z-10 flex py-5 justify-around">
                <A href="/account">Account</A>
            </footer>
        </>
    )
}

export default Footer;