import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useSocket } from "~/context";
import { ship_model, ship_symbol_base10 } from "~/ship_utils";
import styles from "~/styles.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export const loader = async () => {
  const uri = `${process.env.API_URL}/api/ships`;
  const response = await fetch(uri);
  const data = await response.json();
  return json(data);
};

function ShipRow({ ship } : { ship: any}) {
  const cargo = ship.cargo.inventory.map((c: any) => `${c.symbol} (${c.units})`).join(', ');
  return (
    <tr>
      <td>{ship_symbol_base10(ship.symbol)}</td>
      <td>{ship.symbol}</td>
      <td>{ship_model(ship)}</td>
      <td>{ship.nav.status}</td>
      <td>{ship.nav.waypointSymbol}</td>
      <td>{cargo}</td>
    </tr>
  );
}


export default function ShipsPage() {
  const socket = useSocket();
  const ships_initial = useLoaderData<typeof loader>();
  const [ships, setShips] = useState<any[]>(ships_initial);

  useEffect(() => {
    if (!socket) return;
    console.log('socket on ship component', socket);

    const on_ship_upd = (ship: any) => {      
      // console.log(`${ship.symbol} updated`)
      setShips((ships) => {
        const idx = ships.findIndex((s) => s.symbol === ship.symbol);
        if (idx === -1) {
          return [...ships, ship];
        }
        const new_ships = [...ships];
        new_ships[idx] = ship;
        return new_ships;
      })
    }
    socket.on('ship_upd', on_ship_upd)
    return () => {
      socket.off('ship_upd', on_ship_upd);
    };
  }, [socket]);


  ships.sort((a, b) => ship_symbol_base10(a.symbol) - ship_symbol_base10(b.symbol));

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <b>Ships</b>
      <table>
        <tr>
          <th></th>
          <th>Symbol</th>
          <th>Model</th>
          <th>Status</th>
          <th>Waypoint</th>
          <th>Cargo</th>
        </tr>
      {ships.map((ship: any) => (
        <ShipRow key={ship.id} ship={ship} />
      ))}
      </table>
    </div>
  );
}
