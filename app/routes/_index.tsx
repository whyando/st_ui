import React from "react";
import { useRef } from "react";
import draw from "~/routes/draw";
import { json } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { useSocket } from "~/context";
import { ship_model, ship_symbol_base10 } from "~/ship_utils";
import { LoaderFunction } from "@remix-run/node";


function resizeCanvasToDisplaySize(canvas) {    
    const { width, height } = canvas.getBoundingClientRect()    
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
}

export let loader: LoaderFunction = async () => {
    const waypoints_req = async () => {
        const response = await fetch(`${process.env.API_URL}/api/waypoints`);
        return await response.json();
    }
    const ships_req = async () => {
        const response = await fetch(`${process.env.API_URL}/api/ships`);
        return await response.json();
    }
    const agent_req = async () => {
        const response = await fetch(`${process.env.API_URL}/api/agent`);
        return await response.json();
    }
    const [ agent, ships, waypoints ] = await Promise.all([
        agent_req(),
        ships_req(),
        waypoints_req(),
    ]);
    return json({
        waypoints,
        ships,
        agent,
    });
};

const getShipModelCounts = (system_symbol: string, ships: any[]) => {
    const ship_models: any = []
    ships.sort((a, b) => ship_symbol_base10(a.symbol) - ship_symbol_base10(b.symbol));
    const ships_filtered = ships.filter(s => s.nav.systemSymbol == system_symbol)
    for (let ship of ships_filtered) {
        const model = ship_model(ship);
        const existing = ship_models.find(s => s.model === model)
        if (existing) {
            existing.count += 1
        } else {
            ship_models.push({model, count: 1})
        }
    }
    return ship_models
}

export default function Index() {
    const socket = useSocket();
    const canvasRef = useRef(null);

    // universe coords
    const centerRef = useRef({})
    const zoomRef = useRef(1)

    // pixel coords
    const isMouseDownRef = useRef(false)
    const lastMousePosRef = useRef({x: 0, y: 0})
    const panRef = useRef({x: 0, y: 0});
    const shipsRef = useRef([])
    const filtersRef = useRef([])

    const { waypoints, agent: initialAgent, ships: initalShips } = useLoaderData<typeof loader>();
    const system_symbol = waypoints[0].systemSymbol
    const [agent, setAgent] = React.useState(initialAgent);
    const [ships, setShips] = React.useState(initalShips);
    const [dimensions, setDimensions] = React.useState({
        width: 0,
        height: 0,
    })

    // filters
    const [filters, setFilters] = React.useState({})

    const render = () => {   
        if (!canvasRef.current) return;
        const { height, width } = canvasRef.current.getBoundingClientRect();
        resizeCanvasToDisplaySize(canvasRef.current);
        const ctx = canvasRef.current.getContext('2d');
        const renderInfo = {
            zoom: zoomRef.current,
            pan: panRef.current,
        }
        draw(ctx, renderInfo, height, width, waypoints, shipsRef.current, filtersRef.current)
        requestAnimationFrame(render);
    }

    useEffect(() => {
        shipsRef.current = ships;
    }, [ships])
    useEffect(() => {
        filtersRef.current = filters;
    }, [filters])

    useEffect(() => {
        if (!socket) return;
        console.log('socket on index component', socket);

        const on_ship_upd = (ship: any) => {     
            setShips((ships: any[]) => {
                const idx = ships.findIndex((s) => s.symbol === ship.symbol);
                if (idx === -1) {
                    return [...ships, ship];
                }
                const new_ships = [...ships];
                new_ships[idx] = ship;
                return new_ships;
            })
        }
        const on_agent_upd = (agent: any) => {
            setAgent(agent);
        }
        socket.on('ship_upd', on_ship_upd)
        socket.on('agent_upd', on_agent_upd)

        return () => {
            socket.off('ship_upd', on_ship_upd);
            socket.off('agent_upd', on_agent_upd);
        };
    }, [socket]);

    React.useEffect(() => {
        if (!canvasRef.current) return;
        // render()
    }, [canvasRef, dimensions, ships, filters])

    const handleWheel = (e) => {
        // e.preventDefault();
        e.stopPropagation();
        if (!canvasRef.current) return;
        // TODO: either preserve center of map during zoom, or preserve point under cursor
        // const viewportMousePos = { x: e.clientX, y: e.clientY };
        // const topLeftCanvasPos = {
        //     x: canvasRef.current.offsetLeft,
        //     y: canvasRef.current.offsetTop
        // };
        zoomRef.current += e.deltaY * -0.001;
        zoomRef.current = Math.min(10, Math.max(1, zoomRef.current));
        // render()
    }
    const handleOnMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isMouseDownRef.current = true
        lastMousePosRef.current = {x: e.clientX, y: e.clientY}
    }
    const handleOnMouseMove = (e) => {
        if(!isMouseDownRef.current){return;}
        e.preventDefault();
        e.stopPropagation();
        const dx = e.clientX - lastMousePosRef.current.x
        const dy = e.clientY - lastMousePosRef.current.y
        panRef.current = {
            x: panRef.current.x + dx,
            y: panRef.current.y + dy,
        }
        lastMousePosRef.current = {x: e.clientX, y: e.clientY}
        // render()
    }
    const handleOnMouseUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isMouseDownRef.current = false
    }
    const handleOnMouseOut = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isMouseDownRef.current = false
    }

    React.useEffect(() => {
        render()
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const toggleModelVisibility = (model: string) => {
        setFilters((filters: any) => {
            const prev_value = (model in filters) ? filters[model].visible : true;
            return {...filters, [model]: {visible: !prev_value}}     
        })
    }

    const starter_system = agent.headquarters.split('-').slice(0, 2).join('-');
    const credits = agent.credits.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    const ship_counts = getShipModelCounts(system_symbol, ships)
    return (
        <div>
            {/* layer 0 */}
            <canvas className="absolute left-0 top-0 h-full w-full z-0"
                ref={canvasRef}
                onMouseDown={(e) =>{handleOnMouseDown(e)}}
                onMouseMove={(e) =>{handleOnMouseMove(e)}}
                onMouseUp={(e) =>{handleOnMouseUp(e)}}
                onMouseOut={(e) =>{handleOnMouseOut(e)}}
                onWheel={(e) =>{handleWheel(e)}}
            />
            {/* layer 1 */}
            <div className="absolute left-0 top-0 pointer-events-none">
                {/* top left */}
                <div className="m-2 min-w-60 bg-white rounded p-3 z-10 pointer-events-auto">
                    <div>
                        <div>{agent.symbol}</div>
                        <div>Starting System: {starter_system}</div>
                        <div>Credits: {credits}</div>
                        <div>Ships: {agent.shipCount}</div>
                    </div>
                </div>
            </div>
            <div className="absolute left-0 top-0 w-full pointer-events-none">
                {/* top of the screen */}
                <div className="my-5 mx-auto w-1/2 z-10 bg-white rounded p-3 pointer-events-auto justify-between">                
                    System: {system_symbol}<br/>
                    <div className="flex flex-wrap">
                    {
                        ship_counts.map(({model, count }) => {
                            const visible = (model in filters) ? filters[model].visible : true;
                            const textClass = visible ? "underline" : "line-through";
                            return(<div key={model} className = "px-2 select-none">
                                <span className={textClass} onClick={() => toggleModelVisibility(model)}>{model}</span> ({count})
                            </div>)
                        })
                    }
                    </div>
                </div>
            </div>
        </div>
    );
}
