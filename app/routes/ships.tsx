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

const percent = (x: number) => {
  return `${Math.round(10000 * x) / 100}%`  
}


function ShipRow({ ship: _ship } : { ship: any}) {
  const { symbol, ship, job_id, desc } = _ship;
  const cargo = ship.cargo.inventory.map((c: any) => `${c.symbol} (${c.units})`).join(', ');
  return (
    <tr>
      <td>{ship_symbol_base10(symbol)}</td>
      <td>{symbol}</td>
      <td>{ship_model(ship)}</td>
      <td>{job_id}</td>
      <td>{ship.nav.status}</td>
      <td>{ship.nav.waypointSymbol}</td>
      <td>{cargo}</td>
      <td>{percent(ship.frame.condition)} / {percent(ship.engine.condition)} / {percent(ship.reactor.condition)}</td>
      <td>{percent(ship.frame.integrity)} / {percent(ship.engine.integrity)} / {percent(ship.reactor.integrity)}</td>
      <td>{desc}</td>
    </tr>
  );
}


export default function ShipsPage() {
  const socket = useSocket();
  const [ships, setShips] = useState<any[]>([]);

  useEffect(() => {
    const fetchShips = async () => {
      try {
        const uri = `${window.ENV.API_URL}/api/ships`;
        const response = await fetch(uri);
        const data = await response.json();
        setShips(data);
      } catch (error) {
        console.error('Error fetching ships:', error);
      }
    };

    fetchShips();
  }, []);

  useEffect(() => {
    if (!socket) return;
    console.log('socket on ship component', socket);

    const on_ship_upd = (ship: any) => {     
      setShips((ships: any[]) => {
          const idx = ships.findIndex((s) => s.symbol === ship.symbol);
          if (idx === -1) {
              return [...ships, { symbol: ship.symbol, ship, job_id: '', desc: '' }];
          }
          const new_ships = [...ships];
          new_ships[idx].ship = ship;
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
          <th>Job</th>
          <th>Status</th>
          <th>Waypoint</th>
          <th>Cargo</th>
          <th>Condition FER</th>
          <th>Integrity FER</th>
          <th>Desc</th>
        </tr>
      {ships.map((ship: any) => (
        <ShipRow key={ship.id} ship={ship} />
      ))}
      </table>
    </div>
  );
}
