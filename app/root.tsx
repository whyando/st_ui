import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import io from "socket.io-client";

import { SocketProvider } from "~/context";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export default function App() {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    console.log('open socket');
    const socket = io("https://red1.whyando.com", {
      path: "/api/events",
      transports: ["websocket"],
      addTrailingSlash: false,
    });
    socket.on("connect", () => {
      console.log('socket connected');
      // socket.emit('ping', 'ping')
      setSocket(socket);
    });
    socket.on("disconnect", () => {
      console.log('socket disconnected');
    })
    socket.onAny((eventName, ...args) => {
      console.log(eventName, args);
    });
    return () => {
      console.log('close socket');
      socket.close();
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <SocketProvider socket={socket}>
          <Outlet />
        </SocketProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
