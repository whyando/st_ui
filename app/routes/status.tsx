import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useSocket } from "~/context";

export default function StatusPage() {
  const socket = useSocket();
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    let i = 0
    let sent = Array(10).fill(0);
    let received = Array(10).fill(0);
    const emit_ping = () => {
        socket.emit('ping', i);
        sent[i] = new Date().getTime();
        i = (i + 1) % 10;
    }
    emit_ping()
    let timer = setInterval(() => emit_ping(), 1000);
    const on_pong = (data: number) => {
        received[data] = new Date().getTime();
        const latency = received[data] - sent[data];
        // console.log(`latency ${data}: ${latency}ms`);
        setLatency(latency);
    }

    socket.on('pong', on_pong)
    return () => {
        clearInterval(timer);
        socket.off('pong', on_pong);
    };
  }, [socket]);

  return (<div>
    <b>Status</b>
    <div>Connected: {socket?.connected ? 'True' : 'False'}</div>
    <div>Latency: {latency}ms</div>
    <div></div>
  </div>);
}
