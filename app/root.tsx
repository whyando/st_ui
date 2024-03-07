import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import io from "socket.io-client";
import { SocketProvider } from "~/context";
import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export async function loader() {
  return json({
    ENV: {
      API_URL: process.env.API_URL,
    },
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    console.log('open socket');
    const socket = io(window.ENV.API_URL, {
      path: "/api/events",
      transports: ["websocket"],
      addTrailingSlash: false,
    });
    socket.on("connect", () => {
      console.log('socket connected');
      setSocket(socket);
    });
    socket.on("disconnect", () => {
      console.log('socket disconnected');
      setSocket(undefined);
    })
    socket.onAny((eventName, ...args) => {
      // console.log(eventName, args);
    });
    return () => {
      console.log('close socket');
      socket.close();
    };
  }, []);

  return (
    <html lang="en" className = "h-full w-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className = "h-full w-full">
        <SocketProvider socket={socket}>
          <Outlet />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(
                data.ENV
              )}`,
            }}
          />
        </SocketProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
