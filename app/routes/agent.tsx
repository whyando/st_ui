import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { useSocket } from "~/context";

export const loader = async () => {
  const uri = 'https://red1.whyando.com/api/agent';
  const response = await fetch(uri);
  const data = await response.json();
  return json(data);
};

export const meta: MetaFunction = () => {
  return [
    { title: "Spacetraders - WHYANDO" },
    { name: "description", content: "Spacetraders dashboard." },
  ];
};

export default function Index() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    console.log('socket on agent component', socket);
  }, [socket]);


  const agent = useLoaderData<typeof loader>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <b>Agent</b>
      <div>Symbol: {agent.symbol}</div>
      <div>Headquarters: {agent.headquarters}</div>
      <div>Credits: {agent.credits}</div>
      <div>Starting Faction: {agent.startingFaction}</div>
      <div>Ship Count: {agent.shipCount}</div>
    </div>
  );
}
