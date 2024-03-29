// @refresh reload
import "./root.css";
import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
  Link,
} from "solid-start";
import { SessionProvider } from "@solid-auth/base/client";
import { trpc, queryClient } from "~/utils/trpc";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>Fizika</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta name="theme-color" content="#026d56" />
        <Meta name="description" content="fizika.sc-nm.si" />
        <Link rel="icon" href="/images/scnm-logo.jpg" />
      </Head>
      <Body>
        <trpc.Provider queryClient={queryClient}>
          <SessionProvider>
            <Suspense fallback={<p>Sum ting wong</p>}>
              <ErrorBoundary>
                <Routes>
                  <FileRoutes />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </SessionProvider>
        </trpc.Provider>
        <Scripts />
      </Body>
    </Html>
  );
}
